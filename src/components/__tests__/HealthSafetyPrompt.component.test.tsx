import React from 'react';
import { Modal } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HealthSafetyPrompt } from '../HealthSafetyPrompt';

function setup() {
  const onAnswer = jest.fn();
  const onDismiss = jest.fn();
  render(<HealthSafetyPrompt visible onAnswer={onAnswer} onDismiss={onDismiss} isDark={false} />);
  return { onAnswer, onDismiss };
}

describe('HealthSafetyPrompt (A.7e-5f)', () => {
  test('"Închide întrebarea" dismisses and answers nothing', () => {
    const { onAnswer, onDismiss } = setup();

    fireEvent.press(screen.getByLabelText('Închide întrebarea', { includeHiddenElements: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  test('the Android back button dismisses and answers nothing', () => {
    const { onAnswer, onDismiss } = setup();

    screen.UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  test('the two buttons answer yes and no', () => {
    const { onAnswer } = setup();

    fireEvent.press(screen.getByRole('button', { name: 'Da, mi se aplică' }));
    fireEvent.press(screen.getByRole('button', { name: 'Nu, niciuna' }));

    expect(onAnswer.mock.calls).toEqual([['yes'], ['no']]);
  });
});
