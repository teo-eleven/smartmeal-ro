import 'react-native';

/**
 * react-native-web renders a `dataSet` prop as `data-*` attributes, which the glass theme
 * in styles/theme.ts targets from CSS. React Native's own types do not declare the prop,
 * which is why every call site used to carry an `as any` cast. Declaring it once here
 * removes all of them and keeps the props type-checked.
 */
declare module 'react-native' {
  /**
   * CSS properties react-native-web renders but React Native's style types omit, since
   * they have no native equivalent. Declared here so the web styling in styles/theme.ts
   * does not need a cast per rule.
   */
  interface ViewStyle {
    backdropFilter?: string;
    WebkitBackdropFilter?: string;
    boxShadow?: string;
    transition?: string;
  }

  interface ViewProps {
    dataSet?: Record<string, string>;
  }
  interface TouchableOpacityProps {
    dataSet?: Record<string, string>;
  }
  interface TextProps {
    dataSet?: Record<string, string>;
  }
  interface ScrollViewProps {
    dataSet?: Record<string, string>;
  }
}
