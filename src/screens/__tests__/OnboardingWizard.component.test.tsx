import React from 'react';
import { Dimensions } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { useAppStore } from '../../store/useAppStore';
import { getRetailProductsByCategory } from '../../data/retailProducts';
import { HEALTH_DISCLAIMER_SHORT_RO } from '../../data/healthDisclaimer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_SAFETY_BLOCKED_RO, HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';

function reset() {
  useAppStore.getState().resetOnboarding();
  useAppStore.getState().dismissUndo();
}

describe('OnboardingWizard', () => {
  beforeEach(reset);

  test('a health goal shows the condition it suits as information, with the doctor caveat', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    expect(screen.getByText('Atent la zaharuri')).toBeTruthy();
    expect(
      screen.getByText(/Relevant dacă ai diabet sau prediabet\. Nu înlocuiește medicul\.$/)
    ).toBeTruthy();
    expect(screen.queryByText(/medicale/)).toBeNull();
  });

  test('the health goals carry the short "not medical advice" disclaimer (A.5)', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    expect(screen.getByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
  });

  test('opens on the diet step', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ai preferințe dietetice\?/i)).toBeTruthy();
  });

  test('offers a quick start that skips the questionnaire', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Sari peste întrebări/ })).toBeTruthy();
  });

  test('quick start produces a plan without answering anything', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: /Sari peste întrebări/ }));
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('shows progress through the eight steps', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Pasul 1 din 8/i)).toBeTruthy();
  });

  test('advancing reaches the cravings step', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByText(/Continuă|Următorul|Mai departe/i));
    expect(useAppStore.getState().currentStep).toBe(2);
  });

  test('the diet step offers the allergen selector', () => {
    useAppStore.getState().goToStep(1);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ai alergii alimentare/i)).toBeTruthy();
  });

  test('the diet step reports how many recipes remain', () => {
    useAppStore.getState().goToStep(1);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('choosing an allergy narrows the catalog', () => {
    useAppStore.getState().goToStep(1);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    fireEvent.press(screen.getByLabelText(/Evită Lactate/i));
    expect(useAppStore.getState().preferences.avoidedAllergens).toContain('lactate');
  });

  test('the appliance step also reports availability', () => {
    useAppStore.getState().goToStep(5);
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ce aparate ai în bucătărie/i)).toBeTruthy();
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('renders each step without crashing', () => {
    for (let step = 1; step <= 8; step += 1) {
      useAppStore.getState().goToStep(step);
      const view = render(<OnboardingWizard isDark={step % 2 === 0} onPlanGenerated={jest.fn()} />);
      expect(view.toJSON()).toBeTruthy();
      view.unmount();
    }
  });

  /**
   * Eight screens of questions finish with plan generation.
   */
  test('parcurgerea celor opt pași se termină cu un meniu', () => {
    const onPlanGenerated = jest.fn();
    render(<OnboardingWizard isDark={false} onPlanGenerated={onPlanGenerated} />);

    for (let step = 1; step < 8; step += 1) {
      fireEvent.press(screen.getByText('Continuă →'));
    }
    expect(useAppStore.getState().currentStep).toBe(8);
    fireEvent.press(screen.getByText(/Generează Meniul Săptămânal/));

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(onPlanGenerated).toHaveBeenCalledTimes(1);
  });

  test('alegerea unui magazin se reține', () => {
    useAppStore.getState().goToStep(6);
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
 * On a wide screen the header becomes a row of step nodes that double as navigation.
 */
describe('OnboardingWizard pe ecran lat', () => {
  beforeEach(() => {
    reset();
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 1440,
      height: 900,
      scale: 2,
      fontScale: 1,
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

    fireEvent.press(screen.getByText('Dietă'));

    expect(useAppStore.getState().currentStep).toBe(1);
  });
});

/**
 * Step 7 sells snacks, soft drinks and, behind a gate, alcohol.
 */
describe('OnboardingWizard, pasul de ronțăieli', () => {
  beforeEach(() => {
    reset();
    useAppStore.getState().goToStep(7);
  });

  test('alegerea unui snac se reține', () => {
    const snack = getRetailProductsByCategory('snack_savory')[0];
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

describe('OnboardingWizard, pasul de buget (pasul 8)', () => {
  beforeEach(() => {
    reset();
    useAppStore.getState().goToStep(8);
  });

  test('afișează sliderul de buget și permite setarea bugetului', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Care este bugetul tău/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Buget sugerat:/ })).toBeTruthy();
  });
});

describe('OnboardingWizard, pasul de pofte (pasul 2 cu FoodMoodSwiper)', () => {
  beforeEach(() => {
    reset();
    useAppStore.getState().goToStep(2);
  });

  test('afișează swiperul interactiv de pofte și permite like/selectare', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);
    expect(screen.getByText(/Ce pofte ai săptămâna asta\?/i)).toBeTruthy();
    expect(screen.getByText('🃏 Swipe Carduri')).toBeTruthy();
    expect(screen.getByText('📱 Grilă Clasică')).toBeTruthy();

    // Like first card (speedy)
    fireEvent.press(screen.getByText('Îmi place'));
    expect(useAppStore.getState().preferences.moodTags).toContain('speedy');
  });
});

describe('OnboardingWizard, pasul de dietă (pasul 1)', () => {
  beforeEach(() => {
    reset();
    useAppStore.getState().goToStep(1);
  });

  test('afișează stilurile alimentare principale și permite selectarea Vegetarian fără blocaj', () => {
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    expect(screen.getByText('Stilul alimentar principal (alege una):')).toBeTruthy();
    expect(screen.getByText('Vegetarian')).toBeTruthy();
    expect(screen.getByText('Vegan / De post')).toBeTruthy();
    expect(screen.getByText('Pescatarian')).toBeTruthy();

    // Tap on Vegetarian directly
    fireEvent.press(screen.getByText('Vegetarian'));

    expect(useAppStore.getState().preferences.dietType).toBe('vegetarian');
    expect(useAppStore.getState().preferences.dietTypes).toContain('vegetarian');
  });
});

describe('ultimul pas, când generarea se strică', () => {
  beforeEach(reset);

  test('mesajul e pe înțeles, nu textul tehnic al erorii', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const realGenerate = useAppStore.getState().generatePlan;
    useAppStore.setState((state) => ({
      currentStep: state.totalSteps,
      maxVisitedStep: state.totalSteps,
      activeNotice: null,
      generatePlan: () => {
        throw new TypeError("Cannot read properties of undefined (reading 'days')");
      },
    }));
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('Generează Meniul Săptămânal'));

    const notice = useAppStore.getState().activeNotice;
    expect(notice?.type).toBe('error');
    expect(notice?.message).not.toMatch(/Cannot read|undefined/);
    useAppStore.setState({ generatePlan: realGenerate });
  });
});

