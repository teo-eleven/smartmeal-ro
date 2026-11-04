import { Platform, ViewStyle } from 'react-native';

/**
 * "Midnight Forest & Smoked Walnut": forest green and smoked walnut on cream, edged in bronze.
 * Every colour the app draws comes from these tones; the contrast of each text against each
 * surface is pinned by themePalette.component.test.ts (WCAG 2.1 AA).
 */
export const FOREST_WALNUT_PALETTE = {
  forestNight: '#1E2114',
  forestDeep: '#262B1D',
  forest: '#323828',
  forestMoss: '#474C3D',
  walnutDark: '#583925',
  walnut: '#6E4A33',
  walnutLight: '#845B43',
  cream: '#E6DCCC',
  creamLight: '#F4EEE4',
  creamDeep: '#DDD1C1',
  bronze: '#B08868',
  bronzeLight: '#C9A57B',
  bronzeGlow: '#D8B98F',
  champagne: '#EDE4D3',
  champagneMuted: '#C8BBA4',
  champagneSubtle: '#9C8F78',
  inkMuted: '#4E4A3B',
  inkSubtle: '#7A6F5C',
  sageDark: '#9DBB86',
  sageLight: '#3F6B33',
  emberDark: '#E08A5C',
  emberLight: '#A84A1E',
  coralDark: '#F09A86',
  brickLight: '#9A2F24',
  frostDark: '#8FB8C9',
  frostLight: '#3E6D80',
  plumDark: '#C39BB5',
  plumLight: '#7A4E6B',
  white: '#FFFFFF',
  shadowInk: '#0B0D07',
} as const;

const P = FOREST_WALNUT_PALETTE;

