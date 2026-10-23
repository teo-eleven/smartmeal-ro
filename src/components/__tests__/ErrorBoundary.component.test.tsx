import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

/** The last line between a thrown error and a white screen. */
let shouldThrow = true;
function Fragile() {
  if (shouldThrow) throw new Error('rețeta „sarmale” nu există');
  return <Text>Meniul săptămânii</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

test('fără erori arată ecranul normal', () => {
  shouldThrow = false;
  render(
    <ErrorBoundary isDark>
      <Fragile />
    </ErrorBoundary>
  );

  expect(screen.getByText('Meniul săptămânii')).toBeTruthy();
});

test('o eroare la desenare devine un mesaj liniștitor, nu un ecran alb', () => {
  render(
    <ErrorBoundary isDark>
      <Fragile />
    </ErrorBoundary>
  );

  expect(screen.getByText('Ceva n-a mers cum trebuia')).toBeTruthy();
  expect(screen.getByText(/nu s-au pierdut/)).toBeTruthy();
});

test('textul erorii nu ajunge pe ecran (poate numi o rețetă sau o preferință)', () => {
  render(
    <ErrorBoundary isDark={false}>
      <Fragile />
    </ErrorBoundary>
  );

  expect(screen.queryByText(/sarmale/)).toBeNull();
});

test('„Încearcă din nou” redesenează ecranul când problema a trecut', () => {
  render(
    <ErrorBoundary isDark>
      <Fragile />
    </ErrorBoundary>
  );
  shouldThrow = false;

  fireEvent.press(screen.getByLabelText('Încearcă din nou'));

  expect(screen.getByText('Meniul săptămânii')).toBeTruthy();
});
