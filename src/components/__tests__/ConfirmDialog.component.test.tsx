import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ConfirmDialog } from '../ConfirmDialog';

const baseProps = {
  visible: true,
  title: 'Ștergi planul curent?',
  message: 'Se șterg meniul, lista și preferințele.',
  confirmLabel: 'Șterge și începe din nou',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
  isDark: false,
};

describe('ConfirmDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  test('states what will be lost', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText(baseProps.title)).toBeTruthy();
    expect(screen.getByText(baseProps.message)).toBeTruthy();
  });

  test('destroys nothing until the destructive button is pressed', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(baseProps.onConfirm).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText(baseProps.confirmLabel));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  test('cancelling reports a cancel, never a confirm', () => {
    render(<ConfirmDialog {...baseProps} />);

    fireEvent.press(screen.getByLabelText('Anulează'));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  test('renders nothing while hidden', () => {
    render(<ConfirmDialog {...baseProps} visible={false} />);
    expect(screen.queryByText(baseProps.title)).toBeNull();
  });
});
