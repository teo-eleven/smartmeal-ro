import { Platform, ViewStyle } from 'react-native';

/**
 * Apple iOS Dark Mode Human Interface Guidelines Theme (Black & White signature)
 * Pure OLED Black (#000000) base, Apple System Gray 6 (#1c1c1e) card surface,
 * Apple System Gray 5 (#2c2c2e) tertiary surface, Hairline separators (rgba(255,255,255,0.12)),
 * and signature high-contrast Pure White (#ffffff) / Black (#000000) interactive controls.
 */
export const APPLE_IOS_THEME = {
  dark: {
    background: '#000000',
    card: '#1c1c1e',
    cardGlass: 'rgba(28, 28, 30, 0.85)',
    cardHover: '#2c2c2e',
    surfaceSecondary: '#2c2c2e',
    surfaceTertiary: '#3a3a3c',
    dock: 'rgba(28, 28, 30, 0.88)',
    text: '#ffffff',
    textMuted: '#8e8e93',
    textSubtle: '#636366',
    primary: '#ffffff',
    primaryText: '#000000',
    primaryLight: 'rgba(255, 255, 255, 0.12)',
    primaryGlow: 'rgba(255, 255, 255, 0.20)',
    border: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.24)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    accentBg: 'rgba(255, 255, 255, 0.06)',
    btnBg: '#2c2c2e',
    trackBg: 'rgba(255, 255, 255, 0.12)',
    glassBg: 'rgba(28, 28, 30, 0.90)',
    inputBg: '#2c2c2e',
    dayHeaderBg: '#1c1c1e',
    successBg: 'rgba(48, 209, 88, 0.15)',
    successText: '#30d158',
    warningBg: 'rgba(255, 69, 58, 0.15)',
    warningText: '#ff453a',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  },
  light: {
    background: '#f2f2f7',
    card: '#ffffff',
    cardGlass: 'rgba(255, 255, 255, 0.85)',
    cardHover: '#f8f8fa',
    surfaceSecondary: '#f2f2f7',
    surfaceTertiary: '#e5e5ea',
    dock: 'rgba(255, 255, 255, 0.90)',
    text: '#000000',
    textMuted: '#8e8e93',
    textSubtle: '#c7c7cc',
    primary: '#000000',
    primaryText: '#ffffff',
    primaryLight: 'rgba(0, 0, 0, 0.08)',
    primaryGlow: 'rgba(0, 0, 0, 0.12)',
    border: 'rgba(0, 0, 0, 0.10)',
    borderStrong: 'rgba(0, 0, 0, 0.20)',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    accentBg: 'rgba(0, 0, 0, 0.04)',
    btnBg: '#e5e5ea',
    trackBg: 'rgba(0, 0, 0, 0.08)',
    glassBg: 'rgba(255, 255, 255, 0.92)',
    inputBg: '#f2f2f7',
    dayHeaderBg: '#ffffff',
    successBg: 'rgba(52, 199, 89, 0.15)',
    successText: '#34c759',
    warningBg: 'rgba(255, 59, 48, 0.15)',
    warningText: '#ff3b30',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  },
};

// Aliased for seamless backward compatibility across all imports
export const EMERALD_GLASS_THEME = APPLE_IOS_THEME;

export function getAppTheme(isDark: boolean = true) {
  return isDark ? APPLE_IOS_THEME.dark : APPLE_IOS_THEME.light;
}

/**
 * Hardware-accelerated Apple Glassmorphism styles for React Native components.
 * Automatically polyfills backdrop-filter and specular box-shadows on web.
 */
export function getEmeraldGlassCard(isDark: boolean = true): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      backgroundColor: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.88)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      borderWidth: 1,
      borderRadius: 22,
      ...({
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: isDark
          ? '0 12px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
          : '0 8px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }),
    };
  }
  return {
    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderRadius: 22,
  };
}

export function getEmeraldGlassDock(isDark: boolean = true): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      backgroundColor: isDark ? 'rgba(28, 28, 30, 0.88)' : 'rgba(255, 255, 255, 0.92)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
      borderWidth: 1.5,
      borderRadius: 9999,
      ...({
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        boxShadow: isDark
          ? '0 20px 48px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
          : '0 14px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }),
    };
  }
  return {
    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
    borderWidth: 1.5,
    borderRadius: 9999,
  };
}

