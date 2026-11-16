import path from 'node:path';
import { Locator, Page } from '@playwright/test';
import {
  continueWithoutAccount,
  expect,
  finishOnboardingWithDefaults,
  reachMealBoard,
  test,
} from './support/app';
import { accessibilityFailures, waitForStillScreen } from './support/axe';

/**
 * Etapa A in the browser (A.11d). The web build shows the health goals (only iOS hides them),
 * so every safeguard around them can be seen and pressed here: the condition lines, the
 * disclaimers, the safety question, the blocked state, and the neutral store wording.
 * Screenshots land in docs/testing/screens/stage-a/ as evidence for the tester report.
 */

const SHORT_DISCLAIMER = /^Informații generale despre alimentație, nu sfat medical\./;
const LONG_DISCLAIMER = /În caz de urgență sună la 112\./;
const CONDITION_LINE = /Relevant dacă .+ Nu înlocuiește medicul\./;
const BLOCKED_NOTICE = /obiectivele de sănătate nu sunt potrivite fără sfatul medicului/;
const SAFETY_TITLE = 'O întrebare de siguranță';

/** The goals as onboarding names them, in catalogue order; the first one is asked about. */
const HEALTH_GOALS_ONBOARDING = [
  'Stil mediteranean',
  'Echilibrat',
  'Atent la zaharuri',
  'Bogat în fibre',
  'Grăsimi bune, puțină sare',
];
const PORK_FREE_ONBOARDING = 'Fără carne de porc (Halal)';
/** The badge names a recipe shows (shortBadgeRo), pork-free left out as on the recipe. */
const RECIPE_BADGES = [
  'Mediteranean',
  'Echilibrat',
  'Puține zaharuri',
  'Bogat în fibre',
  'Puțină sare',
];

/**
 * Wording removed in Etapa A. "energizant" also names a product category in the snack shop
 * (the Red Bull and Hell cans, "Băutură energizantă ..."): a product name, not a claim about
 * a recipe, so exactly those lines are left out of the check.
 */
const REMOVED_CLAIMS = /detox|somn odihnitor|energizant|antioxidant/i;
const RETAIL_ENERGY_DRINK_LINE = /^Băutură energizantă /;

/**
 * Found by this spec (A.11d), not part of Etapa A, left for a product fix: the filters'
 * apply button reads "✓ Aplică Filtre & Actualizează Meniul" but is named "Aplică Filtre și
 * Actualizează Meniul", so a voice-control user saying what they see does not hit it
 * (WCAG 2.5.3 Label in Name). Pinned by name so any other violation still fails the scan;
 * remove it once the label matches and this test will insist on an empty list again.
 */
const KNOWN_FILTERS_APPLY_LABEL_MISMATCH =
  /^label-content-name-mismatch <button aria-label="Aplică Filtre și Act/;

const SCREENS_DIR = path.join(__dirname, '..', 'docs', 'testing', 'screens', 'stage-a');
const MAX_ONBOARDING_STEPS = 12;

/**
 * Waits for fades to end, so the evidence shows the screen a user reads, then saves it with
 * one CSS pixel per image pixel: the PNG is the 390 px wide phone screen itself.
 */
async function snap(page: Page, name: string): Promise<void> {
  await waitForStillScreen(page, name);
  await page.screenshot({ path: path.join(SCREENS_DIR, `${name}.png`), scale: 'css' });
}

/** Scrolls the element to the middle of the phone screen, then saves the screen. */
async function snapAround(page: Page, target: Locator, name: string): Promise<void> {
  await target.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(target).toBeInViewport();
  await snap(page, name);
}

