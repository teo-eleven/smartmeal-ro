/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
// React Native's source reads __DEV__, which its own Metro build normally injects.
global.__DEV__ = true;

// Required at module scope: requiring it inside a hook registers RNTL's own hooks too late.
const { act } = require('@testing-library/react-native');

// expo-linear-gradient is a native module; a plain View is enough for assertions.
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// expo-image is native too. A View keeps the props (source, onError, testID) inspectable, so
// tests can fire the load error and check the fallback.
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = (props) => React.createElement(View, props);
  return { Image };
});

// Several components schedule a short "done" feedback with setTimeout. Left running, those
// timers outlive the test and Jest force-exits the worker.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  // Flushing timers can drive Animated, which updates state, so it belongs inside act().
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

// Rendering tests await real effects (waitFor). With every worker busy on a loaded machine,
// two awaits could pass the default 5 s and fail a correct test. This changes only how long
// a test may take, never what it checks.
jest.setTimeout(15000);