export function getEmeraldGlassPill(isActive: boolean, isDark: boolean = true): ViewStyle {
  if (isActive) {
    return {
      backgroundColor: isDark ? '#ffffff' : '#000000',
      borderColor: isDark ? '#ffffff' : '#000000',
      borderWidth: 1,
      borderRadius: 14,
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: isDark ? '0 4px 14px rgba(255, 255, 255, 0.22)' : '0 4px 14px rgba(0, 0, 0, 0.18)',
          })
        : {}),
    };
  }
  return {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        })
      : {}),
  };
}

/**
 * Injects global hardware-accelerated Apple iOS Black & White Dark Theme CSS styles
 * into the browser document head on Expo Web.
 */
export function injectEmeraldGlassStyles(isDark: boolean = true): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const styleId = 'smartmeal-apple-dark-theme';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Apple iOS Black & White Minimalist Global Engine */
    html, body, #root {
      background-color: ${isDark ? '#000000' : '#f2f2f7'} !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100%;
      position: relative;
      color: ${isDark ? '#ffffff' : '#000000'};
    }

    /* Clean root layers without extraneous background tints */
    #root > div,
    [data-glass="root"] {
      background-color: transparent !important;
    }

    /* Apple Grouped & Inset Cards (iOS System Gray 6) */
    [data-glass="card"] {
      background: ${isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.88)'} !important;
      backdrop-filter: blur(28px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
      box-shadow: ${isDark
        ? '0 12px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        : '0 8px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)'} !important;
      border-radius: 22px !important;
      position: relative;
    }

    /* Apple iOS Translucent Navigation Dock */
    [data-glass="dock"] {
      background: ${isDark ? 'rgba(28, 28, 30, 0.88)' : 'rgba(255, 255, 255, 0.92)'} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)'} !important;
      box-shadow: ${isDark
        ? '0 20px 48px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
        : '0 14px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'} !important;
      border-radius: 9999px !important;
    }

    /* Apple iOS Segmented Control & Inactive Pills */
    [data-glass="pill"] {
      background: ${isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)'} !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="pill"]:hover {
      background: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
      border-color: ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)'} !important;
      transform: translateY(-1px);
    }

    /* Apple iOS Active / Selected Pill (Signature Black & White Contrast) */
    [data-glass="pill-active"] {
      background: ${isDark ? '#ffffff' : '#000000'} !important;
      border: 1px solid ${isDark ? '#ffffff' : '#000000'} !important;
      box-shadow: 0 4px 14px ${isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)'} !important;
      border-radius: 14px !important;
    }
    [data-glass="pill-active"] * {
      color: ${isDark ? '#000000' : '#ffffff'} !important;
      font-weight: 700 !important;
    }

    /* Apple Primary Action Button (Signature Black/White High-Contrast) */
    [data-glass="btn-primary"] {
      background: ${isDark ? '#ffffff' : '#000000'} !important;
      border: 1px solid ${isDark ? '#ffffff' : '#000000'} !important;
      box-shadow: 0 6px 20px ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.15)'} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="btn-primary"] * {
      color: ${isDark ? '#000000' : '#ffffff'} !important;
      font-weight: 700 !important;
    }
    [data-glass="btn-primary"]:hover {
      opacity: 0.90;
      transform: translateY(-1.5px) scale(1.015);
      box-shadow: 0 8px 24px ${isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.22)'} !important;
    }
    [data-glass="btn-primary"]:active {
      transform: translateY(1px) scale(0.985);
      opacity: 0.82;
    }

    /* Apple Modals & Bottom Sheets (iOS Sheet Presentation) */
    [data-glass="modal"] {
      background: ${isDark ? 'rgba(28, 28, 30, 0.96)' : 'rgba(255, 255, 255, 0.97)'} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)'} !important;
      box-shadow: 0 28px 64px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
      border-radius: 26px !important;
    }

    /* Apple Smooth Hover Physics */
    div[role="button"] {
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    div[role="button"]:hover {
      filter: brightness(1.08);
    }

    /* Apple Clean Dark Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.20)'};
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.38)'};
    }
  `;
}
