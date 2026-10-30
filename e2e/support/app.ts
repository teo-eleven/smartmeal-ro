import { expect, Page } from '@playwright/test';

const MAX_ONBOARDING_STEPS = 12;
const PLAN_READY_TIMEOUT_MS = 30_000;

/** What a test saw that it must not have: calls to the real backend and uncaught errors. */
export interface PageProblems {
  supabaseCalls: string[];
  pageErrors: string[];
}

/**
 * Aborts every request to a hosted Supabase project and records it. The e2e server runs
 * without keys, so any such request means a build is talking to production.
 */
export async function watchPage(page: Page): Promise<PageProblems> {
  const problems: PageProblems = { supabaseCalls: [], pageErrors: [] };
  await page.route(/supabase\.co/, (route) => {
    problems.supabaseCalls.push(route.request().url());
    return route.abort();
  });
  page.on('pageerror', (error) => problems.pageErrors.push(String(error)));
  return problems;
}

export function expectNoProblems(problems: PageProblems): void {
  expect(problems.supabaseCalls, 'requests to the real Supabase project').toEqual([]);
  expect(problems.pageErrors, 'uncaught errors in the page').toEqual([]);
}

export async function continueWithoutAccount(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText('Continuă fără cont', { exact: true }).first().click();
  await expect(page.getByText(/Pasul 1 din \d+/)).toBeVisible();
}

/** Accepts every default answer, step by step, the way a hurried user would. */
export async function finishOnboardingWithDefaults(page: Page): Promise<void> {
  const generate = page.getByRole('button', { name: 'Generează Meniul Săptămânal' });
  const next = page.getByRole('button', { name: 'Continuă la pasul următor' });
  for (let step = 0; step < MAX_ONBOARDING_STEPS; step += 1) {
    if (await generate.count()) {
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