/** A palette tone at the given opacity, as rgba(), for glass, glows and hairlines. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const APPLE_IOS_THEME = {
  dark: {
    background: P.forestNight,
    card: P.forestDeep,
    cardGlass: withAlpha(P.forestDeep, 0.9),
    cardHover: P.forest,
    surfaceSecondary: P.forest,
    surfaceTertiary: P.walnutDark,
    dock: withAlpha(P.forestNight, 0.94),
    text: P.champagne,
    textMuted: P.champagneMuted,
    textSubtle: P.champagneSubtle,
    /** The brightest bronze: lighter ones failed on bronze-tinted chips (axe, T.11). */
    primary: P.bronzeGlow,
    primaryText: P.forestNight,
    /** Buttons, progress bars and step dots: a two-stop gradient of the accent. */
    primaryGradient: [P.bronzeGlow, P.bronzeLight] as [string, string],
    /** The brighter accent: the "Premium" tier, the active card, the dessert slot. */
    accentHighlight: P.bronzeGlow,
    primaryLight: withAlpha(P.bronzeLight, 0.16),
    primaryGlow: withAlpha(P.bronzeLight, 0.28),
    border: withAlpha(P.champagne, 0.1),
    borderStrong: withAlpha(P.bronze, 0.45),
    /** A discreet bronze edge, kept for the few cards that matter (meal, recipe, summary). */
    cardRim: withAlpha(P.bronze, 0.3),
    borderSubtle: withAlpha(P.champagne, 0.06),
    accentBg: withAlpha(P.champagne, 0.05),
    btnBg: P.walnutDark,
    trackBg: withAlpha(P.champagne, 0.12),
    glassBg: withAlpha(P.forestDeep, 0.92),
    inputBg: P.forestDeep,
    dayHeaderBg: P.forestDeep,
    successBg: withAlpha(P.sageDark, 0.18),
    successText: P.sageDark,
    warningBg: withAlpha(P.emberDark, 0.18),
    warningText: P.emberDark,
    /** Safety, not decoration: allergens, alcohol, diets that do not fit. Stays recognisably red. */
    danger: P.coralDark,
    dangerBg: withAlpha(P.coralDark, 0.14),
    onDanger: P.forestNight,
    /** A filled "done" badge and the text on it. */
    success: P.sageDark,
    onSuccess: P.forestNight,
    shadowColor: P.shadowInk,
    /** Text on a supermarket's own brand colour (Lidl blue, Kaufland red...). */
    onBrand: P.white,
    successBorder: withAlpha(P.sageDark, 0.4),
    warningBorder: withAlpha(P.emberDark, 0.4),
    /** Over budget: from a warning to a stop. */
    dangerGradient: [P.emberDark, P.coralDark] as [string, string],
    /** Calories, protein, carbs and fat: one tone each, wherever macros are shown. */
    macro: { kcal: P.emberDark, protein: P.sageDark, carbs: P.bronzeGlow, fat: P.coralDark },
    /** Text and hairlines drawn on top of a recipe photo, which stay light on any photo. */
    onPhoto: P.white,
    onPhotoBorder: withAlpha(P.white, 0.15),
    photoScrim: withAlpha(P.shadowInk, 0.3),
    /** The big photo at the top of a recipe fades into this, so its title stays readable. */
    heroScrim: withAlpha(P.forestNight, 0.95),
    /** Dark glass and light glass pills laid on a photo, under `onPhoto` text. */
    photoPill: withAlpha(P.shadowInk, 0.7),
    photoPillLight: withAlpha(P.white, 0.18),
    /** "Favorit Lidl" and the like: one walnut badge, the store's brand stays on its dot. */
    storeBadge: withAlpha(P.walnut, 0.92),
    /** Behind a window that opens over the screen. */
    overlay: withAlpha(P.shadowInk, 0.75),
    dangerBorder: withAlpha(P.coralDark, 0.4),
    /** One muted tone per kind of thing (supermarket aisles), so groups stay apart. */
    category: {
      sage: P.sageDark,
      coral: P.coralDark,
      gold: P.bronzeGlow,
      plum: P.plumDark,
      ember: P.emberDark,
      bronze: P.bronzeLight,
      frost: P.frostDark,
    },
    shadow: `0 12px 36px ${withAlpha(P.shadowInk, 0.65)}, 0 0 20px ${withAlpha(P.bronze, 0.08)}`,
  },
  light: {
    background: P.cream,
    card: P.creamLight,
    cardGlass: withAlpha(P.creamLight, 0.92),
    cardHover: P.cream,
    surfaceSecondary: P.creamDeep,
    surfaceTertiary: withAlpha(P.walnut, 0.14),
    dock: withAlpha(P.creamLight, 0.94),
    text: P.forestNight,
    textMuted: P.inkMuted,
    textSubtle: P.inkSubtle,
    primary: P.walnut,
    primaryText: P.creamLight,
    primaryGradient: [P.walnutLight, P.walnut] as [string, string],
    accentHighlight: P.walnutLight,
    // 0.12 left walnut text at 4.44 on a secondary surface.
    primaryLight: withAlpha(P.walnut, 0.1),
    primaryGlow: withAlpha(P.walnut, 0.2),
    border: withAlpha(P.forestNight, 0.1),
    borderStrong: withAlpha(P.bronze, 0.55),
    cardRim: withAlpha(P.bronze, 0.4),
    borderSubtle: withAlpha(P.forestNight, 0.05),
    accentBg: withAlpha(P.forestNight, 0.04),
    btnBg: P.creamDeep,
    trackBg: withAlpha(P.forestNight, 0.08),
    glassBg: withAlpha(P.creamLight, 0.94),
    inputBg: P.cream,
    dayHeaderBg: P.creamLight,
    successBg: withAlpha(P.sageLight, 0.14),
    successText: P.sageLight,
    warningBg: withAlpha(P.emberLight, 0.14),
    warningText: P.emberLight,
    danger: P.brickLight,
    dangerBg: withAlpha(P.brickLight, 0.12),
    onDanger: P.creamLight,
    success: P.sageLight,
    onSuccess: P.creamLight,
    shadowColor: P.shadowInk,
    onBrand: P.white,
    successBorder: withAlpha(P.sageLight, 0.4),
    warningBorder: withAlpha(P.emberLight, 0.4),
    dangerGradient: [P.emberLight, P.brickLight] as [string, string],
    macro: { kcal: P.emberLight, protein: P.sageLight, carbs: P.walnut, fat: P.brickLight },
    onPhoto: P.white,
    onPhotoBorder: withAlpha(P.white, 0.15),
    photoScrim: withAlpha(P.shadowInk, 0.15),
    heroScrim: withAlpha(P.shadowInk, 0.65),
    photoPill: withAlpha(P.shadowInk, 0.7),
    photoPillLight: withAlpha(P.white, 0.18),
    storeBadge: withAlpha(P.walnut, 0.92),
    overlay: withAlpha(P.shadowInk, 0.6),
    dangerBorder: withAlpha(P.brickLight, 0.4),
    category: {
      sage: P.sageLight,
      coral: P.brickLight,
      gold: P.walnut,
      plum: P.plumLight,
      ember: P.emberLight,
      bronze: P.walnutLight,
      frost: P.frostLight,
    },
    shadow: `0 8px 24px ${withAlpha(P.walnutDark, 0.1)}, inset 0 1px 0 ${withAlpha(P.white, 0.7)}`,
  },
};

