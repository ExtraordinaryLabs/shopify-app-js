# @shopify/shopify-app-remix

## 2.2.0

### Minor Changes

- d92f828: Refactor AuthStrategy to extract OAuth authorization code flow behaviour into a separate class.

### Patch Changes

- 8c36e82: Fixing a bug in the GraphQL client that could cause specific builds to fail, because we used `query` for both the function and argument names.
- 9d0fc6f: Now `authenticate.webhook(request);` will return 401 Unauthorized when webhook HMAC validation fails.
- 3685bd4: Bump shopify-api to ^8.1.1
- Updated dependencies [3685bd4]
  - @shopify/shopify-app-session-storage@2.0.2

## 2.1.0

### Minor Changes

- f34eefd: Added v3_authenticatePublic feature flag to remove `authenticate.public(request)`.

  Apps can opt in to the new future at any time, so this is not a breaking change until version 3.

    <details>
      <summary>See an example</summary>

  Without the `v3_authenticatePublic` future flag the deprecated `authenticate.public(request)` is supported:

  ```ts
  await authenticate.public.checkout(request);
  await authenticate.public.appProxy(request);

  // Deprecated.  Use authenticate.public.checkout(request) instead
  await authenticate.public(request);
  ```

  With the `v3_authenticatePublic` future flag enabled the deprecated `authenticate.public(request)` is not supported:

  ```ts
  await authenticate.public.checkout(request);
  await authenticate.public.appProxy(request);
  ```

    </details>

## 2.0.2

### Patch Changes

- ee7114a: Fixed the errorBoundary to work with new cases in Remix v2. Thank you @btomaj!

## 2.0.1

### Patch Changes

- 6d12840: Updating dependencies on @shopify/shopify-api
- Updated dependencies [6d12840]
  - @shopify/shopify-app-session-storage@2.0.1

## 2.0.0

### Major Changes

- f837060: **Removed support for Node 14**

  Node 14 has reached its [EOL](https://endoflife.date/nodejs), and dependencies to this package no longer work on Node 14.
  Because of that, we can no longer support that version.

  If your app is running on Node 14, you'll need to update to a more recent version before upgrading this package.

  This upgrade does not require any code changes.

### Minor Changes

- a1b3393: Added support for `future` flags in the `shopifyApp` function, with a `v3_webhookContext` flag to have `authenticate.webhook` return a standard `admin` context, instead of a different type.

  Apps can opt in to the new future at any time, so this is not a breaking change (yet).

  <details>
    <summary>See an example</summary>

  Without the `v3_webhookContext` flag, `graphql` provides a `query` function that takes the query string as the `data` param.
  When using variables, `data` needs to be an object containing `query` and `variables`.

  ```ts
  import {json, ActionFunctionArgs} from '@remix-run/node';
  import {authenticate} from '../shopify.server';

  export async function action({request}: ActionFunctionArgs) {
    const {admin} = await authenticate.webhook(request);

    const response = await admin?.graphql.query<any>({
      data: {
        query: `#graphql
        mutation populateProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
            }
          }
        }`,
        variables: {input: {title: 'Product Name'}},
      },
    });

    const productData = response?.body.data;
    return json({data: productData.data});
  }
  ```

  With the `v3_webhookContext` flag enabled, `graphql` _is_ a function that takes in the query string and an optional settings object, including `variables`.

  ```ts
  import {ActionFunctionArgs} from '@remix-run/node';
  import {authenticate} from '../shopify.server';

  export async function action({request}: ActionFunctionArgs) {
    const {admin} = await authenticate.webhook(request);

    const response = await admin?.graphql(
      `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
          }
        }
      }`,
      {variables: {input: {title: 'Product Name'}}},
    );

    const productData = await response.json();
    return json({data: productData.data});
  }
  ```

  </details>

### Patch Changes

- afb0a7d: Updating Remix dependencies to v2.
- a69d6fc: Updating dependency on @shopify/shopify-api to v.8.0.1
- Updated dependencies [f837060]
- Updated dependencies [a69d6fc]
  - @shopify/shopify-app-session-storage@2.0.0

