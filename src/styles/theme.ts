import { Platform, ViewStyle } from 'react-native';

/**
 * Apple iOS Dark Mode Human Interface Guidelines Theme (Black & White signature)
 * Pure OLED Black (#000000) base, Apple System Gray 6 (#1c1c1e) card surface,
 * Apple System Gray 5 (#2c2c2e) tertiary surface, Hairline separators (rgba(255,255,255,0.12)),
 * and signature high-contrast Pure White (#ffffff) / Black (#000000) interactive controls.
 */
export const APPLE_IOS_THEME = {
  dark: {
    background: '#131914',
    card: '#1C241E',
    cardGlass: 'rgba(28, 36, 30, 0.88)',
    cardHover: '#243027',
    surfaceSecondary: '#243027',
    surfaceTertiary: '#2A201A',
    dock: 'rgba(19, 25, 20, 0.94)',
    text: '#F5EFEB',
    textMuted: '#C5BAAB',
    textSubtle: '#8A7E70',
    primary: '#E6A756',
    primaryText: '#131914',
    primaryLight: 'rgba(230, 167, 86, 0.16)',
    primaryGlow: 'rgba(230, 167, 86, 0.28)',
    border: 'rgba(245, 239, 235, 0.10)',
    borderStrong: 'rgba(230, 167, 86, 0.35)',
    borderSubtle: 'rgba(245, 239, 235, 0.06)',
    accentBg: 'rgba(245, 239, 235, 0.05)',
    btnBg: '#2A201A',
    trackBg: 'rgba(245, 239, 235, 0.12)',
    glassBg: 'rgba(28, 36, 30, 0.92)',
    inputBg: '#1C241E',
    dayHeaderBg: '#1C241E',
    successBg: 'rgba(136, 178, 122, 0.18)',
    successText: '#88B27A',
    warningBg: 'rgba(217, 107, 67, 0.18)',
    warningText: '#D96B43',
    shadow: '0 12px 36px rgba(10, 14, 11, 0.65), 0 0 20px rgba(230, 167, 86, 0.08)',
  },
  light: {
    background: '#EFE9DF',
    card: '#FAF7F2',
    cardGlass: 'rgba(250, 247, 242, 0.90)',
    cardHover: '#F2EDE4',
    surfaceSecondary: '#E5DDD1',
    surfaceTertiary: '#D9CEBF',
    dock: 'rgba(250, 247, 242, 0.94)',
    text: '#1E2620',
    textMuted: '#685C50',
    textSubtle: '#9C8E7F',
    primary: '#C88232',
    primaryText: '#FFFFFF',
    primaryLight: 'rgba(200, 130, 50, 0.12)',
    primaryGlow: 'rgba(200, 130, 50, 0.20)',
    border: 'rgba(30, 38, 32, 0.10)',
    borderStrong: 'rgba(200, 130, 50, 0.35)',
    borderSubtle: 'rgba(30, 38, 32, 0.05)',
    accentBg: 'rgba(30, 38, 32, 0.04)',
    btnBg: '#E5DDD1',
    trackBg: 'rgba(30, 38, 32, 0.08)',
    glassBg: 'rgba(250, 247, 242, 0.94)',
    inputBg: '#EFE9DF',
    dayHeaderBg: '#FAF7F2',
    successBg: 'rgba(90, 138, 76, 0.15)',
    successText: '#4E7A40',
    warningBg: 'rgba(200, 90, 50, 0.15)',
    warningText: '#C25828',
    shadow: '0 8px 24px rgba(60, 48, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  },
};

// Aliased for seamless backward compatibility across all imports
export const EMERALD_GLASS_THEME = APPLE_IOS_THEME;

export function getAppTheme(isDark: boolean = true) {
  return isDark ? APPLE_IOS_THEME.dark : APPLE_IOS_THEME.light;
}

export type AppTheme = ReturnType<typeof getAppTheme>;

/**
 * Hardware-accelerated Apple Glassmorphism styles for React Native components.
 * Automatically polyfills backdrop-filter and specular box-shadows on web.
 */
export function getEmeraldGlassCard(isDark: boolean = true): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      backgroundColor: isDark ? 'rgba(28, 36, 30, 0.88)' : 'rgba(250, 247, 242, 0.90)',
      borderColor: isDark ? 'rgba(245, 239, 235, 0.10)' : 'rgba(30, 38, 32, 0.08)',
      borderWidth: 1,
      borderRadius: 22,
      ...({
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: isDark
          ? '0 12px 36px rgba(10, 14, 11, 0.65), 0 0 20px rgba(230, 167, 86, 0.06)'
          : '0 8px 24px rgba(60, 48, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }),
    };
  }
  return {
    backgroundColor: isDark ? '#1C241E' : '#FAF7F2',
    borderColor: isDark ? 'rgba(245, 239, 235, 0.10)' : 'rgba(30, 38, 32, 0.08)',
    borderWidth: 1,
    borderRadius: 22,
  };
}

export function getEmeraldGlassDock(isDark: boolean = true): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      backgroundColor: isDark ? 'rgba(19, 25, 20, 0.94)' : 'rgba(250, 247, 242, 0.94)',
      borderColor: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.10)',
      borderWidth: 1.5,
      borderRadius: 9999,
      ...({
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        boxShadow: isDark
          ? '0 20px 48px rgba(10, 14, 11, 0.8), 0 0 24px rgba(230, 167, 86, 0.10)'
          : '0 14px 32px rgba(60, 48, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }),
    };
  }
  return {
    backgroundColor: isDark ? '#131914' : '#FAF7F2',
    borderColor: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.10)',
    borderWidth: 1.5,
    borderRadius: 9999,
  };
}

