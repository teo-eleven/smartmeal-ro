import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { DietType, MoodTag } from '../types';
import { MOOD_OPTIONS_CATALOG, MoodOptionInfo } from '../utils/moodCatalog';
import { MoodCardBody } from './foodMood/MoodCardBody';
import { shouldHandleSwiperKey, useMoodCarousel } from './foodMood/useMoodCarousel';
import { styles } from './foodMood/styles';
import { getAppTheme } from '../styles/theme';
import { RECIPES } from '../data/recipes';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';


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
  const [history, setHistory] = useState<SwipeHistoryItem[]>([]);
  const { layout, currentIndex, scrollViewRef, scrollToCard, handleScroll, handleMomentumScrollEnd } =
    useMoodCarousel(MOOD_OPTIONS_CATALOG.length);

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
      // Typing "z" or deleting text in another field must not undo a swipe.
      if (!shouldHandleSwiperKey(e as unknown as Parameters<typeof shouldHandleSwiperKey>[0])) {
        return;
      }
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
            accessibilityState={{ selected: viewMode === 'swipe' }}
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
            accessibilityState={{ selected: viewMode === 'grid' }}
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
            snapToInterval={layout.interval}
            snapToAlignment="start"
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
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
                      width: layout.cardWidth,
                      marginRight: layout.spacing,
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
                    <MoodCardBody item={item} isDark={isDark} isSelected={isSelected} theme={theme} stats={stats} />

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
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
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