## 1.3.0

### Minor Changes

- 6ac6832: Added the storefront GraphQL client.

  The storefront API client can be accessed in two ways

  <details>
    <summary>App Proxy</summary>

  ```ts
  import {json} from '@remix-run/node';
  import {authenticate} from '~/shopify.server';

  export async function loader({request}) {
    const {storefront} = await authenticate.public.appProxy(request);
    const response = await storefront.graphql('{blogs(first: 10) {nodes{id}}}');

    return json(await response.json());
  }
  ```

  </details>

  <details>
    <summary>Unauthenticated Storefront</summary>

  ```ts
  import {json} from '@remix-run/node';
  import {unauthenticated} from '~/shopify.server';
  import {customAuthenticateRequest} from '~/helpers';

  export async function loader({request}) {
    await customAuthenticateRequest(request);

    const {storefront} = await unauthenticated.storefront(
      'my-shop.myshopify.com',
    );
    const response = await storefront.graphql('{blogs(first: 10) {nodes{id}}}');

    return json(await response.json());
  }
  ```

  </details>

### Patch Changes

- 64fe70b: Allow all billing config overrides at request time.

  <details>
    <summary>Override billing configs when calling <code>request</code></summary>

  ```ts
  import {json} from '@remix-run/node';
  import {authenticate} from '~/shopify.server';

  export async function loader({request}) {
    const {billing} = await authenticate.admin(request);

    await billing.require({
      plans: ['plan1', 'plan2'],
      onFailure: async () =>
        await billing.request({
          plan: 'plan1',
          trialDays: 5, // Override the trialDays config value
        }),
    });

    return json(await response.json());
  }
  ```

  </details>

- 616388d: Updating dependency on @shopify/shopify-api to 7.7.0
- Updated dependencies [616388d]
  - @shopify/shopify-app-session-storage@1.1.10

## 1.2.1

### Patch Changes

- bffcee9: Fix type error. Previously `authenticate.appProxy()` was typed as if it could return an object without session and admin properties. This was incorrect. Those properties will always exist, they may just be undefined.

## 1.2.0

### Minor Changes

