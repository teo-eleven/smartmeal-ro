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

/**
 * The backdrop used to wrap the card. To a screen reader that made the whole dialog one
 * pressable element, with the buttons inside it out of reach. It is now its own element
 * behind the card, announced as what it does.
 */
describe('ConfirmDialog, fundalul', () => {
  // The card is accessibilityViewIsModal, so on iOS a screen reader stays inside it and
  // never lands on the backdrop, which is the intent. The label and role serve web and
  // Android, hence the hidden-elements query.
  test('e un buton separat, cu etichetă, care anulează', () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);

    const backdrop = screen.getByLabelText('Închide fereastra', { includeHiddenElements: true });
    expect(backdrop.props.accessibilityRole).toBe('button');
    fireEvent.press(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('butoanele din card rămân atingibile separat', () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);

    fireEvent.press(screen.getByText('Șterge și începe din nou'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });
});

