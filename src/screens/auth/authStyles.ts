import { StyleSheet } from 'react-native';
import { getAppTheme } from '../../styles/theme';

/**
 * The look shared by every sign-in form: the account window (AuthModal) and the full-screen
 * login. One place, so the two cannot drift apart.
 */
export interface AuthTheme {
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  inputBg: string;
  overlayBg: string;
}

export function getAuthTheme(isDark: boolean): AuthTheme {
  const appTheme = getAppTheme(isDark);
  return {
    card: appTheme.card,
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    border: appTheme.border,
    primary: appTheme.primary,
    primaryText: appTheme.primaryText,
    inputBg: appTheme.inputBg,
    overlayBg: appTheme.overlay,
  };
}

export const authStyles = StyleSheet.create({
  resetTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  resetHint: { fontSize: 12, fontWeight: '500', lineHeight: 18, marginBottom: 14 },
  resetBackBtn: { paddingVertical: 12, alignItems: 'center' },
  resetBackText: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formSection: {
    gap: 14,
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