- 43e7058: Added `authenticate.public.appProxy()` for authenticating [App Proxy](https://shopify.dev/docs/apps/online-store/app-proxies) requests.

  <details>
    <summary>Returning a liquid response</summary>

  ```ts
  // app/routes/**\/.ts
  import {authenticate} from '~/shopify.server';

  export async function loader({request}) {
    const {liquid, admin} = authenticate.public.appProxy(request);

    return liquid('Hello {{shop.name}}');
  }
  ```

  </details>

  <details>
    <summary>Using the Admin GraphQL API</summary>

  ```ts
  // app/routes/**\/.ts
  import {authenticate} from '~/shopify.server';

  export async function loader({request}) {
    const {liquid, admin} = authenticate.public.appProxy(request);

    const response = await admin.graphql('QUERY');
    const json = await response.json();

    return json(json);
  }
  ```

  </details>

- 43e7058: Copied `authenticate.public()` to `authenticate.public.checkout()` and marked `authenticate.public()` as deprecated. `authenticate.public()` will continue to work until v3

### Patch Changes

- 0acfd52: Remove trailing slashes from shop domains when handling login form requests.
- 19696a0: Fixed an issue when running the app behind a reverse proxy that rewrites the `Host` header, where the bounce flow redirect (to ensure the id_token search param is present) relied on the incoming request URL and pointed to the internal host rather than the external one.
- Updated dependencies [5b862fe]
  - @shopify/shopify-app-session-storage@1.1.9

## 1.1.0

### Minor Changes

- 370fc5e: - Internally rearranged source files to create a better separation between backend and frontend code, so we can add frontend-specific exports.

  - A new export path `@shopify/shopify-app-remix/react` will now contain those frontend exports.
  - The existing server code will be moved to `@shopify/shopify-app-remix/server`, but the root import will still work until the next major release in the future.

- 7bc32b1: Added a way to get an admin context without authenticating.

  **Warning** This should only be used for Requests that do not originate from Shopify.
  You must do your own authentication before using this method.

  <details>
    <summary>See an example</summary>

  ```ts
  // app/shopify.server.ts
  import {shopifyApp} from '@shopify/shopify-app-remix';
  import {restResources} from '@shopify/shopify-api/rest/admin/2023-04';

  const shopify = shopifyApp({
    restResources,
    // ...etc
  });

  export default shopify;

  // app/routes/\/.jsx
  import {json} from '@remix-run/node';
  import {authenticateExternalRequest} from '~/helpers/authenticate';
  import shopify from '../../shopify.server';

  export async function loader({request}) {
    const shop = await authenticateExternalRequest(request);
    const {admin, session} = await shopify.unauthenticated.admin(shop);

    return json(await admin.rest.resources.Product.count({session}));
  }
  ```

  </details>

- 191241b: Adding a new `redirect` helper to the `EmbeddedAdminContext` type, which will be able to redirect to the given URL regardless of where an embedded app request is being served.

  You can also use it to redirect to an external page out of the Shopify Admin by using the `target` option.

  <details>
    <summary>See an example</summary>

  ```ts
  export const loader = async ({request}) => {
    const {redirect} = await authenticate.admin(request);

    return redirect('https://www.example.com', {target: '_top'});
  };
  ```

  </details>

- f5f1f83: Adding `AppProvider` component to abstract Shopify-specific app setup on the frontend side.
  This makes it easier for apps to set up the components it needs to work with Shopify.

  <details>
    <summary>See an example</summary>

  To make use of this in the Remix app template, you can update your `app/routes/app.jsx` file's `App` component from

  ```ts
  export default function App() {
    const {apiKey, polarisTranslations} = useLoaderData();

    return (
      <>
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={apiKey}
        />
        <ui-nav-menu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <Link to="/app/additional">Additional page</Link>
        </ui-nav-menu>
        <PolarisAppProvider
          i18n={polarisTranslations}
          linkComponent={RemixPolarisLink}
        >
          <Outlet />
        </PolarisAppProvider>
      </>
    );
  }

  /** @type {any} */
  const RemixPolarisLink = React.forwardRef((/** @type {any} */ props, ref) => (
    <Link {...props} to={props.url ?? props.to} ref={ref}>
      {props.children}
    </Link>
  ));
  ```

  to

  ```ts
  import {AppProvider} from '@shopify/shopify-app-remix/react';

  export default function App() {
    const {apiKey} = useLoaderData();

    return (
      <AppProvider isEmbeddedApp apiKey={apiKey}>
        <ui-nav-menu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <Link to="/app/additional">Additional page</Link>
        </ui-nav-menu>
        <Outlet />
      </AppProvider>
    );
  }
  ```

  </details>

### Patch Changes

- 346b623: Updating dependency on @shopify/shopify-api
- 14e8019: Enable `authenticate.public` to handle post-purchase extension requests by supporting extra CORS headers and fixing session token verification.
- Updated dependencies [346b623]
  - @shopify/shopify-app-session-storage@1.1.8

## 1.0.4

### Patch Changes

- 13b9048: Updating @shopify/shopify-api dependency to the latest version
- ebce92f: Re-export ApiVersion object from shopify-api
- Updated dependencies [13b9048]
  - @shopify/shopify-app-session-storage@1.1.7

## 1.0.3

### Patch Changes

- e9cefea: Fixing issue when authenticating requests without a `shop` search param to non-embedded apps.

## 1.0.2

### Patch Changes

- 2d087a4: authenticate.webhook now returns context when there is no session for the corresponding shop instead of throwing a 404 Response

## 1.0.1

### Patch Changes

- 92205c2: Fixing small issue in the README

## 1.0.0

Initial release of the @shopify/shopify-app-remix package 🎉
