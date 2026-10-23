import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

const CARD_SIDE_GUTTER = 56;
const MAX_CARD_WIDTH = 360;
const CARD_SPACING = 14;
/** Pixels within which a programmatic scroll counts as arrived. */
const SETTLE_TOLERANCE_PX = 2;
/** Fallback release of the scroll guard if the scroll never reports arriving (e.g. no animation). */
const GUARD_FALLBACK_MS = 900;

export function carouselLayout(windowWidth: number) {
  const cardWidth = Math.min(windowWidth - CARD_SIDE_GUTTER, MAX_CARD_WIDTH);
  return { cardWidth, spacing: CARD_SPACING, interval: cardWidth + CARD_SPACING };
}

export function indexFromOffset(offsetX: number, interval: number, count: number): number {
  return Math.max(0, Math.min(Math.round(offsetX / interval), count - 1));
}

export function isSettledOnTarget(offsetX: number, targetIndex: number, interval: number): boolean {
  return Math.abs(offsetX - targetIndex * interval) <= SETTLE_TOLERANCE_PX;
}

interface KeyLike {
  key: string;
  defaultPrevented: boolean;
  target: { tagName?: string; isContentEditable?: boolean } | null;
}

/** Shortcuts act on the swiper only when the user is not typing somewhere else. */
export function shouldHandleSwiperKey(event: KeyLike): boolean {
  if (event.defaultPrevented) return false;
  const tag = event.target?.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
  return !event.target?.isContentEditable;
}

/**
 * The craving carousel's position and scrolling. A programmatic scroll (buttons, keys,
 * undo) holds the current card until the scroll actually reaches its target, instead of for
 * a fixed 250 ms that a smooth web scroll outlasted.
 */
export function useMoodCarousel(count: number) {
  const { width } = useWindowDimensions();
  const layout = carouselLayout(width);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const targetIndexRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseGuard = useCallback(() => {
    targetIndexRef.current = null;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  useEffect(() => releaseGuard, [releaseGuard]);

  const scrollToCard = useCallback(
    (index: number, animated = true) => {
      const targetIndex = Math.max(0, Math.min(index, count - 1));
      releaseGuard();
      setCurrentIndex(targetIndex);
      targetIndexRef.current = targetIndex;
      fallbackTimerRef.current = setTimeout(releaseGuard, GUARD_FALLBACK_MS);
      scrollViewRef.current?.scrollTo({ x: targetIndex * layout.interval, animated });
    },
    [count, layout.interval, releaseGuard]
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const target = targetIndexRef.current;
    if (target !== null) {
      if (isSettledOnTarget(offsetX, target, layout.interval)) releaseGuard();
      return;
    }
    const index = indexFromOffset(offsetX, layout.interval, count);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  /** A user drag ends here; any programmatic guard is over by then. */
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    releaseGuard();
    setCurrentIndex(indexFromOffset(event.nativeEvent.contentOffset.x, layout.interval, count));
  };

  return {
    layout,
    currentIndex,
    scrollViewRef,
    scrollToCard,
    handleScroll,
    handleMomentumScrollEnd,
  };
}
