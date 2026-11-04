import { Platform } from 'react-native';

/**
 * The chosen state of a button in a group of choices (household size, a day, a view mode).
 * On the web a button may carry aria-pressed but not aria-selected (axe flags it); the
 * phones announce aria-selected and have no pressed state. Spread it onto the button.
 */
export function pressedState(isChosen: boolean) {
  return Platform.OS === 'web' ? { 'aria-pressed': isChosen } : { 'aria-selected': isChosen };
}
