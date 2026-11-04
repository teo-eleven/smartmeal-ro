import { Platform } from 'react-native';
import { pressedState } from '../pressedState';

describe('the chosen state of a choice button', () => {
  const originalPlatform = Platform.OS;
  afterEach(() => Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true }));

  test('on the web it is aria-pressed, the state a button may carry', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    expect(pressedState(true)).toEqual({ 'aria-pressed': true });
  });

  test('on a phone it stays "selected", which VoiceOver and TalkBack announce', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(pressedState(false)).toEqual({ 'aria-selected': false });
  });
});
