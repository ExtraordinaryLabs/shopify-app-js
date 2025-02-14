import {redirect} from '@remix-run/server-runtime';

import {BasicParams} from '../../../types';

export const redirectToBouncePage = (params: BasicParams, url: URL): never => {
  const {config} = params;

  // Make sure we always point to the configured app URL so it also works behind reverse proxies (that alter the Host
  // header).
  url.searchParams.set(
    'shopify-reload',
    `${config.appUrl}${url.pathname}${url.search}`,
  );

  // eslint-disable-next-line no-warning-comments
  // TODO Make sure this works on chrome without a tunnel (weird HTTPS redirect issue)
  // https://github.com/orgs/Shopify/projects/6899/views/1?pane=issue&itemId=28376650
  throw redirect(`${config.auth.patchSessionTokenPath}${url.search}`);
};