function goalOnStep(page: Page, label: string): Locator {
  return page.getByRole('checkbox', { name: new RegExp(`^\\S*\\s*${escapeRegExp(label)}`) });
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The lines of the visible text that still carry a removed claim. */
async function removedClaimsOnScreen(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return text
    .split('\n')
    .filter((line) => REMOVED_CLAIMS.test(line) && !RETAIL_ENERGY_DRINK_LINE.test(line));
}

async function dismissNoticeIfShown(page: Page): Promise<void> {
  const notice = page.getByRole('button', { name: 'Am înțeles' });
  if (await notice.count()) await notice.first().click();
}

async function openFilters(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Filtre', exact: true }).first().click();
  await expect(page.getByText('Filtre & Preferințe Meniu')).toBeVisible();
}

test.describe('Etapa A: health goals on the diet step', () => {
  test('every goal shows its name, the condition line and the short disclaimer', async ({
    page,
  }) => {
    await continueWithoutAccount(page);

    for (const label of [...HEALTH_GOALS_ONBOARDING, PORK_FREE_ONBOARDING]) {
      await expect(goalOnStep(page, label)).toBeVisible();
    }
    // One condition line per health goal; pork-free is a choice, not a health matter.
    await expect(page.getByText(CONDITION_LINE)).toHaveCount(HEALTH_GOALS_ONBOARDING.length);
    await expect(goalOnStep(page, PORK_FREE_ONBOARDING)).not.toContainText('Relevant dacă');
    await expect(goalOnStep(page, 'Atent la zaharuri')).toContainText(
      'Relevant dacă ai diabet sau prediabet. Nu înlocuiește medicul.'
    );
    const disclaimer = page.getByText(SHORT_DISCLAIMER);
    await expect(disclaimer).toBeVisible();

    await snapAround(page, goalOnStep(page, 'Atent la zaharuri'), 'diet-step-health-goals');
    await snapAround(page, disclaimer, 'diet-step-short-disclaimer');
  });
});

test.describe('Etapa A: the safety question before the first health goal', () => {
  test('closing it on the backdrop ticks nothing; "Nu, niciuna" ticks the goal', async ({
    page,
  }) => {
    const firstGoal = () => goalOnStep(page, HEALTH_GOALS_ONBOARDING[0]);
    await continueWithoutAccount(page);

    await firstGoal().click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText(SAFETY_TITLE);
    await snap(page, 'safety-question-dialog');
    expect(await accessibilityFailures(page, 'safety question dialog')).toEqual([]);

    // The card sits in the middle of the backdrop: press the backdrop's corner.
    await page
      .getByRole('button', { name: 'Închide întrebarea' })
      .click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeHidden();
    await expect(firstGoal()).not.toBeChecked();

    // Closing saved no answer, so the question comes back.
    await firstGoal().click();
    await expect(dialog).toContainText(SAFETY_TITLE);
    await dialog.getByRole('button', { name: 'Nu, niciuna' }).click();
    await expect(dialog).toBeHidden();
    await expect(firstGoal()).toBeChecked();

    // Answered once: the next goal is ticked without asking again.
    await goalOnStep(page, HEALTH_GOALS_ONBOARDING[1]).click();
    await expect(goalOnStep(page, HEALTH_GOALS_ONBOARDING[1])).toBeChecked();
    await expect(dialog).toBeHidden();
  });

  test('"Da, mi se aplică" ticks nothing and blocks the goals until "Am răspuns greșit"', async ({
    page,
  }) => {
    const firstGoal = () => goalOnStep(page, HEALTH_GOALS_ONBOARDING[0]);
    await continueWithoutAccount(page);

    await firstGoal().click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('button', { name: 'Da, mi se aplică' }).click();
    await expect(dialog).toBeHidden();

    const notice = page.getByText(BLOCKED_NOTICE);
    await expect(notice).toBeVisible();
    await expect(firstGoal()).not.toBeChecked();
    for (const label of HEALTH_GOALS_ONBOARDING) {
      await expect(goalOnStep(page, label)).toBeDisabled();
    }
    // Pork-free is never blocked by the answer.
    await expect(goalOnStep(page, PORK_FREE_ONBOARDING)).toBeEnabled();
    await snapAround(page, notice, 'safety-blocked-notice');
    expect(await accessibilityFailures(page, 'blocked notice')).toEqual([]);

    await page.getByRole('button', { name: 'Am răspuns greșit' }).click();
    await expect(notice).toBeHidden();
    for (const label of HEALTH_GOALS_ONBOARDING) {
      await expect(goalOnStep(page, label)).toBeEnabled();
    }
    // The answer was forgotten, so the question is asked again.
    await firstGoal().click();
    await expect(dialog).toContainText(SAFETY_TITLE);
  });

  test('pork-free is ticked without the safety question', async ({ page }) => {
    await continueWithoutAccount(page);

    await goalOnStep(page, PORK_FREE_ONBOARDING).click();

    await expect(goalOnStep(page, PORK_FREE_ONBOARDING)).toBeChecked();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByText(SAFETY_TITLE)).toHaveCount(0);
  });
});

