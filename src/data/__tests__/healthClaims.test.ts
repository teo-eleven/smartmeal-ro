import { HEALTH_GOALS_CATALOG, PORK_FREE_TAG, isHealthGoal } from '../healthTags';
import { RECIPES } from '../recipes';
import { MOOD_OPTIONS_CATALOG } from '../../utils/moodCatalog';

/**
 * A meal planner may describe food, not promise medical effects (EU Regulation 1924/2006 on
 * health claims; Apple 1.4.1; Google's health-content policy). Stage A, step A.1.
 * "Conținut redus de sare" stays allowed: "redus" describes the food, "reduce" promises.
 */
const MEDICAL_CLAIM =
  /\b(previn\w*|tratea\w*|tratament\w*|vindec\w*|reduc(e|ând)\b|stabiliz\w*|protec\w*|protej\w*|antiinflamat\w*|cardio-?protect\w*)/i;
/** Diseases are named only on the goal's information line (A.3), never in its name or badge. */
const DISEASE_NAME =
  /\b(diabet\w*|SOP|PCOS|ovar\w*|polichist\w*|inim\w*|cardio\w*|inflama\w*|hormonal\w*|insulin\w*|glicemia)\b/i;
/**
 * Effects on the body (energy, digestion, sleep, recovery, "sănătos" as a promise) are health
 * claims too, and none is authorised for ordinary food (Reg. 1924/2006 art. 10 and 13). Built
 * with `u` and letter lookarounds because JavaScript's `\b` ignores Romanian diacritics.
 * "somn" alone stays allowed (the fish); "hidratat" stays allowed (chia seeds soaked in milk).
 */
const BODY_FUNCTION_FRAGMENTS = [
  'antioxida\\p{L}*',
  'polifenol\\p{L}*',
  'energ(?:ie|ia|iz\\p{L}*)',
  'glicem\\p{L}*',
  'probiotic\\p{L}*',
  'prebiotic\\p{L}*',
  'microbio\\p{L}*',
  'tranzit\\p{L}*',
  'intestin\\p{L}*',
  'digesti\\p{L}*',
  'imunit\\p{L}*',
  'imunitar\\p{L}*',
  'detox\\p{L}*',
  'depurat\\p{L}*',
  'alcaliniz\\p{L}*',
  'balon(?:are|at)\\p{L}*',
  'recuper\\p{L}*',
  'odihnitor\\p{L}*',
  'sa[țţ]ietat\\p{L}*',
  'metabolis\\p{L}*',
  'arde\\s+gr[ăa]simi',
  's[ăa]n[ăa]to(?:[sșş]|as)\\p{L}*',
  'sus[țţ]in\\p{L}*',
  'carbohidra\\p{L}*\\s+len[țţ]i',
  'f[ăa]r[ăa]\\s+regret\\p{L}*',
];
const BODY_FUNCTION_CLAIM = new RegExp(
  `(?<!\\p{L})(${BODY_FUNCTION_FRAGMENTS.join('|')})(?!\\p{L})`,
  'iu'
);
const makesAClaim = (text: string) =>
  MEDICAL_CLAIM.test(text) || DISEASE_NAME.test(text) || BODY_FUNCTION_CLAIM.test(text);

test('the body-function check catches the claims it is for and spares the fish', () => {
  const claims = ['Energie constantă', 'Somn odihnitor', 'Fără balonare', 'Fresh & Detox'];
  const food = ['File de somn la grătar', 'Semințe de chia hidratate', 'Amestecă energic'];

  expect(claims.filter((text) => !BODY_FUNCTION_CLAIM.test(text))).toEqual([]);
  expect(food.filter((text) => BODY_FUNCTION_CLAIM.test(text))).toEqual([]);
});

describe('health goals describe food, not treatment', () => {
  test.each(HEALTH_GOALS_CATALOG.map((goal) => [goal.id, goal] as const))(
    '%s makes no medical promise',
    (_id, goal) => {
      const texts = [goal.labelRo, goal.shortBadgeRo, goal.descriptionRo];
      expect(texts.filter((text) => MEDICAL_CLAIM.test(text))).toEqual([]);
    }
  );

  test.each(HEALTH_GOALS_CATALOG.map((goal) => [goal.id, goal] as const))(
    '%s names no disease in its name or badge',
    (_id, goal) => {
      expect([goal.labelRo, goal.shortBadgeRo].filter((text) => DISEASE_NAME.test(text))).toEqual(
        []
      );
    }
  );
});

test('no recipe title or description promises a medical effect or targets a disease', () => {
  const offenders = RECIPES.flatMap((recipe) =>
    [recipe.title, recipe.description].filter(makesAClaim).map((text) => `${recipe.id}: ${text}`)
  );
  expect(offenders).toEqual([]);
});

test('no craving card promises an effect on the body', () => {
  const offenders = MOOD_OPTIONS_CATALOG.flatMap((mood) =>
    [mood.label, mood.desc, mood.vibe, ...(mood.highlights ?? []), ...(mood.sampleDishes ?? [])]
      .filter(makesAClaim)
      .map((text) => `${mood.id}: ${text}`)
  );
  expect(offenders).toEqual([]);
});

describe('each goal says which condition it is relevant to, on its own line (A.3)', () => {
  const NOT_A_DOCTOR = 'Nu înlocuiește medicul.';
  const medicalGoals = HEALTH_GOALS_CATALOG.filter((goal) => isHealthGoal(goal.id));

  test.each(medicalGoals.map((goal) => [goal.id, goal] as const))(
    '%s names the condition and sends the user to a doctor, promising nothing',
    (_id, goal) => {
      expect(goal.conditionInfoRo).toMatch(/^Relevant dacă /);
      expect(goal.conditionInfoRo?.endsWith(NOT_A_DOCTOR)).toBe(true);
      expect(MEDICAL_CLAIM.test(goal.conditionInfoRo ?? '')).toBe(false);
    }
  );

  test('the pork-free filter is a religious and personal choice, not a condition', () => {
    expect(HEALTH_GOALS_CATALOG.find((goal) => goal.id === PORK_FREE_TAG)?.conditionInfoRo).toBe(
      undefined
    );
  });
});
