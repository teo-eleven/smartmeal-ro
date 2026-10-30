import {
  continueWithoutAccount,
  expect,
  finishOnboardingWithDefaults,
  reachMealBoard,
  startTrial,
  test,
} from './support/app';

const DEFAULT_COOKING_DAYS = 5;
/** Every meal card on the board names its dish, then "Vezi rețeta." */
const MEAL_CARD = /Vezi rețeta\.$/;

test.describe('main flow, without an account', () => {
  test('onboarding starts with no craving picked and ends on a plan within budget', async ({
    page,
  }, testInfo) => {
    await continueWithoutAccount(page);
    await page.getByRole('button', { name: 'Continuă la pasul următor' }).first().click();
    await expect(page.getByText('0 pofte alese', { exact: false }).first()).toBeVisible();

    await finishOnboardingWithDefaults(page);
    await startTrial(page);

    await expect(page.getByText('În buget ✓')).toBeVisible();
    await expect(page.getByRole('button', { name: MEAL_CARD })).toHaveCount(DEFAULT_COOKING_DAYS);
    await page.screenshot({ path: testInfo.outputPath('board-390.png'), fullPage: true });
  });

  test('a recipe opens with its ingredients and closes again', async ({ page }, testInfo) => {
    await reachMealBoard(page);

    await page.getByRole('button', { name: 'Vezi Rețeta →' }).first().click();
    await expect(page.getByText(/Ingrediente necesare/)).toBeVisible();
    await expect(page.getByText('Valori nutriționale per porție')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('recipe-390.png') });

    await page.getByRole('button', { name: 'Închide', exact: true }).first().click();
    await expect(page.getByText(/Ingrediente necesare/)).toBeHidden();
  });

  test('swapping a meal puts a different dish on that day', async ({ page }) => {
    await reachMealBoard(page);

    const firstMeal = page.getByRole('button', { name: MEAL_CARD }).first();
    const before = await firstMeal.getAttribute('aria-label');
    await page.getByRole('button', { name: 'Schimbă', exact: true }).first().click();
    await page.getByRole('button', { name: 'Alege această rețetă' }).first().click();

    await expect(firstMeal).not.toHaveAttribute('aria-label', before ?? '');
    await expect(page.getByRole('button', { name: MEAL_CARD })).toHaveCount(DEFAULT_COOKING_DAYS);
  });

  test('the grocery list opens with something to buy', async ({ page }, testInfo) => {
    await reachMealBoard(page);

    await page
      .getByRole('button', { name: /Cumpărături/ })
      .first()
      .click();
    // Only the grocery screen has this button, so the screen really changed.
    await expect(page.getByRole('button', { name: 'Bifează tot' })).toBeVisible();
    const items = page.getByRole('checkbox');
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath('grocery-390.png'), fullPage: true });
  });
});
