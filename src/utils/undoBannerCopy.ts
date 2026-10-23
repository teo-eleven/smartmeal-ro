import { DiscardReason } from '../store/appState';

export interface UndoBannerCopy {
  message: string;
  actionLabel: string;
}

const COPY: Record<DiscardReason, UndoBannerCopy> = {
  reset: { message: 'Planul săptămânal a fost șters.', actionLabel: 'Anulează ștergerea' },
  restore: {
    message: 'Ai încărcat un plan salvat în locul celui curent.',
    actionLabel: 'Revino la planul anterior',
  },
  cloud: {
    message: 'Planul din cloud l-a înlocuit pe cel de pe telefon.',
    actionLabel: 'Revino la planul anterior',
  },
};

/** The banner text for whatever replaced the plan; the reset wording when unknown. */
export function undoBannerCopy(reason: DiscardReason | undefined): UndoBannerCopy {
  return COPY[reason ?? 'reset'];
}
