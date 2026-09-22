import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  numColumns: number;
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 1400;

  const numColumns = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;
  const contentMaxWidth = isDesktop
    ? Math.min(Math.max(width - 48, 1200), 1680)
    : isTablet
    ? 960
    : 540;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    numColumns,
    contentMaxWidth,
  };
}
