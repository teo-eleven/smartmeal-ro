import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PhotoCreditLine } from '../PhotoCreditLine';
import { RECIPES } from '../../data/recipes';
import { getRecipePhoto } from '../../utils/recipePhotography';

jest.mock('../../utils/recipePhotography', () => ({ getRecipePhoto: jest.fn() }));
const mockPhoto = getRecipePhoto as jest.Mock;

const CREDIT = {
  author: 'Ana Popescu',
  license: 'CC BY-SA 4.0',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mamaliga.jpg',
};

describe('PhotoCreditLine', () => {
  test('afișează autorul și licența unei poze de pe Commons', () => {
    mockPhoto.mockReturnValue({ url: 'https://upload.wikimedia.org/x.jpg', credit: CREDIT });
    render(<PhotoCreditLine recipe={RECIPES[0]} color="#fff" />);

    expect(screen.getByText(/CC BY-SA 4.0 · Ana Popescu/)).toBeTruthy();
  });

  test('zona de apăsare are cel puțin 44 de puncte, iar licența nu e tăiată pe un rând', () => {
    mockPhoto.mockReturnValue({ url: 'https://upload.wikimedia.org/x.jpg', credit: CREDIT });
    render(<PhotoCreditLine recipe={RECIPES[0]} color="#fff" />);
    const link = screen.getByRole('link');

    expect(StyleSheet.flatten(link.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(screen.getByText(/CC BY-SA 4.0/).props.numberOfLines).toBeGreaterThanOrEqual(2);
  });

  test('apăsarea deschide pagina fișierului, unde se poate verifica licența', () => {
    mockPhoto.mockReturnValue({ url: 'https://upload.wikimedia.org/x.jpg', credit: CREDIT });
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    render(<PhotoCreditLine recipe={RECIPES[0]} color="#fff" />);

    fireEvent.press(screen.getByRole('link'));

    expect(openURL).toHaveBeenCalledWith(CREDIT.sourceUrl);
  });

  test('nu afișează nimic pentru o poză fără credit sau pentru cardul generat', () => {
    mockPhoto.mockReturnValue({ url: 'https://images.unsplash.com/x' });
    const { toJSON, rerender } = render(<PhotoCreditLine recipe={RECIPES[0]} color="#fff" />);
    expect(toJSON()).toBeNull();

    mockPhoto.mockReturnValue(null);
    rerender(<PhotoCreditLine recipe={RECIPES[0]} color="#fff" />);
    expect(toJSON()).toBeNull();
  });
});
