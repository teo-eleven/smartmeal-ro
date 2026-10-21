import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
  Dimensions,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DietType, MoodTag } from '../types';
import { MOOD_OPTIONS_CATALOG, MoodOptionInfo } from '../utils/moodCatalog';
import { ARCHETYPE_BACKDROPS } from '../../assets/recipes/backdrops';
import { ARCHETYPE_PHOTO_URLS } from '../utils/recipePhotography';
import { DishArchetype } from '../utils/recipeVisual';
import { getAppTheme } from '../styles/theme';
import { RECIPES } from '../data/recipes';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 56, 360);
const CARD_SPACING = 14;
const CARD_INTERVAL = CARD_WIDTH + CARD_SPACING;

export interface FoodMoodSwiperProps {
  selectedMoods: MoodTag[];
  onToggleMood: (tag: MoodTag) => void;
  onSetMoods?: (tags: MoodTag[]) => void;
  maxMoods?: number;
  isDark: boolean;
  onComplete?: () => void;
  dietTypes?: DietType[];
}

interface SwipeHistoryItem {
  index: number;
  action: 'liked' | 'passed';
  moodId: MoodTag;
  wasAlreadySelected: boolean;
}

export const FoodMoodSwiper: React.FC<FoodMoodSwiperProps> = ({
  selectedMoods,
  onToggleMood,
  onSetMoods,
  maxMoods,
  isDark,
  onComplete,
  dietTypes,
}) => {
  const theme = getAppTheme(isDark);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<SwipeHistoryItem[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  // Pre-calculate matching recipe counts per mood according to user's diet preferences
  const moodRecipeMap = useMemo(() => {
    const map = new Map<MoodTag, { count: number; sampleTitles: string[] }>();
    const effectiveDiets = dietTypes && dietTypes.length > 0 ? dietTypes : [];

    MOOD_OPTIONS_CATALOG.forEach((item) => {
      const matching = RECIPES.filter(
        (r) => r.moodTags.includes(item.id) && isRecipeMatchingDiets(r, effectiveDiets)
      );
      const sampleTitles = matching.slice(0, 3).map((r) => {
        return r.title.length > 28 ? r.title.slice(0, 26) + '…' : r.title;
      });
      map.set(item.id, { count: matching.length, sampleTitles });
    });
    return map;
  }, [dietTypes]);

  const scrollToCard = useCallback((index: number, animated = true) => {
    const targetIndex = Math.max(0, Math.min(index, MOOD_OPTIONS_CATALOG.length - 1));
    setCurrentIndex(targetIndex);
    isProgrammaticScroll.current = true;
    scrollViewRef.current?.scrollTo({
      x: targetIndex * CARD_INTERVAL,
      animated,
    });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 250);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(offsetX / CARD_INTERVAL);
    const clamped = Math.max(0, Math.min(computedIndex, MOOD_OPTIONS_CATALOG.length - 1));
    if (clamped !== currentIndex) {
      setCurrentIndex(clamped);
    }
  };

  const advanceCard = useCallback(
    (action: 'liked' | 'passed', item: MoodOptionInfo) => {
      const wasSelected = selectedMoods.includes(item.id);

      if (action === 'liked') {
        if (!wasSelected) {
          if (!maxMoods || selectedMoods.length < maxMoods) {
            onToggleMood(item.id);
          }
        }
      } else if (action === 'passed') {
        if (wasSelected) {
          onToggleMood(item.id);
        }
      }

      setHistory((prev) => [
        ...prev,
        {
          index: currentIndex,
          action,
          moodId: item.id,
          wasAlreadySelected: wasSelected,
        },
      ]);

      const nextIndex = currentIndex + 1;
      if (nextIndex < MOOD_OPTIONS_CATALOG.length) {
        scrollToCard(nextIndex);
      } else {
        if (onComplete) onComplete();
      }
    },
    [currentIndex, maxMoods, onComplete, onToggleMood, scrollToCard, selectedMoods]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];

    const currentlySelected = selectedMoods.includes(last.moodId);
    if (last.action === 'liked' && !last.wasAlreadySelected && currentlySelected) {
      onToggleMood(last.moodId);
    } else if (last.action === 'passed' && last.wasAlreadySelected && !currentlySelected) {
      onToggleMood(last.moodId);
    }

    setHistory((prev) => prev.slice(0, prev.length - 1));
    scrollToCard(last.index);
  }, [history, onToggleMood, scrollToCard, selectedMoods]);

  const handleSelectAll = useCallback(() => {
    if (onSetMoods) {
      onSetMoods(MOOD_OPTIONS_CATALOG.map((m) => m.id));
    } else {
      MOOD_OPTIONS_CATALOG.forEach((m) => {
        if (!selectedMoods.includes(m.id)) {
          onToggleMood(m.id);
        }
      });
    }
  }, [onSetMoods, onToggleMood, selectedMoods]);

  const handleClearAll = useCallback(() => {
    if (onSetMoods) {
      onSetMoods([]);
    } else {
      selectedMoods.forEach((id) => onToggleMood(id));
    }
  }, [onSetMoods, onToggleMood, selectedMoods]);

  // Keyboard shortcut listener on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'swipe') return;
      if (e.key === 'ArrowRight') {
        if (currentIndex < MOOD_OPTIONS_CATALOG.length - 1) {
          scrollToCard(currentIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          scrollToCard(currentIndex - 1);
        }
      } else if (e.key === 'z' || e.key === 'Backspace') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, handleUndo, scrollToCard, viewMode]);

  const currentItem =
    currentIndex < MOOD_OPTIONS_CATALOG.length ? MOOD_OPTIONS_CATALOG[currentIndex] : null;

  return (
    <View style={styles.container}>
      {/* Top Header: Mode Switcher & Quick Bulk Select */}
      <View style={styles.topControlRow}>
        <View style={styles.modeSegment}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Mod Swipe Carduri"
            onPress={() => setViewMode('swipe')}
            style={[
              styles.segmentBtn,
              viewMode === 'swipe' && {
                backgroundColor: theme.primary,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'swipe' ? theme.primaryText : theme.textMuted,
                  fontWeight: viewMode === 'swipe' ? '800' : '600',
                },
              ]}
            >
              🃏 Swipe Carduri
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Vizualizare Grilă"
            onPress={() => setViewMode('grid')}
            style={[
              styles.segmentBtn,
              viewMode === 'grid' && {
                backgroundColor: theme.primary,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: viewMode === 'grid' ? theme.primaryText : theme.textMuted,
                  fontWeight: viewMode === 'grid' ? '800' : '600',
                },
              ]}
            >
              📱 Grilă Clasică
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Count Indicator */}
        <View
          style={[
            styles.counterBadge,
            {
              backgroundColor: theme.accentBg,
              borderColor: selectedMoods.length > 0 ? '#30d158' : theme.border,
            },
          ]}
        >
          <Text style={[styles.counterText, { color: theme.text }]}>
            {maxMoods && maxMoods < 12
              ? `${selectedMoods.length}/${maxMoods} pofte`
              : `${selectedMoods.length} ${
                  selectedMoods.length === 1 ? 'poftă aleasă' : 'pofte alese'
                } (Nelimitat ✨)`}
          </Text>
        </View>
      </View>

      {/* Quick Action Chips Bar */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Selectează toate poftele"
          onPress={handleSelectAll}
          style={[styles.quickChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickChipText, { color: theme.text }]}>⚡ Selectează toate (12)</Text>
        </TouchableOpacity>

        {selectedMoods.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Deselectează toate poftele"
            onPress={handleClearAll}
            style={[styles.quickChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickChipText, { color: theme.textMuted }]}>↺ Resetează</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* VIEW MODE 1: CULINARY COVERFLOW CAROUSEL */}
      {viewMode === 'swipe' ? (
        <View style={styles.carouselSection}>
          {/* Snap Horizontal Carousel Track */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_INTERVAL}
            snapToAlignment="start"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselScrollContent}
            style={styles.carouselScrollView}
          >
            {MOOD_OPTIONS_CATALOG.map((item, index) => {
              const isSelected = selectedMoods.includes(item.id);
              const isActive = index === currentIndex;
              const stats = moodRecipeMap.get(item.id);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.carouselCardWrapper,
                    {
                      width: CARD_WIDTH,
                      marginRight: CARD_SPACING,
                      transform: [{ scale: isActive ? 1.0 : 0.94 }],
                      opacity: isActive ? 1.0 : 0.85,
                    },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label}, ${isSelected ? 'Selectat' : 'Neselectat'}`}
                    onPress={() => {
                      if (isActive) {
                        onToggleMood(item.id);
                      } else {
                        scrollToCard(index);
                      }
                    }}
                    activeOpacity={0.88}
                    style={[
                      styles.carouselCardInner,
                      isActive && styles.activeCardShadow,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected
                          ? '#30d158'
                          : isActive
                          ? isDark
                            ? '#F3C06D'
                            : '#D98E3A'
                          : theme.border,
                        borderWidth: isSelected ? 2 : isActive ? 1.5 : 1,
                      },
                    ]}
                  >
                    {renderCardBody(item, isDark, isSelected, theme, stats)}

                    {/* Bottom Direct Selection Pill */}
                    <View style={styles.cardSelectFooter}>
                      <View
                        style={[
                          styles.toggleSelectPill,
                          {
                            backgroundColor: isSelected
                              ? '#30d158'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.05)',
                            borderColor: isSelected ? '#30d158' : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.toggleSelectText,
                            {
                              color: isSelected ? '#000000' : theme.text,
                              fontWeight: isSelected ? '900' : '700',
                            },
                          ]}
                        >
                          {isSelected ? '✓ În Meniul Tău' : 'Adaugă în Meniu +'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Carousel Interactive Controls Row */}
          <View style={styles.bottomActionsRow}>
            {/* NOPE / SKIP BUTTON */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Nu-mi place sau pas"
              onPress={() => {
                if (currentItem) advanceCard('passed', currentItem);
              }}
              style={[styles.actionBtn, styles.nopeBtn]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIconNope}>✕</Text>
              <Text style={styles.actionLabelNope}>Pas</Text>
            </TouchableOpacity>

            {/* PREV CARD ARROW */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cardul anterior"
              onPress={() => scrollToCard(currentIndex - 1)}
              disabled={currentIndex <= 0}
              style={[
                styles.actionBtnSmall,
                {
                  backgroundColor: theme.accentBg,
                  borderColor: theme.border,
                  opacity: currentIndex > 0 ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionIconNav, { color: theme.text }]}>‹</Text>
            </TouchableOpacity>

            {/* UNDO BUTTON */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Anulează ultima acțiune"
              onPress={handleUndo}
              disabled={history.length === 0}
              style={[
                styles.actionBtnSmall,
                {
                  backgroundColor: theme.accentBg,
                  borderColor: theme.border,
                  opacity: history.length > 0 ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionIconUndo, { color: theme.text }]}>↺</Text>
            </TouchableOpacity>

            {/* NEXT CARD ARROW */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cardul următor"
              onPress={() => scrollToCard(currentIndex + 1)}
              disabled={currentIndex >= MOOD_OPTIONS_CATALOG.length - 1}
              style={[
                styles.actionBtnSmall,
                {
                  backgroundColor: theme.accentBg,
                  borderColor: theme.border,
                  opacity: currentIndex < MOOD_OPTIONS_CATALOG.length - 1 ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionIconNav, { color: theme.text }]}>›</Text>
            </TouchableOpacity>

            {/* LIKE / ADD BUTTON */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Îmi place acest stil culinar"
              onPress={() => {
                if (currentItem) advanceCard('liked', currentItem);
              }}
              style={[styles.actionBtn, styles.likeBtn]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIconLike}>💚</Text>
              <Text style={styles.actionLabelLike}>Îmi place</Text>
            </TouchableOpacity>
          </View>

          {/* Step Indicator under controls */}
          <Text style={[styles.deckStepHint, { color: theme.textMuted }]}>
            Cardul {currentIndex + 1} din {MOOD_OPTIONS_CATALOG.length} • Glisează caruselul sau folosește butoanele
          </Text>
        </View>
      ) : (
        /* VIEW MODE 2: CLASSIC GRID VIEW */
        <View style={styles.gridSection}>
          <View style={styles.gridContainer}>
            {MOOD_OPTIONS_CATALOG.map((mood) => {
              const isSelected = selectedMoods.includes(mood.id);
              const moodStats = moodRecipeMap.get(mood.id);
              const recipeCount = moodStats ? moodStats.count : 0;

              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${mood.label}, ${mood.desc}`}
                  key={mood.id}
                  onPress={() => onToggleMood(mood.id)}
                  activeOpacity={0.75}
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={styles.gridMoodIcon}>{mood.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.gridTitleRow}>
                      <Text
                        style={[
                          styles.gridMoodLabel,
                          {
                            color: isSelected ? theme.primary : theme.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {mood.label}
                      </Text>
                      <View
                        style={[
                          styles.gridCountBadge,
                          { backgroundColor: isSelected ? theme.primary : theme.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gridCountText,
                            { color: isSelected ? theme.primaryText : theme.textMuted },
                          ]}
                        >
                          {recipeCount} rețete
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.gridMoodDesc, { color: theme.textMuted }]}
                      numberOfLines={2}
                    >
                      {mood.desc}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gridCheckPill,
                      {
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Text
                        style={{
                          color: theme.primaryText,
                          fontSize: 11,
                          fontWeight: '900',
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Selected Pills Summary Bar - Stable layout */}
      <View style={[styles.selectedPillsContainer, { borderTopColor: theme.border }]}>
        <Text style={[styles.selectedPillsLabel, { color: theme.textMuted }]}>
          Pofte alese pentru această săptămână ({selectedMoods.length}):
        </Text>
        <View style={styles.pillsRow}>
          {selectedMoods.length > 0 ? (
            selectedMoods.map((tag) => {
              const item = MOOD_OPTIONS_CATALOG.find((m) => m.id === tag);
              if (!item) return null;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Elimină pofta ${item.label}`}
                  key={tag}
                  onPress={() => onToggleMood(tag)}
                  style={[
                    styles.activeMoodPill,
                    {
                      backgroundColor: theme.accentBg,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeMoodPillText, { color: theme.text }]}>
                    {item.icon} {item.label}
                  </Text>
                  <Text style={styles.activeMoodPillRemove}>✕</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={[styles.selectedPillsEmptyText, { color: theme.textMuted }]}>
              Nicio poftă selectată încă • Apasă pe un card sau folosește „Îmi place”
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

/** Helper to render card interior with backdrop image, locked vertical layout and typography */
function renderCardBody(
  item: MoodOptionInfo,
  isDark: boolean,
  isSelected: boolean,
  theme: ReturnType<typeof getAppTheme>,
  stats?: { count: number; sampleTitles: string[] }
) {
  const archetype = (item.archetype || 'stew') as DishArchetype;
  const photoUrl = ARCHETYPE_PHOTO_URLS[archetype];
  const backdrop = ARCHETYPE_BACKDROPS[archetype];
  const count = stats?.count ?? 0;
  const sampleDishes =
    stats && stats.sampleTitles.length > 0 ? stats.sampleTitles : item.sampleDishes || [];

  const imageSource = photoUrl ? { uri: photoUrl } : backdrop;

  return (
    <View style={styles.cardContent}>
      {/* Top Media Header with appetizing food image */}
      <View style={styles.cardMediaArea}>
        {imageSource ? (
          <ImageBackground source={imageSource} resizeMode="cover" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', '#1C241E']
                  : ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.25)', '#ffffff']
              }
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={isDark ? ['#243027', '#1C241E'] : ['#f4f4f5', '#e4e4e7']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Top Badges Row */}
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.vibePill,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.92)',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.vibeIcon}>{item.icon}</Text>
            <Text style={[styles.vibeText, { color: theme.text }]}>{item.vibe}</Text>
          </View>

          {/* Right side recipe counter pill */}
          <View
            style={[
              styles.recipeCountPill,
              {
                backgroundColor: isSelected
                  ? '#30d158'
                  : count > 0
                  ? isDark
                    ? 'rgba(48,209,88,0.2)'
                    : 'rgba(48,209,88,0.15)'
                  : 'rgba(255,69,58,0.2)',
                borderColor: isSelected ? '#30d158' : count > 0 ? '#30d158' : '#ff453a',
              },
            ]}
          >
            <Text
              style={[
                styles.recipeCountText,
                { color: isSelected ? '#000000' : count > 0 ? '#30d158' : '#ff453a' },
              ]}
            >
              {isSelected ? `✓ ALES · ${count} rețete` : count > 0 ? `✨ ${count} rețete` : '⚠️ 0 rețete'}
            </Text>
          </View>
        </View>

        {/* Big Food Icon in Center */}
        <View style={styles.centerIconWrap} pointerEvents="none">
          <Text style={styles.bigFoodIcon}>{item.icon}</Text>
        </View>
      </View>

      {/* Details Container - Strict Vertical Metrics to eliminate visual jumps */}
      <View style={styles.cardDetailsArea}>
        <View style={styles.cardTitleBox}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>

        <View style={styles.cardDescBox}>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {item.desc}
          </Text>
        </View>

        {/* Highlights Row (Fixed Height) */}
        <View style={styles.highlightsRow}>
          {(item.highlights || []).slice(0, 3).map((h, i) => (
            <View
              key={i}
              style={[
                styles.highlightTag,
                {
                  backgroundColor: theme.accentBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.highlightTagText, { color: theme.text }]} numberOfLines={1}>
                {h}
              </Text>
            </View>
          ))}
        </View>

        {/* Sample Dishes Row (Fixed Height) */}
        <View style={styles.sampleDishesBox}>
          <Text style={[styles.sampleDishesLabel, { color: theme.textMuted }]} numberOfLines={1}>
            Exemple în catalogul SmartMeal:
          </Text>
          <Text style={[styles.sampleDishesText, { color: theme.text }]} numberOfLines={2}>
            {sampleDishes.join(' · ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  topControlRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 2,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
  },
  counterBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Carousel Section */
  carouselSection: {
    width: '100%',
    alignItems: 'center',
  },
  carouselScrollView: {
    width: '100%',
  },
  carouselScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  carouselCardWrapper: {
    height: 335,
  },
  carouselCardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeCardShadow: {
    ...Platform.select({
      web: {
        boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
        userSelect: 'none',
      } as unknown as ViewStyle,
      default: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
    }),
  },

  /* Card Body Elements */
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cardMediaArea: {
    height: 105,
    width: '100%',
    position: 'relative',
    padding: 10,
  },
  cardTopRow: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  vibeIcon: {
    fontSize: 12,
  },
  vibeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recipeCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  recipeCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerIconWrap: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bigFoodIcon: {
    fontSize: 32,
    textAlign: 'center',
  },

  /* Details Area - Strict Vertical Constraints */
  cardDetailsArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'flex-start',
  },
  cardTitleBox: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardDescBox: {
    height: 34,
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  highlightsRow: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  highlightTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  highlightTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sampleDishesBox: {
    height: 44,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'flex-start',
  },
  sampleDishesLabel: {
    height: 13,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sampleDishesText: {
    height: 28,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  cardSelectFooter: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    width: '100%',
  },
  toggleSelectPill: {
    width: '100%',
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSelectText: {
    fontSize: 12,
  },

  /* Bottom Actions */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    width: '100%',
    maxWidth: 370,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  nopeBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.5)',
  },
  actionIconNope: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '900',
  },
  actionLabelNope: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '800',
  },
  likeBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: 'rgba(48, 209, 88, 0.6)',
  },
  actionIconLike: {
    fontSize: 15,
  },
  actionLabelLike: {
    color: '#30d158',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionIconUndo: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionIconNav: {
    fontSize: 18,
    fontWeight: '900',
  },
  deckStepHint: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  /* Grid View */
  gridSection: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 260,
    gap: 12,
  },
  gridMoodIcon: {
    fontSize: 28,
  },
  gridTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 8,
  },
  gridMoodLabel: {
    fontSize: 14,
  },
  gridCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridMoodDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  gridCheckPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Selected Pills Bar */
  selectedPillsContainer: {
    width: '100%',
    maxWidth: 580,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    minHeight: 56,
  },
  selectedPillsLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedPillsEmptyText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  activeMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  activeMoodPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeMoodPillRemove: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff453a',
  },
});