test.describe('Etapa A: the disclaimers after onboarding', () => {
  test('the filters show the short disclaimer and open and close the long one', async ({
    page,
  }) => {
    await reachMealBoard(page);
    await dismissNoticeIfShown(page);
    await openFilters(page);

    await expect(page.getByText(SHORT_DISCLAIMER)).toBeVisible();
    const about = page.getByRole('button', { name: 'Despre obiectivele de sănătate' });
    const longText = page.getByText(LONG_DISCLAIMER);
    await expect(longText).toHaveCount(0);

    await about.click();
    await expect(longText).toBeVisible();
    await expect(about).toHaveAttribute('aria-expanded', 'true');
    await snapAround(page, longText, 'filters-long-disclaimer-open');
    const failures = await accessibilityFailures(page, 'filters, long disclaimer open');
    const known = failures.filter((f) => KNOWN_FILTERS_APPLY_LABEL_MISMATCH.test(f));
    if (known.length) {
      test.info().annotations.push({
        type: 'known issue',
        description: 'filters apply button: visible text "&" vs label "și" (WCAG 2.5.3)',
      });
      const apply = page.getByRole('button', { name: 'Aplică Filtre și Actualizează Meniul' });
      await snapAround(page, apply, 'known-issue-filters-apply-label');
    }
    expect(failures.filter((f) => !known.includes(f))).toEqual([]);

    await about.click();
    await expect(longText).toHaveCount(0);
    await expect(about).toHaveAttribute('aria-expanded', 'false');
  });

  test('a recipe with health badges has the short disclaimer under them; one without has none', async ({
    page,
  }) => {
    await reachMealBoard(page);
    await dismissNoticeIfShown(page);
    // As in accessibility.spec.ts: a recipe opened while the board is still fading in leaves
    // the meal card under it half-drawn, and axe then misreads that card, not the recipe.
    await waitForStillScreen(page, 'meal board');

    const openRecipe = page.getByRole('button', { name: 'Vezi Rețeta →' });
    const recipeCount = await openRecipe.count();
    const seen: Record<'with' | 'without', number | null> = { with: null, without: null };
    // The plan decides which dishes carry badges: open each until both kinds are found.
    for (let i = 0; i < recipeCount && (seen.with === null || seen.without === null); i += 1) {
      await openRecipe.nth(i).click();
      await expect(page.getByText(/Ingrediente necesare/)).toBeVisible();
      const disclaimer = page.getByText(SHORT_DISCLAIMER);
      const hasDisclaimer = (await disclaimer.count()) > 0;

      if (hasDisclaimer && seen.with === null) {
        seen.with = i;
        await expectDisclaimerUnderBadges(page, disclaimer);
        await snapAround(page, disclaimer, 'recipe-with-health-badges');
        expect(await accessibilityFailures(page, 'recipe with disclaimer')).toEqual([]);
      }
      if (!hasDisclaimer && seen.without === null) {
        seen.without = i;
        await expectNoHealthBadges(page);
        await snap(page, 'recipe-without-health-badges');
      }
      await page.getByRole('button', { name: 'Închide', exact: true }).first().click();
      await expect(page.getByText(/Ingrediente necesare/)).toBeHidden();
    }

    expect(seen.with, 'a recipe on the board with health badges').not.toBeNull();
    expect(seen.without, 'a recipe on the board without health badges').not.toBeNull();
  });
});

/** The disclaimer box sits right below a health badge of the same recipe. */
async function expectDisclaimerUnderBadges(page: Page, disclaimer: Locator): Promise<void> {
  const disclaimerBox = await disclaimer.boundingBox();
  expect(disclaimerBox).not.toBeNull();
  const badgeBoxes = await page
    .getByText(new RegExp(`^(${RECIPE_BADGES.map(escapeRegExp).join('|')})$`))
    .evaluateAll((els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ top: r.top, bottom: r.bottom }))
    );
  const top = disclaimerBox?.y ?? 0;
  const BADGE_TO_DISCLAIMER_MAX_PX = 60;
  const badgesRightAbove = badgeBoxes.filter(
    (box) => box.bottom <= top && top - box.bottom <= BADGE_TO_DISCLAIMER_MAX_PX
  );
  expect(badgesRightAbove.length, 'a health badge right above the disclaimer').toBeGreaterThan(0);
}

