import {
  continueWithoutAccount,
  expect,
  finishOnboardingWithDefaults,
  startTrial,
  test,
} from './support/app';
import { accessibilityFailures } from './support/axe';

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
