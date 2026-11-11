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
 * for the CSS animations to end (a Modal only becomes a "dialog" once its own has) and then
 * until every inline style holds still between two samples. Looping animations (a loading
 * bar) never end, so they are skipped. Each wait gives up after SETTLE_TIMEOUT_MS and
 * leaves a warning on the test, so a scan of a moving screen is never silent.
 */
async function waitForStillScreen(page: Page, screen: string): Promise<void> {
  const animationsEnded = page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined))
    )
  );
  const isTimeUp = await Promise.race([
    // A page closed mid-wait rejects the evaluate; that is not a test failure here.
    animationsEnded.then(() => false).catch(() => true),
    page.waitForTimeout(SETTLE_TIMEOUT_MS).then(() => true),
  ]);
  const styles = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[style]')].map((el) => el.getAttribute('style')).join('|')
    );
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  let before = await styles();
  while (!isTimeUp && Date.now() < deadline) {
    await page.waitForTimeout(SETTLE_SAMPLE_MS);
    const after = await styles();
    if (after === before) return;
    before = after;
  }
  // Scanning a screen still in motion can misread a fading colour: say so in the report.
  test.info().annotations.push({
    type: 'warning',
    description: `${screen}: still moving after ${SETTLE_TIMEOUT_MS} ms, scanned anyway`,
  });
}

/** Every WCAG 2.1 A and AA rule axe checks in the real page: contrast, names, states. */
async function accessibilityFailures(page: Page, screen: string): Promise<string[]> {
  await waitForStillScreen(page, screen);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.flatMap((violation) =>
    violation.nodes.map(
      // The element's own HTML names it better than react-native-web's generated classes.
      (node) => `${violation.id} ${node.html.slice(0, 200)}: ${node.failureSummary ?? ''}`
    )
  );
}

test('every screen passes axe: contrast, names and states (WCAG 2.1 AA)', async ({ page }) => {
  const failures: Record<string, string[]> = {};
  const scan = async (screen: string) => {
    failures[screen] = await accessibilityFailures(page, screen);
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
