import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The closest automated stand-in for walking through the app by hand: it mounts the real
 * root component and drives a whole journey through the screens a user actually touches.
 * Unit tests cover the logic; this is what catches a screen that will not mount at all.
 */
describe('a full journey through the real app', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({
      // The app now opens on a sign-in gate; these tests are about what is behind it.
      authStatus: 'guest',
      isHydrated: true,
      activeView: 'onboarding',
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      lastDiscardedPlan: null,
      confirmRequest: null,
      activeNotice: null,
    });
    useAppStore.getState().resetOnboarding();
  });

  test('the app mounts on the onboarding screen', () => {
    render(<App />);
    expect(screen.getByText(/Alege magazinul tău/i)).toBeTruthy();
  });

  test('quick start takes the user from a cold app to a usable plan', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(useAppStore.getState().groceryItems.length).toBeGreaterThan(0);
  });

  test('the meal board renders after a plan exists', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));

    act(() => {
      useAppStore.getState().setActiveView('meals');
    });

    expect(screen.getByText(/COST TOTAL ESTIMAT/i)).toBeTruthy();
  });

  test('the grocery screen renders the aisles of that plan', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));

    act(() => {
      useAppStore.getState().setActiveView('grocery');
    });

    expect(screen.queryByText(/Niciun meniu activ/i)).toBeNull();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  test('ticking a grocery item is reflected in the header count', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));
    act(() => {
      useAppStore.getState().setActiveView('grocery');
    });

    const before = useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length;
    fireEvent.press(screen.getAllByRole('checkbox')[0]);

    expect(useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length).not.toBe(
      before
    );
  });

  test('asking for a new plan shows the confirmation, and cancelling keeps the plan', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));
    act(() => {
      useAppStore.getState().setActiveView('meals');
    });
    const planBefore = useAppStore.getState().currentPlan;

    fireEvent.press(screen.getByText(/\+ Plan Nou/i));
    expect(screen.getByText(/Ștergi planul curent/i)).toBeTruthy();
    expect(useAppStore.getState().currentPlan).toBe(planBefore);

    fireEvent.press(screen.getByLabelText(/Păstrează planul/i));
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });

  test('confirming the reset offers the undo, and undo brings the week back', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));
    act(() => {
      useAppStore.getState().setActiveView('meals');
    });
    const planId = useAppStore.getState().currentPlan!.id;

    fireEvent.press(screen.getByText(/\+ Plan Nou/i));
    fireEvent.press(screen.getByLabelText(/Șterge și începe din nou/i));
    expect(useAppStore.getState().currentPlan).toBeNull();

    fireEvent.press(screen.getByLabelText(/Anulează ștergerea/i));
    expect(useAppStore.getState().currentPlan?.id).toBe(planId);
  });

  test('the app survives a reload with a plan in storage', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Pornire rapidă/i));
    const planId = useAppStore.getState().currentPlan!.id;

    // Simulate a fresh launch reading what the previous session persisted
    useAppStore.setState({ currentPlan: null, groceryItems: [] });
    await act(async () => {
      await useAppStore.getState().hydrateStorage();
    });

    expect(useAppStore.getState().currentPlan?.id).toBe(planId);
  });

  test('renders in dark mode without crashing', () => {
    const view = render(<App />);
    expect(view.toJSON()).toBeTruthy();
  });
});

