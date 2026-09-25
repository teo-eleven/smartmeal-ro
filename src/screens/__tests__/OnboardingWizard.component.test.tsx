import React from 'react';
import { Dimensions } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { useAppStore } from '../../store/useAppStore';
import { getRetailProductsByCategory } from '../../data/retailProducts';

function reset() {
  useAppStore.getState().resetOnboarding();
  useAppStore.getState().dismissUndo();
}

describe('OnboardingWizard', () => {
  beforeEach(reset);

  test('opens on the supermarket step', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Alege magazinul tău/i)).toBeTruthy();
  });

  test('offers a quick start that skips the questionnaire', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByLabelText(/Pornire rapidă/i)).toBeTruthy();
  });

  test('quick start produces a plan without answering anything', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('shows progress through the nine steps', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Pasul 1 din 9/i)).toBeTruthy();
  });

  test('advancing reaches the people step', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByText(/Continuă|Următorul|Mai departe/i));
    expect(useAppStore.getState().currentStep).toBe(2);
  });

  test('the diet step offers the allergen selector', () => {
    useAppStore.getState().goToStep(7);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ai alergii alimentare/i)).toBeTruthy();
  });

  test('the diet step reports how many recipes remain', () => {
    useAppStore.getState().goToStep(7);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('choosing an allergy narrows the catalog', () => {
    useAppStore.getState().goToStep(7);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByLabelText(/Evită Lactate/i));
    expect(useAppStore.getState().preferences.avoidedAllergens).toContain('lactate');
  });

  test('the appliance step also reports availability', () => {
    useAppStore.getState().goToStep(8);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ce aparate ai în bucătărie/i)).toBeTruthy();
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('renders each step without crashing', () => {
    for (let step = 1; step <= 9; step += 1) {
      useAppStore.getState().goToStep(step);
      const view = render(<OnboardingWizard isDark={step % 2 === 0} onPlanGenerated={jest.fn()} />);
      expect(view.toJSON()).toBeTruthy();
      view.unmount();
    }
  });
  /**
   * Nine screens of questions are worth nothing if the last button does not produce a plan.
   * This walks the whole questionnaire the way a first-time user does, answering nothing,
   * and asserts that the defaults alone are enough to finish.
   */
  test('parcurgerea celor nouă pași se termină cu un meniu', () => {
    const onPlanGenerated = jest.fn();
    render(<OnboardingWizard isDark={false} onPlanGenerated={onPlanGenerated} />);

    for (let step = 1; step < 9; step += 1) {
      fireEvent.press(screen.getByText('Continuă →'));
    }
    expect(useAppStore.getState().currentStep).toBe(9);
    fireEvent.press(screen.getByText(/Generează Meniul Săptămânal/));

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(onPlanGenerated).toHaveBeenCalledTimes(1);
  });

  test('alegerea unui magazin se reține', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    fireEvent.press(screen.getByText('Kaufland'));

    expect(useAppStore.getState().preferences.supermarketId).toBe('kaufland');
  });

  test('pe telefon nu se oferă „înapoi" la primul pas', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    expect(screen.queryByText(/Înapoi/)).toBeNull();
  });

  test('„înapoi" te duce la pasul anterior', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByText('Continuă →'));
    fireEvent.press(screen.getByText('Continuă →'));

    fireEvent.press(screen.getByLabelText('Înapoi la pasul anterior'));

    expect(useAppStore.getState().currentStep).toBe(2);
  });
});

/**
 * On a wide screen the header becomes a row of step nodes that double as navigation. Letting
 * someone jump to step 8 from step 1 would skip the answers the later steps are priced
 * against, so a step never visited has to be inert.
 */
describe('OnboardingWizard pe ecran lat', () => {
  beforeEach(() => {
    reset();
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 1440, height: 900, scale: 2, fontScale: 1,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test('nu poți sări la un pas pe care nu l-ai vizitat încă', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    fireEvent.press(screen.getByText('Aparate'));

    expect(useAppStore.getState().currentStep).toBe(1);
  });

  test('te poți întoarce la un pas prin care ai trecut', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByText('Continuă →'));
    fireEvent.press(screen.getByText('Continuă →'));

    fireEvent.press(screen.getByText('Magazin'));

    expect(useAppStore.getState().currentStep).toBe(1);
  });
});

/**
 * The last step sells things the planner does not cook: snacks, soft drinks and, behind a
 * gate, alcohol. The gate is the part worth testing — an 18+ section that renders before
 * anyone asks for it is a store rejection, not a styling detail.
 */
describe('OnboardingWizard, pasul de ronțăieli', () => {
  beforeEach(() => {
    reset();
    useAppStore.getState().goToStep(9);
  });

  test('alegerea unui snac se reține', () => {
    const snack = getRetailProductsByCategory('snack_sweet')[0];
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    fireEvent.press(screen.getByText(snack.name));

    expect(useAppStore.getState().preferences.selectedSnackIds).toContain(snack.id);
  });

  test('alegerea unei băuturi se reține', () => {
    const drink = getRetailProductsByCategory('drink_soft')[0];
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    fireEvent.press(screen.getByText(drink.name));

    expect(useAppStore.getState().preferences.selectedDrinkIds).toContain(drink.id);
  });

  test('băuturile alcoolice sunt ascunse până le ceri explicit', () => {
    const beer = getRetailProductsByCategory('drink_alcoholic')[0];
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.queryByText(beer.name)).toBeNull();

    fireEvent.press(screen.getByText(/Activează secțiunea de băuturi alcoolice/));

    expect(useAppStore.getState().preferences.includeAlcohol).toBe(true);
    expect(screen.getByText(beer.name)).toBeTruthy();
  });

  test('închiderea secțiunii ascunde din nou sticlele', () => {
    const beer = getRetailProductsByCategory('drink_alcoholic')[0];
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByText(/Activează secțiunea de băuturi alcoolice/));

    fireEvent.press(screen.getByText(/Activează secțiunea de băuturi alcoolice/));

    expect(useAppStore.getState().preferences.includeAlcohol).toBe(false);
    expect(screen.queryByText(beer.name)).toBeNull();
  });
});
