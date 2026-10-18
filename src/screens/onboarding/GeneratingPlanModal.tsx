import React, { useEffect } from 'react';
import { AppLoadingScreen } from '../../components/AppLoadingScreen';
import { useAppStore } from '../../store/useAppStore';

interface GeneratingPlanModalProps {
  onComplete: () => void;
  isDark: boolean;
}

export const GeneratingPlanModal: React.FC<GeneratingPlanModalProps> = ({
  onComplete,
  isDark,
}) => {
  const preferences = useAppStore((s) => s.preferences);

  useEffect(() => {
    const timer = setTimeout(onComplete, 1600);
    return () => clearTimeout(timer);
  }, [onComplete]);

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
