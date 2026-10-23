import React from 'react';
import { Text, View } from 'react-native';
import { FoodMoodSwiper } from '../../../components/FoodMoodSwiper';
import { DIET_OPTIONS_CATALOG } from '../../../utils/dietCompatibility';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 2: mood & styles (pofte variate cu tinder-style food swiper) */
export function MoodStep({
  isDark,
  preferences,
  setMoodTags,
  theme,
  toggleMoodTag,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Ce pofte ai săptămâna asta?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Alege stilurile culinare dorite ({preferences.moodTags.length} selectate · fără limită).
        Răsfoiește caruselul culinar, alege poftele tale preferate sau selectează-le pe toate!
      </Text>

      {preferences.dietTypes &&
        preferences.dietTypes.length > 0 &&
        !preferences.dietTypes.includes('omnivore') && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.accentBg,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>🌱</Text>
            <Text style={{ fontSize: 12, color: theme.text, flex: 1, lineHeight: 16 }}>
              Cardurile și rețetele afișate sunt filtrate automat pentru stilul tău:{' '}
              <Text style={{ fontWeight: '800', color: theme.primary }}>
                {preferences.dietTypes
                  .map((d) => DIET_OPTIONS_CATALOG.find((o) => o.id === d)?.label || d)
                  .join(', ')}
              </Text>
              .
            </Text>
          </View>
        )}

      <FoodMoodSwiper
        selectedMoods={preferences.moodTags}
        onToggleMood={toggleMoodTag}
        onSetMoods={setMoodTags}
        isDark={isDark}
        dietTypes={preferences.dietTypes}
      />

      <View
        style={[
          sharedStyles.stepImpactCard,
          { backgroundColor: theme.accentBg, borderColor: theme.border },
        ]}
      >
        <View style={sharedStyles.stepImpactHeaderRow}>
          <Text style={sharedStyles.stepImpactIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
              {preferences.moodTags.length > 0
                ? `${preferences.moodTags.length} ${
                    preferences.moodTags.length === 1
                      ? 'stil culinar ales'
                      : 'stiluri culinare alese'
                  }`
                : 'Alege poftele tale pentru săptămână'}
            </Text>
            <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
              {preferences.moodTags.length > 0
                ? `Toate cele ${preferences.moodTags.length} ${
                    preferences.moodTags.length === 1
                      ? 'poftă este inclusă'
                      : 'stiluri alese sunt distribuite inteligent'
                  } pe zilele de gătit, oferindu-ți varietate culinară dedicată în fiecare zi.`
                : 'Selectează poftele tale preferate — fiecare poftă aleasă va influența direct rețetele propuse.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
