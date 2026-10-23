#!/usr/bin/env node
/**
 * Renders every recipe photo next to the recipe it illustrates, as one HTML page.
 *
 * ADR-20: a photo enters src/data/recipePhotoManifest.ts only after someone has looked at it
 * on this sheet, beside the recipe's title and ingredients. The sheet exists because a URL
 * proves nothing about what is in the picture.
 *
 * usage: node scripts/photoContactSheet.mjs [output.html]
 * Default output: photo-contact-sheet.html in the system temp directory.
 */
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load the TypeScript catalog directly: transpile each .ts file on require, no build step.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { RECIPE_PHOTO_MANIFEST } = require(path.join(root, 'src/data/recipePhotoManifest.ts'));
const { RECIPES_MAP } = require(path.join(root, 'src/data/recipes.ts'));
const { INGREDIENTS } = require(path.join(root, 'src/data/ingredients.ts'));

const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

const cards = Object.entries(RECIPE_PHOTO_MANIFEST).map(([id, photo]) => {
  const recipe = RECIPES_MAP[id];
  const ingredients = recipe
    ? recipe.ingredients
        .map((ing) => INGREDIENTS[ing.ingredientId]?.name ?? ing.ingredientId)
        .join(', ')
    : 'REȚETĂ NECUNOSCUTĂ';
  const credit = photo.credit ? `${photo.credit.author} · ${photo.credit.license}` : photo.source;
  return `<figure>
  <img src="${escape(photo.url)}" loading="lazy" alt="">
  <figcaption><b>${escape(recipe?.title ?? id)}</b><span>${escape(ingredients)}</span>
  <small>${escape(id)} · ${escape(credit)} · verificat ${escape(photo.verifiedAt)}</small></figcaption>
</figure>`;
});

const html = `<!doctype html><meta charset="utf-8"><title>Planșă poze rețete</title>
<style>
body{font:14px system-ui,sans-serif;margin:16px;background:#f4f4f2}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
figure{margin:0;background:#fff;border:1px solid #ddd;border-radius:8px;overflow:hidden}
img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#ccc}
figcaption{padding:8px;display:grid;gap:4px}span{color:#555;font-size:12px}small{color:#888;font-size:11px}
</style>
<h1>${cards.length} poze în manifest</h1><main>${cards.join('\n')}</main>`;

const output = process.argv[2] ?? path.join(tmpdir(), 'photo-contact-sheet.html');
writeFileSync(output, html);
console.log(`Planșa: ${output}`);
