import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  isDark: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * The last line between a thrown error and a white screen.
 *
 * Several actions reach the store from an `onPress` handler, and anything that throws there
 * unmounts the whole tree with nothing in its place. A meal planner that shows a blank page
 * is indistinguishable from one that has lost the user's week, so this says what happened
 * and offers the one thing that reliably helps: starting the screen again.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // The message may name a recipe or a preference, so it goes to the console and never
    // onto the screen or to a third party.
    console.warn('[ErrorBoundary] Caught a render error:', error.message);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { isDark } = this.props;
    const theme = getAppTheme(isDark);
    const bg = theme.background;
    const fg = theme.text;
    const muted = theme.textMuted;

    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Text style={[styles.title, { color: fg }]}>Ceva n-a mers cum trebuia</Text>
        <Text style={[styles.message, { color: muted }]}>
          Planul și setările tale sunt salvate și nu s-au pierdut. Încearcă din nou; dacă se
          repetă, repornește aplicația.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Încearcă din nou"
          onPress={this.handleRetry}
          style={[styles.button, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>Încearcă din nou</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 19, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 14, fontWeight: '500', lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  button: {
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 12,
  },
  buttonText: { fontSize: 14, fontWeight: '800' },
});
