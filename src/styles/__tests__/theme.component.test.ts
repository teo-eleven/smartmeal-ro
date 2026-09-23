import { Platform } from 'react-native';
import {
  getAppTheme,
  getEmeraldGlassCard,
  getEmeraldGlassDock,
  getEmeraldGlassPill,
  injectEmeraldGlassStyles,
} from '../theme';

describe('theme tokens', () => {
  test('light and dark are genuinely different palettes', () => {
    // Arrange & Act
    const light = getAppTheme(false);
    const dark = getAppTheme(true);

    // Assert
    expect(light.background).not.toBe(dark.background);
    expect(light.text).not.toBe(dark.text);
  });

  test('every surface a screen relies on is defined in both themes', () => {
    // Arrange
    const required = [
      'background',
      'card',
      'text',
      'textMuted',
      'border',
      'borderStrong',
      'primary',
      'primaryText',
      'btnBg',
      'surfaceSecondary',
      'surfaceTertiary',
      'trackBg',
      'warningBg',
      'warningText',
    ] as const;

    // Act & Assert
    [true, false].forEach((isDark) => {
      const theme = getAppTheme(isDark);
      required.forEach((token) => {
        expect(theme[token]).toBeTruthy();
      });
    });
  });

  test('glass helpers return usable styles for both themes', () => {
    [true, false].forEach((isDark) => {
      expect(getEmeraldGlassCard(isDark).borderRadius).toBeGreaterThan(0);
      expect(getEmeraldGlassDock(isDark)).toBeTruthy();
      expect(getEmeraldGlassPill(true, isDark)).toBeTruthy();
      expect(getEmeraldGlassPill(false, isDark)).toBeTruthy();
    });
  });

  test('an active pill is visually distinct from an inactive one', () => {
    expect(getEmeraldGlassPill(true, true)).not.toEqual(getEmeraldGlassPill(false, true));
  });
});

interface StubElement {
  id?: string;
  textContent?: string;
}

/** Installs a minimal stand-in for `document`, since these tests run in plain Node. */
function installStubDocument(stub: {
  getElementById: () => StubElement | null;
  createElement: () => StubElement;
  head: { appendChild: (el: StubElement) => void };
}): void {
  (globalThis as { document?: unknown }).document = stub;
}

function removeStubDocument(): void {
  delete (globalThis as { document?: unknown }).document;
}

describe('injectEmeraldGlassStyles', () => {
  // The function is a no-op off the web, which is where these styles are needed.
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    removeStubDocument();
  });

  test('does nothing, and does not throw, outside a browser', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(() => injectEmeraldGlassStyles(true)).not.toThrow();
  });

  test('does not throw on web when there is no document', () => {
    expect(() => injectEmeraldGlassStyles(true)).not.toThrow();
  });

  test('writes a stylesheet into the document when one exists', () => {
    // Arrange
    const created: StubElement[] = [];
    const appended: StubElement[] = [];
    installStubDocument({
      getElementById: () => null,
      createElement: () => {
        const el: StubElement = {};
        created.push(el);
        return el;
      },
      head: { appendChild: (el) => appended.push(el) },
    });

    // Act
    injectEmeraldGlassStyles(true);

    // Assert
    expect(created.length).toBeGreaterThan(0);
    expect(appended.length).toBeGreaterThan(0);
    expect(created[0].textContent).toContain('glass');
  });

  test('reuses the existing stylesheet instead of stacking duplicates', () => {
    // Arrange
    const existing: StubElement = { textContent: 'old' };
    let createdCount = 0;
    installStubDocument({
      getElementById: () => existing,
      createElement: () => {
        createdCount += 1;
        return {};
      },
      head: { appendChild: () => undefined },
    });

    // Act
    injectEmeraldGlassStyles(false);

    // Assert
    expect(createdCount).toBe(0);
    expect(existing.textContent).not.toBe('old');
  });
});
