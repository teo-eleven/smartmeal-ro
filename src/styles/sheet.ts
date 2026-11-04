import { StyleSheet } from 'react-native';
import { titleFont } from './typography';

/**
 * The bottom-sheet frame shared by the full-height modals (store comparison, saved plans).
 * Kept in one place so they cannot drift apart visually.
 */
export const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    ...titleFont,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
