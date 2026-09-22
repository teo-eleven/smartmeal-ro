import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UndoBanner } from '../UndoBanner';

const baseProps = {
  visible: true,
  message: 'Planul săptămânal a fost șters.',
  actionLabel: 'Anulează ștergerea',
  onAction: jest.fn(),
  onDismiss: jest.fn(),
  isDark: false,
};

describe('UndoBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows what happened and how to take it back', () => {
    render(<UndoBanner {...baseProps} />);
    expect(screen.getByText(baseProps.message)).toBeTruthy();
    expect(screen.getByLabelText(baseProps.actionLabel)).toBeTruthy();
  });

  test('the undo action reaches the store', () => {
    render(<UndoBanner {...baseProps} />);
    fireEvent.press(screen.getByLabelText(baseProps.actionLabel));
    expect(baseProps.onAction).toHaveBeenCalledTimes(1);
  });

  test('dismissing does not undo', () => {
    render(<UndoBanner {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Ascunde mesajul'));
    expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
    expect(baseProps.onAction).not.toHaveBeenCalled();
  });

  test('stays out of the way when there is nothing to undo', () => {
    render(<UndoBanner {...baseProps} visible={false} />);
    expect(screen.queryByText(baseProps.message)).toBeNull();
  });
});
