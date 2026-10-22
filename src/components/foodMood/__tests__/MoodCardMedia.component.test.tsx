import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MoodCardMedia } from '../MoodCardMedia';
import { ARCHETYPE_PHOTO_URLS } from '../../../utils/recipePhotography';

describe('MoodCardMedia', () => {
  test('arată poza tipului de mâncare, din cache pe disc', () => {
    render(<MoodCardMedia archetype="soup" isDark />);
    const photo = screen.getByTestId('mood-card-photo');

    expect(photo.props.source).toEqual({ uri: ARCHETYPE_PHOTO_URLS.soup });
    expect(photo.props.cachePolicy).toBe('memory-disk');
  });

  test('dacă poza nu se încarcă, trece pe fundalul local', () => {
    render(<MoodCardMedia archetype="soup" isDark />);

    fireEvent(screen.getByTestId('mood-card-photo'), 'error');

    expect(screen.queryByTestId('mood-card-photo')).toBeNull();
    expect(screen.getByTestId('mood-card-backdrop')).toBeTruthy();
  });

  test('cardul „Gustare” nu mai arată un smoothie', () => {
    expect(ARCHETYPE_PHOTO_URLS.snack).not.toContain('photo-1553530666-ba11a7da3888');
  });
});

test('o eroare la poza unui tip de mâncare nu se moștenește când cardul trece la alt tip', () => {
  const { rerender } = render(<MoodCardMedia archetype="soup" isDark />);
  fireEvent(screen.getByTestId('mood-card-photo'), 'error');

  rerender(<MoodCardMedia archetype="pasta" isDark />);

  expect(screen.getByTestId('mood-card-photo').props.source).toEqual({
    uri: ARCHETYPE_PHOTO_URLS.pasta,
  });
});
