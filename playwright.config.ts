import { defineConfig, devices } from '@playwright/test';

// Not 8081, the port `npm run web` uses: the tests must never attach to a server that has real keys.
const PORT = 8099;

/**
 * The app in a real browser, on a phone-sized viewport. The dev server runs without Supabase
 * keys, so the app uses its local account and subscription simulation and never writes to the
 * real project; e2e/support/app.ts also fails any test that calls a Supabase API.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Metro bundles the app on the first request, which can take a minute on a cold cache.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['iPhone 14'],
    // Chromium for every run: the WebKit build is not always installed.
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Opt-in only, for a server you started yourself with the same empty keys.
    reuseExistingServer: Boolean(process.env.PW_REUSE_SERVER),
    timeout: 240_000,
    env: {
      CI: '1',
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    },
  },
});
