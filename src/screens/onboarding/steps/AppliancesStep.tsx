import React from 'react';
import { Text, View } from 'react-native';
import { ApplianceSelector } from '../../../components/ApplianceSelector';
import { EligibilityMeter } from '../../../components/EligibilityMeter';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 5: kitchen appliances */
export function AppliancesStep({
  isDark,
  preferences,
  theme,
  toggleAppliance,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Ce aparate ai în bucătărie?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Selectează aparatele disponibile. Nu îți vom sugera niciodată o rețetă pe care nu o poți
        găti.
      </Text>

      <ApplianceSelector
        selectedAppliances={preferences.appliances}
        onToggleAppliance={toggleAppliance}
        isDark={isDark}
      />

      <EligibilityMeter preferences={preferences} isDark={isDark} />

      {/* Step 5 Inter-step Cascade Impact */}
      {(() => {
        const hasOven = preferences.appliances.includes('oven');
        const hasAirFryer = preferences.appliances.includes('air_fryer');
        let applianceMsg = 'Toate rețetele propuse vor putea fi gătite cu aparatele selectate.';
        if (!hasOven && !hasAirFryer) {
          applianceMsg =
            'Meniul va conține doar rețete la plită/tigaie (fără coacere la cuptor sau aer cald).';
        } else if (!hasOven) {
          applianceMsg =
            'Rețetele ce necesită cuptor mare sunt excluse automat; se vor folosi plita și air fryer-ul.';
        }

        return (
          <View
            style={[
              sharedStyles.stepImpactCard,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <View style={sharedStyles.stepImpactHeaderRow}>
              <Text style={sharedStyles.stepImpactIcon}>🍳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
                  Garanție 100% fezabilitate în bucătărie
                </Text>
                <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
                  {applianceMsg} Nicio rețetă nu va cere aparate pe care nu le deții.
                </Text>
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}
