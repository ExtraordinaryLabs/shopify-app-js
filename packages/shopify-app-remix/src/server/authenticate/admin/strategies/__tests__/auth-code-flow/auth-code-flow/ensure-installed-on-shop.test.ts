import {LogSeverity, SESSION_COOKIE_NAME} from '@shopify/shopify-api';

import {shopifyApp} from '../../../../../..';
import {
  API_KEY,
  APP_URL,
  BASE64_HOST,
  GRAPHQL_URL,
  SHOPIFY_HOST,
  TEST_SHOP,
  expectBeginAuthRedirect,
  expectExitIframeRedirect,
  getJwt,
  getThrownResponse,
  setUpValidSession,
  testConfig,
  signRequestCookie,
  mockExternalRequest,
} from '../../../../../../__test-helpers';

describe('authorize.admin doc request path', () => {
  describe('errors', () => {
    it('redirects to auth when not embedded and there is no offline session', async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(config);

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(`${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`),
      );

      // THEN
      expectBeginAuthRedirect(config, response);
    });

    it('redirects to exit-iframe when embedded and there is no offline session', async () => {
      // GIVEN
      const shopify = shopifyApp(testConfig());

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(
          `${APP_URL}?embedded=1&shop=${TEST_SHOP}&host=${BASE64_HOST}`,
        ),
      );

      // THEN
      expectExitIframeRedirect(response);
    });

    it('redirects to auth when not embedded on an embedded app, and the API token is invalid', async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(config);
      await setUpValidSession(shopify.sessionStorage);

      await mockExternalRequest({
        request: new Request(GRAPHQL_URL, {method: 'POST'}),
        response: new Response(undefined, {status: 401}),
      });

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(`${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`),
      );

      // THEN
      expectBeginAuthRedirect(config, response);
    });

    it('returns non-401 codes when not embedded on an embedded app and the request fails', async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(config);
      await setUpValidSession(shopify.sessionStorage);

      await mockExternalRequest({
        request: new Request(GRAPHQL_URL, {method: 'POST'}),
        response: new Response(
          JSON.stringify({errors: [{message: 'Something went wrong!'}]}),
          {status: 500, statusText: 'Internal Server Error'},
        ),
      });

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(`${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`),
      );

      // THEN
      expect(response.status).toBe(500);
      expect(config.logger?.log).toHaveBeenCalledWith(
        LogSeverity.Error,
        expect.stringContaining('Something went wrong!'),
      );
    });

    it('returns a 500 when not embedded on an embedded app and the request fails', async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(config);
      await setUpValidSession(shopify.sessionStorage);

      await mockExternalRequest({
        request: new Request(GRAPHQL_URL, {method: 'POST'}),
        response: new Response(
          JSON.stringify({errors: ['Something went wrong!']}),
        ),
      });

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(`${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`),
      );

      // THEN
      expect(response.status).toBe(500);
      expect(config.logger!.log).toHaveBeenCalledWith(
        LogSeverity.Error,
        expect.stringContaining('Something went wrong!'),
      );
    });

    it("redirects to the embedded app URL if there is a valid session but the app isn't embedded yet", async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(testConfig());
      await setUpValidSession(shopify.sessionStorage);

      await mockExternalRequest({
        request: new Request(GRAPHQL_URL, {method: 'POST'}),
        response: new Response(undefined, {status: 200}),
      });

      // WHEN
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(`${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`),
      );

      // THEN
      const {hostname, pathname} = new URL(response.headers.get('location')!);

      expect(response.status).toBe(302);
      expect(hostname).toBe(SHOPIFY_HOST);
      expect(pathname).toBe(`/apps/${API_KEY}`);
    });

    it('redirects to exit-iframe if app is embedded and there is no session for the id_token when embedded', async () => {
      // GIVEN
      const shopify = shopifyApp(testConfig());
      await setUpValidSession(shopify.sessionStorage);
      const otherShopDomain = 'other-shop.myshopify.io';

      // WHEN
      const {token} = getJwt({dest: `https://${otherShopDomain}`});
      const response = await getThrownResponse(
        shopify.authenticate.admin,
        new Request(
          `${APP_URL}?embedded=1&shop=${TEST_SHOP}&host=${BASE64_HOST}&id_token=${token}`,
        ),
      );

      // THEN
      expectExitIframeRedirect(response, {shop: otherShopDomain});
    });

    // manageAccessToken or ensureInstalledOnShop
    it('redirects to auth if there is no session cookie for non-embedded apps when at the top level', async () => {
      // GIVEN
      const config = testConfig();
      const shopify = shopifyApp(testConfig({isEmbeddedApp: false}));
      await setUpValidSession(shopify.sessionStorage);

      // WHEN
      const request = new Request(
        `${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`,
      );

      const response = await getThrownResponse(
        shopify.authenticate.admin,
        request,
      );

      // THEN
      expectBeginAuthRedirect(config, response);
    });

    it('redirects to auth if there is no session for non-embedded apps when at the top level', async () => {
      // GIVEN
      const config = testConfig({isEmbeddedApp: false});
      const shopify = shopifyApp(config);
      await setUpValidSession(shopify.sessionStorage);

      // WHEN
      const request = new Request(
        `${APP_URL}?shop=${TEST_SHOP}&host=${BASE64_HOST}`,
      );
      signRequestCookie({
        request,
        cookieName: SESSION_COOKIE_NAME,
        cookieValue: 'other-session-id',
      });

      const response = await getThrownResponse(
        shopify.authenticate.admin,
        request,
      );

      // THEN
      expectBeginAuthRedirect(config, response);
    });
  });

  // manageAccessToken & ensureInstalledOnShop
  it('loads a session from the cookie from a request with no search params when not embedded', async () => {
    // GIVEN
    const shopify = shopifyApp(testConfig({isEmbeddedApp: false}));
    const testSession = await setUpValidSession(shopify.sessionStorage);

    // WHEN
    const request = new Request(APP_URL);
    signRequestCookie({
      request,
      cookieName: SESSION_COOKIE_NAME,
      cookieValue: testSession.id,
    });

    const {session} = await shopify.authenticate.admin(request);

    // THEN
    expect(session).toBe(testSession);
  });
});