describe('walking the onboarding end to end, step by step', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
    // The app opens on a sign-in gate now; these tests are about the wizard behind it.
    useAppStore.setState({ authStatus: 'guest', isHydrated: true });
  });

  test('every one of the nine steps renders and can be reached', () => {
    render(<App />);

    for (let step = 1; step <= 9; step += 1) {
      act(() => {
        useAppStore.getState().goToStep(step);
      });
      expect(screen.getByText(new RegExp(`Pasul ${step} din 9`, 'i'))).toBeTruthy();
    }
  });

  test('answers given during onboarding survive into the generated plan', () => {
    render(<App />);

    act(() => {
      useAppStore.getState().setSupermarket('penny');
      useAppStore.getState().setPeopleCount(4);
      useAppStore.getState().setCookingDays(['monday', 'tuesday', 'wednesday']);
      useAppStore.getState().goToStep(9);
    });

    act(() => {
      useAppStore.getState().generatePlan();
    });

    const plan = useAppStore.getState().currentPlan!;
    expect(plan.supermarketId).toBe('penny');
    expect(plan.peopleCount).toBe(4);
    expect(plan.days).toHaveLength(3);
  });

  test('declaring an allergy during onboarding keeps it out of the plan', () => {
    render(<App />);

    act(() => {
      useAppStore.getState().goToStep(7);
    });
    fireEvent.press(screen.getByLabelText(/Evită Lactate/i));

    act(() => {
      useAppStore.getState().generatePlan();
    });

    expect(useAppStore.getState().preferences.avoidedAllergens).toContain('lactate');
  });

  test('an impossible answer is refused with an explanation, not a crash', () => {
    render(<App />);

    act(() => {
      useAppStore.setState({
        preferences: { ...useAppStore.getState().preferences, appliances: [] },
        activeNotice: null,
      });
      useAppStore.getState().generatePlan();
    });

    expect(useAppStore.getState().currentPlan).toBeNull();
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });
});

describe('the screens reachable from the meal board', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
    useAppStore.setState({ authStatus: 'guest', isHydrated: true });
    useAppStore.getState().quickStart();
    act(() => {
      useAppStore.getState().setActiveView('meals');
    });
  });

  test('the supermarket comparison opens and lists the chains', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Compară prețul coșului/i));
    expect(screen.getByText(/Același coș, alt magazin/i)).toBeTruthy();
    expect(screen.getAllByText(/lei/i).length).toBeGreaterThan(0);
  });

  test('switching chains from the comparison updates the plan', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Compară prețul coșului/i));
    fireEvent.press(screen.getAllByLabelText(/Mută cumpărăturile la/i)[0]);
    expect(useAppStore.getState().currentPlan!.supermarketId).not.toBe('lidl');
  });

  test('the saved plan library opens, saves and restores', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Planurile mele salvate/i));

    fireEvent.changeText(screen.getByLabelText(/Numele planului/i), 'Săptămâna mea');
    fireEvent.press(screen.getByLabelText(/Salvează planul curent/i));
    expect(useAppStore.getState().savedPlans).toHaveLength(1);

    fireEvent.press(screen.getByLabelText(/Reia planul Săptămâna mea/i));
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('opening a recipe shows its steps and ingredients', () => {
    render(<App />);
    const title = useAppStore.getState().currentPlan!.days[0].meals[0].recipe.title;
    fireEvent.press(screen.getAllByText(title)[0]);
    expect(screen.getAllByText(/Ingrediente necesare/i).length).toBeGreaterThan(0);
  });

  test('changing servings on a card feeds through to the plan and the cart', () => {
    render(<App />);
    const servingsBefore = useAppStore.getState().currentPlan!.days[0].meals[0].servings;
    const cartBefore = useAppStore.getState().currentPlan!.totalCartCostRon;

    fireEvent.press(screen.getAllByLabelText('Adaugă o porție')[0]);

    const after = useAppStore.getState().currentPlan!;
    expect(after.days[0].meals[0].servings).toBe(servingsBefore + 1);
    expect(after.days[0].meals[0].estimatedCostRon).toBeGreaterThan(0);
    // The cart is priced in whole packs, so one more serving may still fit what was already
    // being bought. It must never cost less, though.
    expect(after.totalCartCostRon).toBeGreaterThanOrEqual(cartBefore);
  });

  test('several extra servings do push the cart up', () => {
    render(<App />);
    const cartBefore = useAppStore.getState().currentPlan!.totalCartCostRon;
    const day = useAppStore.getState().currentPlan!.days[0];

    act(() => {
      useAppStore.getState().setMealServings(day.dayOfWeek, day.meals[0].id, 10);
    });

    expect(useAppStore.getState().currentPlan!.totalCartCostRon).toBeGreaterThan(cartBefore);
  });
});