export function getEmeraldGlassPill(isActive: boolean, isDark: boolean = true): ViewStyle {
  if (isActive) {
    return {
      backgroundColor: isDark ? '#E6A756' : '#C88232',
      borderColor: isDark ? '#E6A756' : '#C88232',
      borderWidth: 1,
      borderRadius: 14,
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: isDark ? '0 4px 16px rgba(230, 167, 86, 0.35)' : '0 4px 14px rgba(200, 130, 50, 0.25)',
          })
        : {}),
    };
  }
  return {
    backgroundColor: isDark ? 'rgba(245, 239, 235, 0.07)' : 'rgba(30, 38, 32, 0.05)',
    borderColor: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.08)',
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
    /* Apple iOS Warm Culinary Luxury (Forest & Amber Lantern) Global Engine */
    html, body, #root {
      background-color: ${isDark ? '#131914' : '#EFE9DF'} !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100%;
      position: relative;
      color: ${isDark ? '#F5EFEB' : '#1E2620'};
    }

    /* Clean root layers without extraneous background tints */
    #root > div,
    [data-glass="root"] {
      background-color: transparent !important;
    }

    /* Apple Grouped & Inset Cards (Forest Noir / Sage Velvet) */
    [data-glass="card"] {
      background: ${isDark ? 'rgba(28, 36, 30, 0.88)' : 'rgba(250, 247, 242, 0.90)'} !important;
      backdrop-filter: blur(28px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(245, 239, 235, 0.10)' : 'rgba(30, 38, 32, 0.08)'} !important;
      box-shadow: ${isDark
        ? '0 12px 36px rgba(10, 14, 11, 0.65), 0 0 20px rgba(230, 167, 86, 0.06)'
        : '0 8px 24px rgba(60, 48, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'} !important;
      border-radius: 22px !important;
      position: relative;
    }

    /* Apple iOS Translucent Navigation Dock */
    [data-glass="dock"] {
      background: ${isDark ? 'rgba(19, 25, 20, 0.94)' : 'rgba(250, 247, 242, 0.94)'} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.10)'} !important;
      box-shadow: ${isDark
        ? '0 20px 48px rgba(10, 14, 11, 0.8), 0 0 24px rgba(230, 167, 86, 0.10)'
        : '0 14px 32px rgba(60, 48, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'} !important;
      border-radius: 9999px !important;
    }

    /* Apple iOS Segmented Control & Inactive Pills */
    [data-glass="pill"] {
      background: ${isDark ? 'rgba(245, 239, 235, 0.07)' : 'rgba(30, 38, 32, 0.05)'} !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: 1px solid ${isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.08)'} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="pill"]:hover {
      background: ${isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.08)'} !important;
      border-color: ${isDark ? 'rgba(230, 167, 86, 0.35)' : 'rgba(200, 130, 50, 0.25)'} !important;
      transform: translateY(-1px);
    }

    /* Apple iOS Active / Selected Pill (Amber Lamp Glow) */
    [data-glass="pill-active"] {
      background: ${isDark ? '#E6A756' : '#C88232'} !important;
      border: 1px solid ${isDark ? '#E6A756' : '#C88232'} !important;
      box-shadow: 0 4px 16px ${isDark ? 'rgba(230, 167, 86, 0.35)' : 'rgba(200, 130, 50, 0.25)'} !important;
      border-radius: 14px !important;
    }
    [data-glass="pill-active"] * {
      color: ${isDark ? '#131914' : '#FFFFFF'} !important;
      font-weight: 800 !important;
    }

    /* Apple Primary Action Button (Warm Honey Amber Glow) */
    [data-glass="btn-primary"] {
      background: ${isDark ? 'linear-gradient(135deg, #F3C06D 0%, #E6A756 100%)' : 'linear-gradient(135deg, #D98E3A 0%, #C88232 100%)'} !important;
      border: 1px solid ${isDark ? 'rgba(243, 192, 109, 0.4)' : 'rgba(200, 130, 50, 0.4)'} !important;
      box-shadow: 0 6px 20px ${isDark ? 'rgba(230, 167, 86, 0.35)' : 'rgba(200, 130, 50, 0.25)'} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="btn-primary"] * {
      color: ${isDark ? '#131914' : '#FFFFFF'} !important;
      font-weight: 800 !important;
    }
    [data-glass="btn-primary"]:hover {
      opacity: 0.92;
      transform: translateY(-1.5px) scale(1.015);
      box-shadow: 0 8px 24px ${isDark ? 'rgba(230, 167, 86, 0.45)' : 'rgba(200, 130, 50, 0.32)'} !important;
    }
    [data-glass="btn-primary"]:active {
      transform: translateY(1px) scale(0.985);
      opacity: 0.85;
    }

    /* Apple Modals & Bottom Sheets (Forest Velvet Sheet Presentation) */
    [data-glass="modal"] {
      background: ${isDark ? 'rgba(20, 27, 22, 0.96)' : 'rgba(250, 247, 242, 0.97)'} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(30, 38, 32, 0.10)'} !important;
      box-shadow: 0 28px 64px rgba(10, 14, 11, 0.75), inset 0 1px 0 rgba(245, 239, 235, 0.08) !important;
      border-radius: 26px !important;
    }

    /* Apple Smooth Hover Physics */
    div[role="button"] {
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    div[role="button"]:hover {
      filter: brightness(1.08);
    }

    /* Clean Modern Scrollbars: hidden track to remove lateral bar clutter */
    ::-webkit-scrollbar {
      width: 0px;
      height: 0px;
      display: none;
    }
    * {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
  `;
}
