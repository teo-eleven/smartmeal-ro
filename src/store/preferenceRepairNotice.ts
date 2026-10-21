/**
 * What the user is told when stored preferences had to be repaired on launch.
 *
 * Each failure gets its own sentence: an allergy list that could not be read has nothing to
 * do with whether a plan was possible, and saying which protection was lost is the point,
 * because the app can no longer protect what it cannot read.
 */

export interface PreferenceRepairs {
  allergensRepaired: boolean;
  dietRepaired: boolean;
  healthGoalsRepaired: boolean;
  /** Settings reset so that any plan is possible again, in Romanian ("magazinul"...). */
  resetSettings: string[];
  /** True when even the reset settings still allow no plan. */
  stillInfeasible: boolean;
  /** True when the stored plan was dropped because it was checked against unreadable rules. */
  planDropped: boolean;
}

export interface RepairNotice {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning';
}

export function hasRepairs(repairs: PreferenceRepairs): boolean {
  return (
    repairs.allergensRepaired ||
    repairs.dietRepaired ||
    repairs.healthGoalsRepaired ||
    repairs.resetSettings.length > 0
  );
}

function pickTitle(repairs: PreferenceRepairs): string {
  if (repairs.allergensRepaired) return 'Verifică-ți alergiile';
  if (repairs.dietRepaired) return 'Verifică-ți dieta';
  if (repairs.healthGoalsRepaired) return 'Verifică-ți obiectivele de sănătate';
  if (repairs.stillInfeasible) return 'Setări incomplete';
  return 'Setări restaurate';
}

function feasibilitySentence(repairs: PreferenceRepairs): string {
  if (repairs.resetSettings.length === 0) return '';
  const what = repairs.resetSettings.join(' și ');
  return repairs.stillInfeasible
    ? `Am restaurat ${what}, dar combinația de dietă și alergii tot nu permite niciun plan. Verifică-le din Filtre.`
    : `Setările salvate nu permiteau generarea niciunui plan, așa că am restaurat ${what}. Le poți schimba oricând din Filtre.`;
}

export function buildPreferenceRepairNotice(repairs: PreferenceRepairs): RepairNotice {
  const sentences = [
    repairs.allergensRepaired
      ? 'Lista ta de alergii nu a putut fi citită complet, așa că am păstrat doar ce am putut recunoaște. Verific-o din Filtre înainte să gătești.'
      : '',
    repairs.dietRepaired
      ? 'Nu am putut citi complet dieta ta salvată. Verific-o din Filtre înainte să gătești, ca să fim siguri că meniul o respectă.'
      : '',
    repairs.healthGoalsRepaired
      ? 'Nu am putut citi complet obiectivele tale de sănătate, inclusiv „Fără porc”. Verifică-le din Filtre înainte să gătești.'
      : '',
    feasibilitySentence(repairs),
    repairs.planDropped
      ? 'Meniul salvat a fost scos, pentru că fusese făcut după reguli pe care nu le mai putem citi. Generează-l din nou după ce verifici.'
      : '',
  ];

  const isSafetyIssue =
    repairs.allergensRepaired ||
    repairs.dietRepaired ||
    repairs.healthGoalsRepaired ||
    repairs.stillInfeasible;

  return {
    id: Date.now().toString(),
    title: pickTitle(repairs),
    message: sentences.filter(Boolean).join(' '),
    type: isSafetyIssue ? 'warning' : 'info',
  };
}