// Aliased for seamless backward compatibility across all imports
export const EMERALD_GLASS_THEME = APPLE_IOS_THEME;

export function getAppTheme(isDark: boolean = true) {
  return isDark ? APPLE_IOS_THEME.dark : APPLE_IOS_THEME.light;
}

export type AppTheme = ReturnType<typeof getAppTheme>;

/** A name in `theme.category`, for things that are told apart by colour. */
export type CategoryTone = keyof AppTheme['category'];

/** The glass, glow and gradient values the web CSS and the glass helpers share. */
function glassTokens(isDark: boolean) {
  return isDark
    ? {
        card: withAlpha(P.forestDeep, 0.9),
        dock: withAlpha(P.forestNight, 0.94),
        modal: withAlpha(P.forestNight, 0.96),
        hairline: withAlpha(P.champagne, 0.1),
        hairlineStrong: withAlpha(P.champagne, 0.14),
        pill: withAlpha(P.champagne, 0.07),
        pillHover: withAlpha(P.champagne, 0.12),
        cardShadow: `0 12px 36px ${withAlpha(P.shadowInk, 0.65)}, 0 0 20px ${withAlpha(P.bronze, 0.06)}`,
        dockShadow: `0 20px 48px ${withAlpha(P.shadowInk, 0.8)}, 0 0 24px ${withAlpha(P.bronze, 0.1)}`,
        glow: withAlpha(P.bronzeLight, 0.35),
        glowStrong: withAlpha(P.bronzeLight, 0.45),
        primaryGradient: `linear-gradient(135deg, ${P.bronzeGlow} 0%, ${P.bronzeLight} 100%)`,
      }
    : {
        card: withAlpha(P.creamLight, 0.92),
        dock: withAlpha(P.creamLight, 0.94),
        modal: withAlpha(P.creamLight, 0.97),
        hairline: withAlpha(P.forestNight, 0.08),
        hairlineStrong: withAlpha(P.forestNight, 0.1),
        pill: withAlpha(P.forestNight, 0.05),
        pillHover: withAlpha(P.forestNight, 0.08),
        cardShadow: `0 8px 24px ${withAlpha(P.walnutDark, 0.1)}, inset 0 1px 0 ${withAlpha(P.white, 0.7)}`,
        dockShadow: `0 14px 32px ${withAlpha(P.walnutDark, 0.1)}, inset 0 1px 0 ${withAlpha(P.white, 0.8)}`,
        glow: withAlpha(P.walnut, 0.25),
        glowStrong: withAlpha(P.walnut, 0.32),
        primaryGradient: `linear-gradient(135deg, ${P.walnutLight} 0%, ${P.walnut} 100%)`,
      };
}

/**
 * Hardware-accelerated Apple Glassmorphism styles for React Native components.
 * Automatically polyfills backdrop-filter and specular box-shadows on web.
 */
export function getEmeraldGlassCard(isDark: boolean = true): ViewStyle {
  const theme = getAppTheme(isDark);
  const glass = glassTokens(isDark);
  if (Platform.OS === 'web') {
    return {
      backgroundColor: glass.card,
      borderColor: glass.hairline,
      borderWidth: 1,
      borderRadius: 22,
      ...{
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: glass.cardShadow,
      },
    };
  }
  return {
    backgroundColor: theme.card,
    borderColor: glass.hairline,
    borderWidth: 1,
    borderRadius: 22,
  };
}

