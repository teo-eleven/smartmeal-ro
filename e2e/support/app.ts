import { expect, Page, test as base } from '@playwright/test';

const MAX_ONBOARDING_STEPS = 12;
const PLAN_READY_TIMEOUT_MS = 30_000;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
/** Supabase's API paths, so a custom domain or a self-hosted project is caught as well. */
const SUPABASE_API = /\/(auth|rest|storage|functions|realtime)\/v1\/|supabase\.(co|in)/;

/**
 * Every test gets this guard without asking for it. Any request to a remote Supabase API is
 * aborted and fails the test: the e2e server has no keys, so such a request means a build is
 * talking to a real project. Uncaught page errors fail the test too.
 */
export const test = base.extend<{ backendGuard: void }>({
  backendGuard: [
    async ({ context }, use) => {
      const remoteSupabaseCalls: string[] = [];
      const pageErrors: string[] = [];
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (!LOCAL_HOSTS.has(url.hostname) && SUPABASE_API.test(url.href)) {
          remoteSupabaseCalls.push(url.href);
          return route.abort();
        }
        return route.fallback();
      });
      context.on('page', (page) => page.on('pageerror', (e) => pageErrors.push(String(e))));

      await use(undefined);

      expect(remoteSupabaseCalls, 'requests to a remote Supabase project').toEqual([]);
      expect(pageErrors, 'uncaught errors in the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function continueWithoutAccount(page: Page): Promise<void> {
  await page.goto('/');
  // Shown only when the bundle has no Supabase keys: proof the run cannot reach a real project.
  await expect(page.getByText(/Simulare locală/)).toBeVisible();
  await page.getByText('Continuă fără cont', { exact: true }).first().click();
  await expect(page.getByText(/Pasul 1 din \d+/)).toBeVisible();
}

/**
 * Accepts every default answer, step by step, the way a hurried user would. `onLastStep` runs
 * on the last step, before the plan is generated.
 */
export async function finishOnboardingWithDefaults(
  page: Page,
  onLastStep?: () => Promise<void>
): Promise<void> {
  const generate = page.getByRole('button', { name: 'Generează Meniul Săptămânal' });
  const next = page.getByRole('button', { name: 'Continuă la pasul următor' });
  for (let step = 0; step < MAX_ONBOARDING_STEPS; step += 1) {
    // Wait for one of the two to be on screen, so a step that is still rendering is not
    // mistaken for one without the generate button.
    await expect(generate.or(next).first()).toBeVisible();
    if (await generate.count()) {
      await onLastStep?.();
      await generate.first().click();
      return;
    }
    await next.first().click();
  }
  throw new Error(`Onboarding did not reach the last step in ${MAX_ONBOARDING_STEPS} steps`);
}

/** The development build simulates the store, so the trial unlocks the plan without paying. */
export async function startTrial(page: Page): Promise<void> {
  const trial = page.getByText('Începe cele 7 zile gratuite').first();
  await expect(trial).toBeVisible({ timeout: PLAN_READY_TIMEOUT_MS });
  await trial.click();
  await expect(page.getByText('COST TOTAL ESTIMAT')).toBeVisible();
}

export async function reachMealBoard(page: Page): Promise<void> {
  await continueWithoutAccount(page);
  await finishOnboardingWithDefaults(page);
  await startTrial(page);
}
