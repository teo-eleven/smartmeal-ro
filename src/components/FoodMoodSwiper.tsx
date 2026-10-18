import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  ImageBackground,
  Platform,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodTag } from '../types';
import { MOOD_OPTIONS_CATALOG, MoodOptionInfo } from '../utils/moodCatalog';
import { ARCHETYPE_BACKDROPS } from '../../assets/recipes/backdrops';
import { getAppTheme } from '../styles/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 0.5;

export interface FoodMoodSwiperProps {
  selectedMoods: MoodTag[];
  onToggleMood: (tag: MoodTag) => void;
  onSetMoods?: (tags: MoodTag[]) => void;
  maxMoods?: number;
  isDark: boolean;
  onComplete?: () => void;
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
  maxMoods = 5,
  isDark,
  onComplete,
}) => {
  const theme = getAppTheme(isDark);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<SwipeHistoryItem[]>([]);

  const pan = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [pan]);

  const advanceCard = useCallback(
    (action: 'liked' | 'passed', item: MoodOptionInfo) => {
      const wasSelected = selectedMoods.includes(item.id);

      if (action === 'liked') {
        if (!wasSelected) {
          if (selectedMoods.length < maxMoods) {
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

      pan.setValue({ x: 0, y: 0 });
      isAnimating.current = false;
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= MOOD_OPTIONS_CATALOG.length && onComplete) {
        onComplete();
      }
    },
    [currentIndex, maxMoods, onComplete, onToggleMood, pan, selectedMoods]
  );

  const swipeCard = useCallback(
    (direction: 'left' | 'right') => {
      if (isAnimating.current || currentIndex >= MOOD_OPTIONS_CATALOG.length) return;
      isAnimating.current = true;
      const item = MOOD_OPTIONS_CATALOG[currentIndex];
      const targetX = direction === 'right' ? SCREEN_WIDTH + 150 : -SCREEN_WIDTH - 150;

      if (process.env.NODE_ENV === 'test') {
        advanceCard(direction === 'right' ? 'liked' : 'passed', item);
        return;
      }

      Animated.timing(pan, {
        toValue: { x: targetX, y: 0 },
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        advanceCard(direction === 'right' ? 'liked' : 'passed', item);
      });
    },
    [advanceCard, currentIndex, pan]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimating.current) return;
    const last = history[history.length - 1];

    // Revert selection change if state changed
    const currentlySelected = selectedMoods.includes(last.moodId);
    if (last.action === 'liked' && !last.wasAlreadySelected && currentlySelected) {
      onToggleMood(last.moodId);
    } else if (last.action === 'passed' && last.wasAlreadySelected && !currentlySelected) {
      onToggleMood(last.moodId);
    }

    setHistory((prev) => prev.slice(0, prev.length - 1));
    pan.setValue({ x: 0, y: 0 });
    setCurrentIndex(last.index);
  }, [history, onToggleMood, pan, selectedMoods]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setHistory([]);
    pan.setValue({ x: 0, y: 0 });
  }, [pan]);

  // PanResponder for touch and mouse dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy * 0.4 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD || gesture.vx > SWIPE_VELOCITY) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD || gesture.vx < -SWIPE_VELOCITY) {
          swipeCard('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // Keyboard shortcut listener on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'swipe') return;
      if (e.key === 'ArrowRight') {
        swipeCard('right');
      } else if (e.key === 'ArrowLeft') {
        swipeCard('left');
      } else if (e.key === 'z' || e.key === 'Backspace') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, swipeCard, viewMode]);

  // Interpolated transforms for top card
  const rotate = pan.x.interpolate({
    inputRange: [-250, 0, 250],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const animatedCardStyle = {
    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
  };

  const likeOpacity = pan.x.interpolate({
    inputRange: [20, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-100, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextScale = pan.x.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const nextOpacity = pan.x.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp',
  });

  const currentItem =
    currentIndex < MOOD_OPTIONS_CATALOG.length ? MOOD_OPTIONS_CATALOG[currentIndex] : null;
  const nextItem =
    currentIndex + 1 < MOOD_OPTIONS_CATALOG.length
      ? MOOD_OPTIONS_CATALOG[currentIndex + 1]
      : null;

  const isCurrentSelected = currentItem ? selectedMoods.includes(currentItem.id) : false;

  return (
    <View style={styles.container}>
      {/* Top Mode Switcher Bar */}
      <View style={styles.topControlRow}>
        <View style={styles.modeSegment}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Mod Tinder Swipe"
            onPress={() => setViewMode('swipe')}
            style={[
              styles.segmentBtn,
              viewMode === 'swipe' && {
                backgroundColor: isDark ? '#ffffff' : '#000000',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    viewMode === 'swipe'
                      ? isDark
                        ? '#000000'
                        : '#ffffff'
                      : theme.textMuted,
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
                backgroundColor: isDark ? '#ffffff' : '#000000',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    viewMode === 'grid'
                      ? isDark
                        ? '#000000'
                        : '#ffffff'
                      : theme.textMuted,
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
              borderColor: selectedMoods.length >= maxMoods ? '#ff9f0a' : theme.border,
            },
          ]}
        >
          <Text style={[styles.counterText, { color: theme.text }]}>
            {selectedMoods.length}/{maxMoods} pofte
          </Text>
        </View>
      </View>

      {/* SWIPE DECK VIEW */}
      {viewMode === 'swipe' ? (
        <View style={styles.deckSection}>
          {currentItem ? (
            <View style={styles.deckViewport}>
              {/* Card 2: Next Card in deck (rendered behind) */}
              {nextItem && (
                <Animated.View
                  style={[
                    styles.cardWrapper,
                    styles.cardBackdrop,
                    {
                      transform: [{ scale: nextScale }],
                      opacity: nextOpacity,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View
                    style={[
                      styles.cardInner,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {renderCardBody(nextItem, isDark, selectedMoods.includes(nextItem.id), theme)}
                  </View>
                </Animated.View>
              )}

              {/* Card 1: Top Active Card (Draggable) */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[styles.cardWrapper, animatedCardStyle]}
              >
                <View
                  style={[
                    styles.cardInner,
                    styles.topCardShadow,
                    {
                      backgroundColor: theme.card,
                      borderColor: isCurrentSelected ? '#30d158' : theme.border,
                    },
                  ]}
                >
                  {/* LIKE STAMP (Right Swipe) */}
                  <Animated.View
                    style={[styles.stampBadge, styles.likeStamp, { opacity: likeOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.likeStampText}>ÎMI PLACE 💚</Text>
                  </Animated.View>

                  {/* NOPE STAMP (Left Swipe) */}
                  <Animated.View
                    style={[styles.stampBadge, styles.nopeStamp, { opacity: nopeOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.nopeStampText}>PAS ✕</Text>
                  </Animated.View>

                  {/* Card Body */}
                  {renderCardBody(currentItem, isDark, isCurrentSelected, theme)}
                </View>
              </Animated.View>
            </View>
          ) : (
            /* Deck Finished Screen */
            <View
              style={[
                styles.finishedCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={styles.finishedEmoji}>🎉</Text>
              <Text style={[styles.finishedTitle, { color: theme.text }]}>
                Ai parcurs toate stilurile culinare!
              </Text>
              <Text style={[styles.finishedSubtitle, { color: theme.textMuted }]}>
                Ai selectat {selectedMoods.length} pofte pentru meniul tău săptămânal.
              </Text>

              {/* Selected Pills */}
              <View style={styles.finishedPillsWrap}>
                {selectedMoods.map((mId) => {
                  const m = MOOD_OPTIONS_CATALOG.find((o) => o.id === mId);
                  if (!m) return null;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Elimină pofta ${m.label}`}
                      key={mId}
                      onPress={() => onToggleMood(mId)}
                      style={[
                        styles.finishedPill,
                        {
                          backgroundColor: theme.primaryLight,
                          borderColor: theme.primary,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.finishedPillText}>
                        {m.icon} {m.label} ✕
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Reia selecția de pofte de la început"
                onPress={handleRestart}
                style={[
                  styles.restartBtn,
                  { backgroundColor: isDark ? '#ffffff' : '#000000' },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.restartBtnText,
                    { color: isDark ? '#000000' : '#ffffff' },
                  ]}
                >
                  ↺ Reia de la început
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Action Controls */}
          <View style={styles.bottomActionsRow}>
            {/* NOPE BUTTON */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Nu-mi place sau pas"
              onPress={() => swipeCard('left')}
              disabled={!currentItem}
              style={[
                styles.actionBtn,
                styles.nopeBtn,
                { opacity: currentItem ? 1 : 0.4 },
              ]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIconNope}>✕</Text>
              <Text style={styles.actionLabelNope}>Pas</Text>
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

            {/* LIKE BUTTON */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Îmi place acest stil culinar"
              onPress={() => swipeCard('right')}
              disabled={!currentItem}
              style={[
                styles.actionBtn,
                styles.likeBtn,
                { opacity: currentItem ? 1 : 0.4 },
              ]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIconLike}>💚</Text>
              <Text style={styles.actionLabelLike}>Îmi place</Text>
            </TouchableOpacity>
          </View>

          {/* Step Indicator under controls */}
          <Text style={[styles.deckStepHint, { color: theme.textMuted }]}>
            {currentItem
              ? `Cardul ${currentIndex + 1} din ${MOOD_OPTIONS_CATALOG.length} • Trage spre dreapta dacă îți place`
              : 'Ai finalizat selecția poftelor!'}
          </Text>
        </View>
      ) : (
        /* CLASSIC GRID VIEW */
        <View style={styles.gridSection}>
          <View style={styles.gridContainer}>
            {MOOD_OPTIONS_CATALOG.map((mood) => {
              const isSelected = selectedMoods.includes(mood.id);
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

      {/* Selected Pills Summary Bar */}
      {selectedMoods.length > 0 && viewMode === 'swipe' && (
        <View style={[styles.selectedPillsContainer, { borderTopColor: theme.border }]}>
          <Text style={[styles.selectedPillsLabel, { color: theme.textMuted }]}>
            Pofte alese pentru această săptămână:
          </Text>
          <View style={styles.pillsRow}>
            {selectedMoods.map((tag) => {
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
            })}
          </View>
        </View>
      )}
    </View>
  );
};

/** Helper to render card interior with backdrop image and typography */
function renderCardBody(
  item: MoodOptionInfo,
  isDark: boolean,
  isSelected: boolean,
  theme: ReturnType<typeof getAppTheme>
) {
  const backdrop = item.archetype ? ARCHETYPE_BACKDROPS[item.archetype] : undefined;

  return (
    <View style={styles.cardContent}>
      {/* Top Media Header */}
      <View style={styles.cardMediaArea}>
        {backdrop ? (
          <ImageBackground
            source={backdrop}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)', '#1c1c1e']
                  : ['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.60)', '#ffffff']
              }
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={isDark ? ['#27272a', '#18181b'] : ['#f4f4f5', '#e4e4e7']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Top Badges Row */}
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.vibePill,
              {
                backgroundColor: isDark
                  ? 'rgba(0,0,0,0.75)'
                  : 'rgba(255,255,255,0.92)',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.vibeIcon}>{item.icon}</Text>
            <Text style={[styles.vibeText, { color: theme.text }]}>{item.vibe}</Text>
          </View>

          {isSelected && (
            <View style={styles.selectedStampBadge}>
              <Text style={styles.selectedStampText}>✓ ALES</Text>
            </View>
          )}
        </View>

        {/* Big Food Icon in Center */}
        <View style={styles.centerIconWrap}>
          <Text style={styles.bigFoodIcon}>{item.icon}</Text>
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.cardDetailsArea}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.label}</Text>
        <Text style={[styles.cardDesc, { color: theme.textMuted }]}>{item.desc}</Text>

        {/* Highlights Pills */}
        {item.highlights && item.highlights.length > 0 && (
          <View style={styles.highlightsRow}>
            {item.highlights.map((h, i) => (
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
                <Text style={[styles.highlightTagText, { color: theme.text }]}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sample Dishes Row */}
        {item.sampleDishes && item.sampleDishes.length > 0 && (
          <View style={styles.sampleDishesBox}>
            <Text style={[styles.sampleDishesLabel, { color: theme.textMuted }]}>
              Exemple de rețete în meniu:
            </Text>
            <Text style={[styles.sampleDishesText, { color: theme.text }]}>
              {item.sampleDishes.join(' · ')}
            </Text>
          </View>
        )}
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
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 3,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  segmentBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  counterBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Deck Layout */
  deckSection: {
    width: '100%',
    alignItems: 'center',
  },
  deckViewport: {
    width: '100%',
    maxWidth: 420,
    height: 480,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    maxWidth: 420,
  },
  cardBackdrop: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  topCardShadow: {
    ...Platform.select({
      web: {
        boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
        userSelect: 'none',
      } as unknown as ViewStyle,
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },

  /* Card Body Elements */
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cardMediaArea: {
    height: 200,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeIcon: {
    fontSize: 14,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedStampBadge: {
    backgroundColor: '#30d158',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  selectedStampText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  centerIconWrap: {
    alignSelf: 'center',
    marginBottom: 6,
    zIndex: 2,
  },
  bigFoodIcon: {
    fontSize: 54,
    textAlign: 'center',
  },

  /* Details Area */
  cardDetailsArea: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  highlightTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  highlightTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sampleDishesBox: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  sampleDishesLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sampleDishesText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  /* Swipe Dynamic Stamps */
  stampBadge: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 99,
  },
  likeStamp: {
    left: 20,
    borderColor: '#30d158',
    backgroundColor: 'rgba(48, 209, 88, 0.20)',
    transform: [{ rotate: '-14deg' }],
  },
  likeStampText: {
    color: '#30d158',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nopeStamp: {
    right: 20,
    borderColor: '#ff453a',
    backgroundColor: 'rgba(255, 69, 58, 0.20)',
    transform: [{ rotate: '14deg' }],
  },
  nopeStampText: {
    color: '#ff453a',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /* Bottom Actions */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 22,
    width: '100%',
    maxWidth: 380,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  nopeBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.5)',
  },
  actionIconNope: {
    color: '#ff453a',
    fontSize: 20,
    fontWeight: '900',
  },
  actionLabelNope: {
    color: '#ff453a',
    fontSize: 15,
    fontWeight: '800',
  },
  likeBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: 'rgba(48, 209, 88, 0.6)',
  },
  actionIconLike: {
    fontSize: 18,
  },
  actionLabelLike: {
    color: '#30d158',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionIconUndo: {
    fontSize: 20,
    fontWeight: '700',
  },
  deckStepHint: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  /* Finished Deck Card */
  finishedCard: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 20,
  },
  finishedEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  finishedTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  finishedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  finishedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  finishedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  finishedPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#30d158',
  },
  restartBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  restartBtnText: {
    fontSize: 14,
    fontWeight: '800',
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
  gridMoodLabel: {
    fontSize: 14,
    marginBottom: 3,
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
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  selectedPillsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  activeMoodPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeMoodPillRemove: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff453a',
  },
});
