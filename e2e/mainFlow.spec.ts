import { expect, test } from '@playwright/test';
import {
  continueWithoutAccount,
  expectNoProblems,
  finishOnboardingWithDefaults,
  reachMealBoard,
  startTrial,
  watchPage,
} from './support/app';

const DEFAULT_COOKING_DAYS = 5;
/** Every meal card on the board names its dish, then "Vezi rețeta." */
const MEAL_CARD = /Vezi rețeta\.$/;

test.describe('main flow, without an account', () => {
  test('onboarding starts with no craving picked and ends on a plan within budget', async ({
    page,
  }, testInfo) => {
    const problems = await watchPage(page);

    await continueWithoutAccount(page);
    await page.getByRole('button', { name: 'Continuă la pasul următor' }).first().click();
    await expect(page.getByText('0 pofte alese', { exact: false }).first()).toBeVisible();

    await finishOnboardingWithDefaults(page);
    await startTrial(page);

    await expect(page.getByText('În buget ✓')).toBeVisible();
    await expect(page.getByRole('button', { name: MEAL_CARD })).toHaveCount(DEFAULT_COOKING_DAYS);
    await page.screenshot({ path: testInfo.outputPath('board-390.png'), fullPage: true });
    expectNoProblems(problems);
  });

  test('a recipe opens with its ingredients and closes again', async ({ page }, testInfo) => {
    const problems = await watchPage(page);
    await reachMealBoard(page);

    await page.getByRole('button', { name: 'Vezi Rețeta →' }).first().click();
    await expect(page.getByText(/Ingrediente necesare/)).toBeVisible();
    await expect(page.getByText('Valori nutriționale per porție')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('recipe-390.png') });

    await page.getByRole('button', { name: 'Închide', exact: true }).first().click();
    await expect(page.getByText(/Ingrediente necesare/)).toBeHidden();
    expectNoProblems(problems);
  });

  test('swapping a meal puts a different dish on that day', async ({ page }) => {
    const problems = await watchPage(page);
    await reachMealBoard(page);

    const firstMeal = page.getByRole('button', { name: MEAL_CARD }).first();
    const before = await firstMeal.getAttribute('aria-label');
    await page.getByRole('button', { name: 'Schimbă', exact: true }).first().click();
    await page.getByRole('button', { name: 'Alege această rețetă' }).first().click();

    await expect(firstMeal).not.toHaveAttribute('aria-label', before ?? '');
    await expect(page.getByRole('button', { name: MEAL_CARD })).toHaveCount(DEFAULT_COOKING_DAYS);
    expectNoProblems(problems);
  });

  test('the grocery list lists what the plan needs', async ({ page }, testInfo) => {
    const problems = await watchPage(page);
    await reachMealBoard(page);

    await page
      .getByRole('button', { name: /Cumpărături/ })
      .first()
      .click();
    await expect(page.getByText(/Piept de pui|Cartofi|Ceapă/).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('grocery-390.png'), fullPage: true });
    expectNoProblems(problems);
  });
});
