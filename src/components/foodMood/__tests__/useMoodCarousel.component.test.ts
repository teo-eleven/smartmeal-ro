import {
  carouselLayout,
  indexFromOffset,
  isSettledOnTarget,
  shouldHandleSwiperKey,
} from '../useMoodCarousel';

/**
 * The swiper's scroll guard was a fixed 250 ms timeout: on web a smooth scroll runs longer,
 * the in-between offsets moved the current card, and "Îmi place" / "Pas" acted on the
 * neighbour. Its keyboard shortcuts also fired while the user typed in another field.
 */

describe('caruselul de pofte', () => {
  test('lățimea cardului urmează ecranul, cu un maxim', () => {
    expect(carouselLayout(390).cardWidth).toBe(334);
    expect(carouselLayout(1200).cardWidth).toBe(360);
    expect(carouselLayout(390).interval).toBe(334 + carouselLayout(390).spacing);
  });

  test('indexul se calculează din poziție și rămâne în limite', () => {
    const { interval } = carouselLayout(390);
    expect(indexFromOffset(interval * 2.4, interval, 12)).toBe(2);
    expect(indexFromOffset(-50, interval, 12)).toBe(0);
    expect(indexFromOffset(interval * 40, interval, 12)).toBe(11);
  });

  test('scroll-ul programatic e încheiat doar când a ajuns la țintă', () => {
    const { interval } = carouselLayout(390);
    expect(isSettledOnTarget(interval * 3, 3, interval)).toBe(true);
    expect(isSettledOnTarget(interval * 2.5, 3, interval)).toBe(false);
  });

  test('scurtăturile de tastatură se ignoră când utilizatorul scrie', () => {
    const typing = { key: 'z', defaultPrevented: false, target: { tagName: 'INPUT' } };
    const textarea = { key: 'Backspace', defaultPrevented: false, target: { tagName: 'TEXTAREA' } };
    const editable = {
      key: 'z',
      defaultPrevented: false,
      target: { tagName: 'DIV', isContentEditable: true },
    };
    const onPage = { key: 'ArrowRight', defaultPrevented: false, target: { tagName: 'BODY' } };

    expect(shouldHandleSwiperKey(typing)).toBe(false);
    expect(shouldHandleSwiperKey(textarea)).toBe(false);
    expect(shouldHandleSwiperKey(editable)).toBe(false);
    expect(shouldHandleSwiperKey(onPage)).toBe(true);
    expect(shouldHandleSwiperKey({ ...onPage, defaultPrevented: true })).toBe(false);
  });
});
