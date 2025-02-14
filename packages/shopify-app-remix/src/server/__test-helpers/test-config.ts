import {
  LATEST_API_VERSION,
  LogSeverity,
  ShopifyRestResources,
} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {MemorySessionStorage} from '@shopify/shopify-app-session-storage-memory';

import type {AppConfigArg} from '../config-types';
import type {FutureFlagOptions, FutureFlags} from '../future/flags';

import {API_KEY, API_SECRET_KEY, APP_URL} from './const';

/*
 * This object mandates that all existing future flags be activated for tests. If a new flag is added, this object must
 * be updated to include it, which will also cause all tests to use the new behaviour by default (and likely fail).
 *
 * This way, we'll always ensure our tests are covering all future flags. Please make sure to also have tests for the
 * old behaviour.
 */
const TEST_FUTURE_FLAGS: Required<{[key in keyof FutureFlags]: true}> = {
  v3_authenticatePublic: true,
  v3_webhookAdminContext: true,
} as const;

const TEST_CONFIG = {
  apiKey: API_KEY,
  apiSecretKey: API_SECRET_KEY,
  scopes: ['testScope'] as any,
  apiVersion: LATEST_API_VERSION,
  appUrl: APP_URL,
  logger: {
    log: jest.fn(),
    level: LogSeverity.Debug,
  },
  isEmbeddedApp: true,
  sessionStorage: new MemorySessionStorage(),
  future: TEST_FUTURE_FLAGS,
} as const;

// Reset the config object before each test
beforeEach(() => {
  TEST_CONFIG.logger.log.mockReset();
  (TEST_CONFIG as any).sessionStorage = new MemorySessionStorage();
});

export function testConfig<
  Overrides extends TestOverridesArg<Future>,
  Future extends FutureFlagOptions,
>(
  {future, ...overrides}: Overrides & {future?: Future} = {} as Overrides & {
    future?: Future;
  },
): TestConfig<Overrides, Future> {
  return {
    ...TEST_CONFIG,
    ...overrides,
    logger: {
      ...TEST_CONFIG.logger,
      ...(overrides as NonNullable<Overrides>).logger,
    },
    future: {
      ...TEST_CONFIG.future,
      ...future,
    },
  } as any;
}

/*
 * This type combines both passed in types, by ignoring any keys from Type1 that are present (and not undefined)
 * in Type2, and then adding any keys from Type1 that are not present in Type2.
 *
 * This effectively enables us to create a type that is the const TEST_CONFIG below, plus any overrides passed in with
 * the output being a const object.
 */
type Modify<Type1, Type2> = {
  [key in keyof Type2 as Type2[key] extends undefined
    ? never
    : key]: Type2[key];
} & {
  [key in keyof Type1 as key extends keyof Type2 ? never : key]: Type1[key];
};

type DefaultedFutureFlags<Future> = Modify<typeof TEST_CONFIG.future, Future>;

/*
 * We omit the future prop and then redefine it with a partial of that object so we can pass the fully typed object in
 * to AppConfigArg.
 */
type TestOverrides<Future> = Partial<
  Omit<
    AppConfigArg<
      ShopifyRestResources,
      SessionStorage,
      DefaultedFutureFlags<Future>
    >,
    'future'
  > & {
    future: Partial<DefaultedFutureFlags<Future>>;
  }
>;

type TestOverridesArg<Future> = undefined | TestOverrides<Future>;

type TestConfig<Overrides extends TestOverridesArg<Future>, Future> = Modify<
  typeof TEST_CONFIG,
  Overrides
> & {
  future: Modify<typeof TEST_CONFIG.future, Future>;
};
