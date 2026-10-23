/**
 * Recipe ids that were renamed or merged, mapped to the id that replaced them.
 *
 * Ids live on in places this code does not control: favourites and rejections in local
 * storage, saved plans, and plans in the cloud written by older builds. Every one of them is
 * read through `resolveRecipeId`, so an old id lands on the same dish instead of being
 * treated as unknown and replaced. Entries are permanent: removing one breaks old data.
 */
export const RECIPE_ID_ALIASES: Readonly<Record<string, string>> = {
  // 2026-10-22: ids that contradicted the recipe (audit of 2026-10-21).
  aripioare_pui_airfryer: 'pulpe_pui_airfryer_cartofi',
  curcan_stirfry_legume_soia: 'pui_stirfry_legume_soia',
  chili_fasole_neagra_cartof_dulce: 'chili_vegan_fasole_rosie_marar',
  somon_salbatic_sparanghel_turmeric: 'somon_cuptor_dovlecei_turmeric',
  tagliatelle_creveti_usturoi: 'spaghete_creveti_usturoi',
  omleta_ciuperci_branza_capra: 'omleta_ciuperci_telemea',
  fasole_scazuta_afumatura: 'fasole_scazuta_ceapa_marar',
  // Same title and near-identical ingredients as the recipe it now points to.
  ghiveci_calugaresc_legume: 'ghiveci_legume_cuptor',
};

export function resolveRecipeId(id: string): string {
  return RECIPE_ID_ALIASES[id] ?? id;
}

/** Translates a list of ids and drops the duplicates a merge can create. */
export function resolveRecipeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map(resolveRecipeId)));
}