describe('OnboardingWizard, întrebarea de siguranță (A.7b)', () => {
  const YES = 'Da, mi se aplică';
  const NO = 'Nu, niciuna';
  const goals = () => useAppStore.getState().preferences.healthGoalTags ?? [];

  beforeEach(async () => {
    reset();
    await AsyncStorage.clear();
    useHealthSafetyStore.setState({ answer: null, isLoaded: true });
  });

  const renderWizard = () =>
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

  test('the first health goal asks the question before anything is ticked', () => {
    renderWizard();

    fireEvent.press(screen.getByText('Atent la zaharuri'));

    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
    expect(goals()).toEqual([]);
  });

  test('"Nu" ticks the goal, and the next goal does not ask again', () => {
    renderWizard();

    fireEvent.press(screen.getByText('Atent la zaharuri'));
    fireEvent.press(screen.getByRole('button', { name: NO }));
    fireEvent.press(screen.getByText('Bogat în fibre'));

    expect(goals()).toEqual(['diabetic_friendly', 'high_fiber']);
    expect(useHealthSafetyStore.getState().answer).toBe('no');
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('"Da" ticks nothing, removes goals already chosen, keeps pork-free, shows the doctor message', () => {
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);
    renderWizard();

    fireEvent.press(screen.getByText('Atent la zaharuri'));
    fireEvent.press(screen.getByRole('button', { name: YES }));

    expect(goals()).toEqual(['pork_free']);
    expect(screen.getByText(HEALTH_SAFETY_BLOCKED_RO)).toBeTruthy();
  });

  test('after "Da" the health goals cannot be ticked; pork-free still can', () => {
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    renderWizard();

    fireEvent.press(screen.getByText('Bogat în fibre'));
    fireEvent.press(screen.getByText('Fără carne de porc (Halal)'));

    expect(goals()).toEqual(['pork_free']);
    expect(screen.getByRole('checkbox', { name: /Bogat în fibre/, disabled: true })).toBeTruthy();
  });

  test('closing the question without answering ticks nothing and saves nothing', () => {
    renderWizard();

    fireEvent.press(screen.getByText('Atent la zaharuri'));
    fireEvent.press(screen.getByLabelText('Închide întrebarea', { includeHiddenElements: true }));

    expect(goals()).toEqual([]);
    expect(useHealthSafetyStore.getState().answer).toBeNull();
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('"Am răspuns greșit" forgets the answer, so the goals open again', () => {
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    renderWizard();

    fireEvent.press(screen.getByRole('button', { name: 'Am răspuns greșit' }));

    expect(useHealthSafetyStore.getState().answer).toBeNull();
    expect(screen.queryByText(HEALTH_SAFETY_BLOCKED_RO)).toBeNull();
  });

  test('pork-free never asks; unticking a goal chosen earlier never asks', () => {
    useAppStore.getState().setHealthGoalTags(['high_fiber']);
    renderWizard();

    fireEvent.press(screen.getByText('Fără carne de porc (Halal)'));
    fireEvent.press(screen.getByText('Bogat în fibre'));

    expect(goals()).toEqual(['pork_free']);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });
});