export function getEmeraldGlassDock(isDark: boolean = true): ViewStyle {
  const theme = getAppTheme(isDark);
  const glass = glassTokens(isDark);
  if (Platform.OS === 'web') {
    return {
      backgroundColor: glass.dock,
      borderColor: glass.hairlineStrong,
      borderWidth: 1.5,
      borderRadius: 9999,
      ...{
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        boxShadow: glass.dockShadow,
      },
    };
  }
  return {
    backgroundColor: theme.background,
    borderColor: glass.hairlineStrong,
    borderWidth: 1.5,
    borderRadius: 9999,
  };
}

export function getEmeraldGlassPill(isActive: boolean, isDark: boolean = true): ViewStyle {
  const theme = getAppTheme(isDark);
  const glass = glassTokens(isDark);
  if (isActive) {
    return {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      borderWidth: 1,
      borderRadius: 14,
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 4px 16px ${glass.glow}`,
          }
        : {}),
    };
  }
  return {
    backgroundColor: glass.pill,
    borderColor: glass.hairlineStrong,
    borderWidth: 1,
    borderRadius: 14,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }
      : {}),
  };
}

/**
 * Injects the theme's glass, pill and button styles into the page head on Expo Web, where
 * they outrank component styles (`!important`), so they must follow the palette too.
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

  const theme = getAppTheme(isDark);
  const glass = glassTokens(isDark);

  styleEl.textContent = `
    /* Midnight Forest & Smoked Walnut */
    html, body, #root {
      background-color: ${theme.background} !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100%;
      position: relative;
      color: ${theme.text};
    }

    /* Clean root layers without extraneous background tints */
    #root > div,
    [data-glass="root"] {
      background-color: transparent !important;
    }

    /* Keyboard focus in the accent instead of the browser's blue; never removed. */
    input:focus,
    textarea:focus,
    [tabindex]:focus-visible {
      outline: 2px solid ${theme.primary} !important;
      outline-offset: 2px;
    }

    [data-glass="card"],
    [data-glass="card-rim"] {
      background: ${glass.card} !important;
      backdrop-filter: blur(28px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
      border: 1px solid ${glass.hairline} !important;
      box-shadow: ${glass.cardShadow} !important;
      border-radius: 22px !important;
      position: relative;
    }

    [data-glass="card-rim"] {
      border-color: ${theme.cardRim} !important;
    }

    [data-glass="dock"] {
      background: ${glass.dock} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${glass.hairlineStrong} !important;
      box-shadow: ${glass.dockShadow} !important;
      border-radius: 9999px !important;
    }

    [data-glass="pill"] {
      background: ${glass.pill} !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: 1px solid ${glass.hairlineStrong} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="pill"]:hover {
      background: ${glass.pillHover} !important;
      border-color: ${theme.borderStrong} !important;
      transform: translateY(-1px);
    }

    [data-glass="pill-active"] {
      background: ${theme.primary} !important;
      border: 1px solid ${theme.primary} !important;
      box-shadow: 0 4px 16px ${glass.glow} !important;
      border-radius: 14px !important;
    }
    [data-glass="pill-active"] * {
      color: ${theme.primaryText} !important;
      font-weight: 800 !important;
    }

    [data-glass="btn-primary"] {
      background: ${glass.primaryGradient} !important;
      border: 1px solid ${theme.borderStrong} !important;
      box-shadow: 0 6px 20px ${glass.glow} !important;
      border-radius: 14px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    [data-glass="btn-primary"] * {
      color: ${theme.primaryText} !important;
      font-weight: 800 !important;
    }
    [data-glass="btn-primary"]:hover {
      opacity: 0.92;
      transform: translateY(-1.5px) scale(1.015);
      box-shadow: 0 8px 24px ${glass.glowStrong} !important;
    }
    [data-glass="btn-primary"]:active {
      transform: translateY(1px) scale(0.985);
      opacity: 0.85;
    }

    [data-glass="modal"] {
      background: ${glass.modal} !important;
      backdrop-filter: blur(36px) saturate(190%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
      border: 1px solid ${glass.hairlineStrong} !important;
      box-shadow: 0 28px 64px ${withAlpha(P.shadowInk, 0.75)}, inset 0 1px 0 ${withAlpha(P.champagne, 0.08)} !important;
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
