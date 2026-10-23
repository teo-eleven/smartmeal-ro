import React, { useEffect, useRef } from 'react';

import { AppLoadingScreen } from '../../components/AppLoadingScreen';
import { useAppStore } from '../../store/useAppStore';

/** How long the "building your menu" screen stays up. */
const GENERATING_SCREEN_MS = 1600;

interface GeneratingPlanModalProps {
  onComplete: () => void;
  isDark: boolean;
}

export const GeneratingPlanModal: React.FC<GeneratingPlanModalProps> = ({ onComplete, isDark }) => {
  const preferences = useAppStore((s) => s.preferences);

  // The latest callback, read when the timer fires. Depending on `onComplete` restarted the
  // timer on every App render (App passes a new arrow each time), so a busy store could keep
  // this screen up indefinitely.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), GENERATING_SCREEN_MS);
    return () => clearTimeout(timer);
  }, []);

  const activeHealth = preferences.healthGoalTags && preferences.healthGoalTags.length > 0;

  return (
    <AppLoadingScreen
      isDark={isDark}
      title="Construim meniul tău personalizat..."
      subtitle="Optimizăm mesele, macro-urile și lista de cumpărături..."
      icon="✨"
      steps={[
        `Potrivim rețetele cu magazinul și bugetul de ${preferences.budgetRon} lei`,
        activeHealth
          ? 'Calibrăm meniul conform obiectivelor tale de sănătate'
          : 'Aliniem mesele pentru zilele selectate',
        'Compunem lista de cumpărături pe 7 raioane',
      ]}
    />
  );
};
