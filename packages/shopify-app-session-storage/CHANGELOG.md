# @shopify/shopify-app-session-storage

## 2.0.2

### Patch Changes

- 3685bd4: Bump shopify-api to ^8.1.1

## 2.0.1

### Patch Changes

- 6d12840: Updating dependencies on @shopify/shopify-api

## 2.0.0

### Major Changes

- f837060: **Removed support for Node 14**

  Node 14 has reached its [EOL](https://endoflife.date/nodejs), and dependencies to this package no longer work on Node 14.
  Because of that, we can no longer support that version.

  If your app is running on Node 14, you'll need to update to a more recent version before upgrading this package.

  This upgrade does not require any code changes.

### Patch Changes

- a69d6fc: Updating dependency on @shopify/shopify-api to v.8.0.1

## 1.1.10

### Patch Changes

- 616388d: Updating dependency on @shopify/shopify-api to 7.7.0

## 1.1.9

### Patch Changes

- 5b862fe: Upgraded shopify-api dependency to 7.6.0

## 1.1.8

### Patch Changes

- 346b623: Updating dependency on @shopify/shopify-api

## 1.1.7

### Patch Changes

- 13b9048: Updating @shopify/shopify-api dependency to the latest version

## 1.1.6

### Patch Changes

- 32296d7: Update @shopify/shopify-api dependency to 7.5.0

## 1.1.5

### Patch Changes

- 93e9126: Updating @shopify/shopify-api dependency

## 1.1.4

### Patch Changes

- b3453ff: Bumping @shopify/shopify-api dependency to latest version

## 1.1.3

### Patch Changes

- e1d4f4f: Add @shopify/shopify-api as a peerDependencies entry for each session-storage package, to avoid API library conflicts (e.g., scopesArray.map error). Should help avoid issues like #93
- 1d007e8: Bumps [@shopify/shopify-api](https://github.com/Shopify/shopify-api-js) from 7.0.0 to 7.1.0. See `@shopify/shopify-api`'s [changelog](https://github.com/Shopify/shopify-api-js/blob/main/packages/shopify-api/CHANGELOG.md) for more details.

## 1.1.2

### Patch Changes

- e4f3415: Bump @shopify/shopify-api from 6.2.0 to 7.0.0. See [changelog](https://github.com/Shopify/shopify-api-js/blob/main/packages/shopify-api/CHANGELOG.md) for details.

## 1.1.1

### Patch Changes

- 97346b3: Fix #132: mysql migrator was unable to detect already applied migrations

## 1.1.0

### Minor Changes

- becc305: Migrations capabilities that can handle persistence changes for all session storage implementations

### Patch Changes

- b6501b0: Bump typescript to 4.9.5

## 1.0.2

### Patch Changes

- 222b755: Updating @shopify/shopify-api to v6.1.0

## 1.0.1

### Patch Changes

- 866b50c: Update dependencies on shopify-api v6.0.2

## 1.0.0

### Major Changes

- Initial public release of @shopify/shopify-app-session-storage
