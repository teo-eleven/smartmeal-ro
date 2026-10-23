import { DietType, MealSlot, MoodTag } from '../../types';

/** Thresholds behind the mood tags that promise a number. */
const HIGH_PROTEIN_MIN_G = 28;
const SPEEDY_MAX_MINUTES = 25;
const LIGHT_DINNER_MAX_KCAL = 420;
const LOW_CALORIE_MAX_KCAL = 550;

/**
 * Enriches mood tags based on dish archetype, ingredients, calories and title,
 * guaranteeing deep variety across all 12 mood areas in the app.
 */

export function enrichRecipeMoodTags(recipe: {
  id: string;
  title: string;
  description?: string;
  moodTags?: MoodTag[];
  nutritionPerServing?: { calories?: number; proteinGrams?: number };
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  dietType?: DietType;
  suitableSlots?: MealSlot[];
  archetype?: string;
  ingredients?: { ingredientId: string }[];
}): MoodTag[] {
  const tags = new Set<MoodTag>(recipe.moodTags || []);
  const title = (recipe.title || '').toLowerCase();
  const id = (recipe.id || '').toLowerCase();
  const desc = (recipe.description || '').toLowerCase();
  const cal = recipe.nutritionPerServing?.calories || 0;
  const protein = recipe.nutritionPerServing?.proteinGrams || 0;
  const ingIds = (recipe.ingredients || []).map((i) => i.ingredientId.toLowerCase());

  // 1. pasta_italian (Paste & Italienești)
  if (
    /paste|spaghe|penne|tagliat|carbonara|bolognese|pomodoro|pesto|arrabbiata|lasagna/i.test(
      title + ' ' + id
    ) ||
    ingIds.some(
      (i) =>
        i.includes('paste') ||
        i.includes('spaghete') ||
        i.includes('penne') ||
        i.includes('tagliatelle')
    )
  ) {
    tags.add('pasta_italian');
  }

  // 2. soups_stews (Ciorbe & Supe calde de casă)
  if (
    /ciorba|supa|borș|bors|tocanita|tocana|iahnie|ghiveci|stew|mancare/i.test(title + ' ' + id) ||
    recipe.archetype === 'soup' ||
    recipe.archetype === 'stew'
  ) {
    tags.add('soups_stews');
  }

  // 3. grill_meat (Grătar & Cărnuri fragede)
  const isStewOrSoup =
    /ostropel|tocan|iahnie|ghiveci|gulaș|gulas|mâncărică|mancărică|mancare de|ciorbă|ciorba|supă|supa|borș|bors/i.test(
      title + ' ' + id
    );
  if (
    !isStewOrSoup &&
    (/gratar|grătar|friptura|friptură|muschiulet|mușchiuleț|cotlet|steak|antricot|carnaciori|cârnăciori|snitel|șnițel|aripioare|ceafa|ceafă/i.test(
      title + ' ' + id
    ) ||
      recipe.archetype === 'grill')
  ) {
    if (recipe.dietType === 'omnivore') {
      tags.add('grill_meat');
    }
  }

  // 4. fresh_salad (Salate crocante & Fresh Bowls)
  if (
    (/salată|salata|salad|bowl/i.test(title) && !/șnițel|snitel|burger/i.test(title)) ||
    recipe.archetype === 'salad'
  ) {
    tags.add('fresh_salad');
  }

  // 5. spicy_fiesta (Condimentat, picant & Mexican)
  if (
    /fajitas|chili|mexican|picant|curry|ardei_iute|shakshuka|condimentat|piper/i.test(
      title + ' ' + id + ' ' + desc
    ) ||
    ingIds.includes('ardei_iute_rosu')
  ) {
    tags.add('spicy_fiesta');
  }

  // 6-9. Tags that state a number are derived from it and override whatever the source said:
  // hand-written ones claimed "high protein" at 8 g and "speedy" at 32 minutes, and a regex
  // read "tortilla" as a cake.
  const minutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const isDessert = Boolean(recipe.suitableSlots?.includes('dessert'));
  const setTag = (tag: MoodTag, on: boolean) => (on ? tags.add(tag) : tags.delete(tag));

  setTag('high_protein', protein >= HIGH_PROTEIN_MIN_G);
  setTag('speedy', minutes > 0 && minutes < SPEEDY_MAX_MINUTES);
  setTag('sweet_treat', isDessert);
  setTag('light_dinner', cal > 0 && cal <= LIGHT_DINNER_MAX_KCAL && !isDessert);
  setTag('low_calorie', cal > 0 && cal < LOW_CALORIE_MAX_KCAL);

  return Array.from(tags);
}
