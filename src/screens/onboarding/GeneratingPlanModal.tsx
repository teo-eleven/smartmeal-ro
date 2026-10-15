import React, { useEffect } from 'react';
import { AppLoadingScreen } from '../../components/AppLoadingScreen';

interface GeneratingPlanModalProps {
  onComplete: () => void;
  isDark: boolean;
}

export const GeneratingPlanModal: React.FC<GeneratingPlanModalProps> = ({
  onComplete,
  isDark,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AppLoadingScreen
      isDark={isDark}
      title="Construim meniul tău personalizat..."
      subtitle="Optimizăm mesele, macro-urile și lista de cumpărături..."
      icon="✨"
      steps={[
        'Potrivim rețetele cu magazinul și bugetul tău',
        'Aliniem mesele pentru zilele selectate',
        'Compunem lista de cumpărături pe 7 raioane',
      ]}
    />
  );
};
