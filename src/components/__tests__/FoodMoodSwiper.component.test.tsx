import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FoodMoodSwiper } from '../FoodMoodSwiper';
import { MoodTag } from '../../types';

describe('FoodMoodSwiper Component (Tinder-style Food Swiper)', () => {
  const mockOnToggleMood = jest.fn();
  const initialMoods: MoodTag[] = ['romanian_classic'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial top card in swipe mode with title and vibe', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={initialMoods}
        onToggleMood={mockOnToggleMood}
        isDark={true}
        maxMoods={5}
      />
    );

    // Initial card is 'speedy' ("Mese Rapide (<25 min)")
    expect(screen.getByText('Mese Rapide (<25 min)')).toBeTruthy();
    expect(screen.getByText('Rapid & Eficient')).toBeTruthy();
    expect(screen.getByText('Pas')).toBeTruthy();
    expect(screen.getByText('Îmi place')).toBeTruthy();
    expect(screen.getByText('1/5 pofte')).toBeTruthy();
  });

  it('triggers like on pressing Îmi place button and advances to next card', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={[]}
        onToggleMood={mockOnToggleMood}
        isDark={false}
        maxMoods={5}
      />
    );

    const likeButton = screen.getByText('Îmi place');
    fireEvent.press(likeButton);

    // Should toggle 'speedy'
    expect(mockOnToggleMood).toHaveBeenCalledWith('speedy');

    // Next card should now be displayed: 'romanian_classic' ("Tradițional Românesc")
    expect(screen.getByText('Tradițional Românesc')).toBeTruthy();
  });

  it('triggers pass on pressing Pas button and advances without liking', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={[]}
        onToggleMood={mockOnToggleMood}
        isDark={true}
        maxMoods={5}
      />
    );

    const passButton = screen.getByText('Pas');
    fireEvent.press(passButton);

    // speedy was not selected, so passing should not toggle it
    expect(mockOnToggleMood).not.toHaveBeenCalled();

    // Next card should now be displayed: 'romanian_classic'
    expect(screen.getByText('Tradițional Românesc')).toBeTruthy();
  });

  it('switches to classic grid view and allows direct toggling', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={initialMoods}
        onToggleMood={mockOnToggleMood}
        isDark={true}
        maxMoods={5}
      />
    );

    const gridToggle = screen.getByText('📱 Grilă Clasică');
    fireEvent.press(gridToggle);

    // In grid view, multiple cards should be rendered at once
    expect(screen.getByText('Paste & Arome Italienești')).toBeTruthy();
    expect(screen.getByText('Grătar & Cărnuri Fragede')).toBeTruthy();
    expect(screen.getByText('Bogat în Proteine (>35g)')).toBeTruthy();

    // Clicking a grid item toggles it
    const pastaCard = screen.getByText('Paste & Arome Italienești');
    fireEvent.press(pastaCard);
    expect(mockOnToggleMood).toHaveBeenCalledWith('pasta_italian');
  });

  it('supports undoing a swipe via the Undo button', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={[]}
        onToggleMood={mockOnToggleMood}
        isDark={true}
        maxMoods={5}
      />
    );

    // Swipe first card (speedy)
    fireEvent.press(screen.getByText('Îmi place'));
    expect(screen.getByText('Tradițional Românesc')).toBeTruthy();

    // Now press Undo (↺)
    const undoButton = screen.getByLabelText('Anulează ultima acțiune');
    fireEvent.press(undoButton);

    // Returns back to 'speedy'
    expect(screen.getByText('Mese Rapide (<25 min)')).toBeTruthy();
  });

  it('supports unlimited selections and bulk select all', () => {
    const mockOnSetMoods = jest.fn();
    render(
      <FoodMoodSwiper
        selectedMoods={['speedy', 'romanian_classic']}
        onToggleMood={mockOnToggleMood}
        onSetMoods={mockOnSetMoods}
        isDark={true}
      />
    );

    expect(screen.getByText('2 pofte alese (Nelimitat ✨)')).toBeTruthy();

    const selectAllBtn = screen.getByText('⚡ Selectează toate (12)');
    fireEvent.press(selectAllBtn);
    expect(mockOnSetMoods).toHaveBeenCalledWith(
      expect.arrayContaining(['speedy', 'romanian_classic', 'pasta_italian'])
    );
  });

  it('supports navigation via next and prev arrow buttons', () => {
    render(
      <FoodMoodSwiper
        selectedMoods={[]}
        onToggleMood={mockOnToggleMood}
        isDark={false}
      />
    );

    const nextArrow = screen.getByLabelText('Cardul următor');
    fireEvent.press(nextArrow);

    const prevArrow = screen.getByLabelText('Cardul anterior');
    fireEvent.press(prevArrow);
  });
});
