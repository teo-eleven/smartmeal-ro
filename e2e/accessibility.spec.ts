import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import {
  continueWithoutAccount,
  expect,
  finishOnboardingWithDefaults,
  startTrial,
  test,
} from './support/app';

const SETTLE_SAMPLE_MS = 200;
const SETTLE_TIMEOUT_MS = 4000;

/**
 * Screens fade their content in, and axe measures a half-faded text as a grey one. Waits
 * until every inline style holds still between two samples; a looping animation (a loading
 * bar) never does, so the wait gives up after SETTLE_TIMEOUT_MS and scans anyway.
 */
async function waitForStillScreen(page: Page): Promise<void> {
  const styles = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[style]')].map((el) => el.getAttribute('style')).join('|')
    );
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  let before = await styles();
  while (Date.now() < deadline) {
    await page.waitForTimeout(SETTLE_SAMPLE_MS);
    const after = await styles();
    if (after === before) return;
    before = after;
  }
}

/** Every text and its background, as axe measures them in the real page (WCAG 1.4.3). */
async function contrastFailures(page: Page): Promise<string[]> {
  await waitForStillScreen(page);
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${node.target.join(' ')}: ${node.any[0]?.message ?? ''}`)
  );
}

test('every text reads against its background, screen by screen', async ({ page }) => {
  const failures: Record<string, string[]> = {};
  const scan = async (screen: string) => {
    failures[screen] = await contrastFailures(page);
  };

  await page.goto('/');
  await expect(page.getByText(/Simulare locală/)).toBeVisible();
  await scan('welcome');
  await continueWithoutAccount(page);
  await scan('onboarding, first step');
  await finishOnboardingWithDefaults(page, () => scan('onboarding, summary before the plan'));
  await startTrial(page);
  const notice = page.getByRole('button', { name: 'Am înțeles' });
  if (await notice.count()) await notice.first().click();
  await scan('meal board');

  await page.getByRole('button', { name: 'Vezi Rețeta →' }).first().click();
  await expect(page.getByText(/Ingrediente necesare/)).toBeVisible();
  await scan('recipe');
  await page.getByRole('button', { name: 'Închide', exact: true }).first().click();

  await page
    .getByRole('button', { name: /Cumpărături/ })
    .first()
    .click();
  await scan('grocery list');

  expect(failures).toEqual({
    welcome: [],
    'onboarding, first step': [],
    'onboarding, summary before the plan': [],
    'meal board': [],
    recipe: [],
    'grocery list': [],
  });
});

test('a focused field shows the bronze focus ring, not the browser blue', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('input[type="email"]').first();
  await email.focus();

  await expect(email).toHaveCSS('outline-style', 'solid');
  await expect(email).toHaveCSS('outline-width', '2px');
  // The dark theme's primary, bronzeGlow #D8B98F.
  await expect(email).toHaveCSS('outline-color', 'rgb(216, 185, 143)');
});