async function expectNoHealthBadges(page: Page): Promise<void> {
  // The open recipe is the only place a badge could be; the board cards show none.
  await expect(page.getByText(SHORT_DISCLAIMER)).toHaveCount(0);
  for (const badge of RECIPE_BADGES) {
    await expect(page.getByText(badge, { exact: true })).toHaveCount(0);
  }
}

test.describe('Etapa A: wording', () => {
  test('mood cards use measured wording, and no removed claim appears anywhere visited', async ({
    page,
  }) => {
    const claims: Record<string, string[]> = {};
    await continueWithoutAccount(page);
    const next = page.getByRole('button', { name: 'Continuă la pasul următor' });
    const generate = page.getByRole('button', { name: 'Generează Meniul Săptămânal' });

    for (let step = 1; step <= MAX_ONBOARDING_STEPS; step += 1) {
      await expect(generate.or(next).first()).toBeVisible();
      if (step === 2) await checkMoodWording(page);
      claims[`onboarding step ${step}`] = await removedClaimsOnScreen(page);
      if (await generate.count()) break;
      await next.first().click();
    }
    await generate.first().click();

    const trial = page.getByRole('button', { name: /Începe cele \d+ zile gratuite/ });
    await expect(trial).toBeVisible({ timeout: 30_000 });
    claims.paywall = await removedClaimsOnScreen(page);
    await trial.click();
    await expect(page.getByText('COST TOTAL ESTIMAT')).toBeVisible();
    await dismissNoticeIfShown(page);
    claims['meal board'] = await removedClaimsOnScreen(page);

    await page.getByRole('button', { name: 'Vezi Rețeta →' }).first().click();
    await expect(page.getByText(/Ingrediente necesare/)).toBeVisible();
    claims.recipe = await removedClaimsOnScreen(page);
    await page.getByRole('button', { name: 'Închide', exact: true }).first().click();

    await openFilters(page);
    await page.getByRole('button', { name: 'Despre obiectivele de sănătate' }).click();
    await expect(page.getByText(LONG_DISCLAIMER)).toBeVisible();
    claims.filters = await removedClaimsOnScreen(page);

    expect(Object.values(claims).flat(), 'removed claims still on screen').toEqual([]);
  });

  test('the paywall fine print names no store on the web', async ({ page }) => {
    await continueWithoutAccount(page);
    await finishOnboardingWithDefaults(page);

    const trial = page.getByRole('button', { name: /Începe cele \d+ zile gratuite/ });
    await expect(trial).toBeVisible({ timeout: 30_000 });
    const finePrint = page.getByText(/Abonamentul se reînnoiește automat/);
    await expect(finePrint).toContainText('Plata se face prin contul tău de magazin.');
    await expect(finePrint).toContainText('setările abonamentelor contului tău de magazin');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/Apple|Google Play/);
    await snapAround(page, finePrint, 'paywall-fine-print');
  });
});

async function checkMoodWording(page: Page): Promise<void> {
  await expect(page.getByText(/Pasul 2 din \d+/)).toBeVisible();
  const protein = page.getByText('Bogat în Proteine (min. 28g)', { exact: true });
  const light = page.getByText('Cină Ușoară de Seară (max. 420 kcal)', { exact: true });
  await expect(protein.first()).toBeAttached();
  await expect(light.first()).toBeAttached();
  await expect(page.getByText('💪 Min. 28g proteină').first()).toBeAttached();
  await expect(page.getByText('🌙 Max. 420 kcal').first()).toBeAttached();
  // The cards sit in a carousel; the grid view lays them all out for the screenshot.
  await page.getByRole('button', { name: 'Vizualizare Grilă' }).click();
  await snapAround(page, protein.first(), 'onboarding-mood-high-protein');
  await snapAround(page, light.first(), 'onboarding-mood-light-dinner');
}
