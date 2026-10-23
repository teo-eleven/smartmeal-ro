import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { LoadingToast } from '../LoadingToast';

describe('LoadingToast Component', () => {
  test('does not render when visible is false', () => {
    render(<LoadingToast visible={false} isDark={true} message="Sincronizare..." />);

    expect(screen.queryByText('Sincronizare...')).toBeNull();
  });

  test('renders message and accessibilityLabel when visible is true in dark mode', () => {
    render(<LoadingToast visible={true} isDark={true} message="Se sincronizează..." />);

    expect(screen.getByText('Se sincronizează...')).toBeTruthy();
    expect(screen.getByLabelText('Se sincronizează...')).toBeTruthy();
  });

  test('renders properly in light mode with custom accessibilityLabel', () => {
    render(
      <LoadingToast
        visible={true}
        isDark={false}
        message="Salvat cu succes!"
        accessibilityLabel="Notificare salvare"
      />
    );

    expect(screen.getByText('Salvat cu succes!')).toBeTruthy();
    expect(screen.getByLabelText('Notificare salvare')).toBeTruthy();
  });

  test('when hidden it plays its exit, then leaves the screen', () => {
    const { rerender } = render(<LoadingToast visible isDark message="Se sincronizează..." />);

    rerender(<LoadingToast visible={false} isDark message="Se sincronizează..." />);
    expect(screen.getByText('Se sincronizează...')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Se sincronizează...')).toBeNull();
  });

  test('unmounting mid-animation leaves nothing running', () => {
    const { unmount } = render(<LoadingToast visible isDark message="Se sincronizează..." />);

    unmount();

    expect(() => act(() => jest.advanceTimersByTime(1000))).not.toThrow();
  });
});
