import { expect, reachMealBoard, test } from './support/app';

const TITLE_FONT = 'LibreCaslonText_700Bold';

test('titles are drawn in Libre Caslon, and the browser really has the font', async ({ page }) => {
  await reachMealBoard(page);

  const brand = page.getByText('SmartMeal', { exact: true }).first();
  await expect(brand).toHaveCSS('font-family', new RegExp(TITLE_FONT));
  // A named family the browser cannot find falls back silently, and document.fonts.check()
  // answers true for a family it has never heard of. Ask for the loaded face itself.
  const isFontLoaded = await page.evaluate(
    (family) =>
      [...document.fonts].some((face) => face.family === family && face.status === 'loaded'),
    TITLE_FONT
  );
  expect(isFontLoaded).toBe(true);
});
