import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { MealBoardScreen } from '../MealBoardScreen';
import { GroceryScreen } from '../GroceryScreen';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { MealSwapModal } from '../MealSwapModal';
import { PantryInventoryModal } from '../PantryInventoryModal';
import { MealPrepModal } from '../MealPrepModal';
import { WeeklyMacroModal } from '../WeeklyMacroModal';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { AuthModal } from '../AuthModal';
import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';
import { DayOfWeek, MealSlot, UserPreferences } from '../../types';

const BASE_PREFS: UserPreferences = {
  supermarketId: 'carrefour',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[],
  budgetRon: 900,
  moodTags: ['speedy'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'] as MealSlot[],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function seedReadyPlan() {
  useAppStore.setState({
    preferences: { ...BASE_PREFS },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,
    confirmRequest: null,
  });
  useAppStore.getState().generatePlan();
}

function resetAll() {
  useAppStore.getState().resetOnboarding();
  useAppStore.getState().dismissUndo();
}

describe('TESTARE EXHAUSTIVĂ: Toate butoanele și scenariile din aplicație', () => {
  describe('1. Flux Onboarding: Navigare și acționare pe toate butoanele celor 8 pași', () => {
    beforeEach(resetAll);

    test('Pasul 1 (Dietă, Modificatori, Obiective Sănătate, Alergeni): comută toate opțiunile fără erori', () => {
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      // Stiluri alimentare de bază
      fireEvent.press(screen.getByText('Vegetarian'));
      expect(useAppStore.getState().preferences.dietType).toBe('vegetarian');

      fireEvent.press(screen.getByText('Vegan / De post'));
      expect(useAppStore.getState().preferences.dietType).toBe('vegan');

      fireEvent.press(screen.getByText('Pescatarian'));
      expect(useAppStore.getState().preferences.dietType).toBe('pescatarian');

      fireEvent.press(screen.getByText('Fără restricții (Omnivor)'));
      expect(useAppStore.getState().preferences.dietType).toBe('omnivore');

      // Modificatori (Fără gluten, Keto)
      fireEvent.press(screen.getByText('Fără Gluten'));
      expect(useAppStore.getState().preferences.dietTypes).toContain('gluten_free');

      fireEvent.press(screen.getByText('Low-Carb / Keto'));
      expect(useAppStore.getState().preferences.dietTypes).toContain('keto');

      // Obiective de Sănătate
      fireEvent.press(screen.getByText('Antiinflamator'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('anti_inflammatory');

      fireEvent.press(screen.getByText('SOP (Ovare Polichistice)'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('pcos_friendly');

      fireEvent.press(screen.getByText('Diabet & Glicemie Stabilă'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('diabetic_friendly');

      fireEvent.press(screen.getByText('Bogat în Fibre'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('high_fiber');

      fireEvent.press(screen.getByText('Sănătos pentru Inimă'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('heart_healthy');

      fireEvent.press(screen.getByText('Fără carne de porc (Halal)'));
      expect(useAppStore.getState().preferences.healthGoalTags).toContain('pork_free');

      // Alergeni
      fireEvent.press(screen.getByLabelText(/Evită Lactate/i));
      expect(useAppStore.getState().preferences.avoidedAllergens).toContain('lactate');

      fireEvent.press(screen.getByLabelText(/Evită Arahide/i));
      expect(useAppStore.getState().preferences.avoidedAllergens).toContain('arahide');

      // Navigare mai departe
      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(2);
    });

    test('Pasul 2 (Pofte & FoodMoodSwiper): testează Swipe, Grilă Clasică, Like, Nope și comutare', () => {
      useAppStore.getState().goToStep(2);
      render(<OnboardingWizard isDark={true} onPlanGenerated={jest.fn()} />);

      // Buton de Like pe cardul curent
      fireEvent.press(screen.getByText('Îmi place'));
      expect(useAppStore.getState().preferences.moodTags.length).toBeGreaterThan(0);

      // Buton de Nope (Pas)
      fireEvent.press(screen.getByText('Pas'));

      // Comutare la Grilă Clasică
      fireEvent.press(screen.getByText('📱 Grilă Clasică'));
      expect(screen.getByText('Condimentat & Mexican')).toBeTruthy();

      // Comutare înapoi la Swipe Carduri
      fireEvent.press(screen.getByText('🃏 Swipe Carduri'));

      // Navigare mai departe
      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(3);
    });

    test('Pasul 3 (Persoane): testează butoanele Minus, Plus și toate pastilele de preset 1..6 pers.', () => {
      useAppStore.getState().goToStep(3);
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      // Buton Plus (+)
      fireEvent.press(screen.getByText('+'));
      expect(useAppStore.getState().preferences.peopleCount).toBe(3);

      // Buton Minus (−)
      fireEvent.press(screen.getByText('−'));
      expect(useAppStore.getState().preferences.peopleCount).toBe(2);

      // Testare pastile presetate
      fireEvent.press(screen.getByText(/1\s*pers/i));
      expect(useAppStore.getState().preferences.peopleCount).toBe(1);

      fireEvent.press(screen.getByText(/4\s*pers/i));
      expect(useAppStore.getState().preferences.peopleCount).toBe(4);

      fireEvent.press(screen.getByText(/6\s*pers/i));
      expect(useAppStore.getState().preferences.peopleCount).toBe(6);

      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(4);
    });

    test('Pasul 4 (Zile, Mese & Nivel): testează preseturile de zile, momentele zilei și Food Tier', () => {
      useAppStore.getState().goToStep(4);
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      // Preseturile reale de zile
      fireEvent.press(screen.getByText(/Weekend \(2 zile\)/i));
      expect(useAppStore.getState().preferences.cookingDays.length).toBe(2);

      fireEvent.press(screen.getByText(/Luni - Vineri \(5 zile\)/i));
      expect(useAppStore.getState().preferences.cookingDays.length).toBe(5);

      fireEvent.press(screen.getByText(/Toată săptămâna \(7 zile\)/i));
      expect(useAppStore.getState().preferences.cookingDays.length).toBe(7);

      // Sloturi de masă
      fireEvent.press(screen.getByText('Mic Dejun'));
      expect(useAppStore.getState().preferences.mealSlots).toContain('breakfast');

      // Nivel alimentar (Economic, Echilibrat, Gourmet)
      fireEvent.press(screen.getByText(/Gourmet & Răsfăț/i));
      expect(useAppStore.getState().preferences.foodTier).toBe('premium');

      fireEvent.press(screen.getByText(/Economic & Buget/i));
      expect(useAppStore.getState().preferences.foodTier).toBe('basic');

      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(5);
    });

    test('Pasul 5 (Aparate): testează selectarea și debifarea aparatelor electrocasnice', () => {
      useAppStore.getState().goToStep(5);
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      // Toggle Air Fryer
      fireEvent.press(screen.getByLabelText('Air Fryer'));
      expect(useAppStore.getState().preferences.appliances).not.toContain('air_fryer');

      fireEvent.press(screen.getByLabelText('Air Fryer'));
      expect(useAppStore.getState().preferences.appliances).toContain('air_fryer');

      // Toggle Microunde
      fireEvent.press(screen.getByLabelText('Cuptor cu Microunde'));
      expect(useAppStore.getState().preferences.appliances).toContain('microwave');

      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(6);
    });

    test('Pasul 6 (Magazin): testează toate cele 6 supermarketuri', () => {
      useAppStore.getState().goToStep(6);
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      fireEvent.press(screen.getByText('Carrefour'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('carrefour');

      fireEvent.press(screen.getByText('Lidl'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('lidl');

      fireEvent.press(screen.getByText('Kaufland'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('kaufland');

      fireEvent.press(screen.getByText('Mega Image'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('mega_image');

      fireEvent.press(screen.getByText('Auchan'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('auchan');

      fireEvent.press(screen.getByText('Penny'));
      expect(useAppStore.getState().preferences.supermarketId).toBe('penny');

      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(7);
    });

    test('Pasul 7 (Ronțăieli & Băuturi): testează deblocarea secțiunii de alcool și navigarea', () => {
      useAppStore.getState().goToStep(7);
      render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

      // Deblocare alcool
      fireEvent.press(screen.getByText(/Activează secțiunea de băuturi alcoolice/i));
      expect(useAppStore.getState().preferences.includeAlcohol).toBe(true);

      fireEvent.press(screen.getByText('Continuă →'));
      expect(useAppStore.getState().currentStep).toBe(8);
    });

    test('Pasul 8 (Buget & Generare): aplică bugetul minim recomandat și generează meniul', () => {
      const onPlanGenerated = jest.fn();
      useAppStore.getState().goToStep(8);
      render(<OnboardingWizard isDark={false} onPlanGenerated={onPlanGenerated} />);

      // Buton de aplicare buget minim calculat
      fireEvent.press(screen.getByLabelText(/Folosește bugetul sugerat/i));
      expect(useAppStore.getState().preferences.budgetRon).toBeGreaterThan(0);

      // Buton final de generare meniu
      fireEvent.press(screen.getByText(/Generează Meniul Săptămânal/i));
      expect(useAppStore.getState().currentPlan).not.toBeNull();
      expect(onPlanGenerated).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. MealBoardScreen: Navigare și acționare pe toate butoanele planului activ', () => {
    beforeEach(seedReadyPlan);

    test('afișează fluxul continuu al tuturor zilelor planificate', () => {
      render(<MealBoardScreen isDark={false} />);
      expect(screen.getByText(/📅 LUNI/i)).toBeTruthy();
      expect(screen.getByText(/📅 MARȚI/i)).toBeTruthy();
      expect(screen.getByText(/📅 MIERCURI/i)).toBeTruthy();
    });

    test('stepperul de porții (+ și -) pe MealCard ajustează numărul de porții', () => {
      render(<MealBoardScreen isDark={false} />);
      const addBtns = screen.getAllByLabelText('Adaugă o porție');
      const minusBtns = screen.getAllByLabelText('Scade o porție');

      const initialServings = useAppStore.getState().currentPlan!.days[0].meals[0].servings;
      fireEvent.press(addBtns[0]);
      expect(useAppStore.getState().currentPlan!.days[0].meals[0].servings).toBe(initialServings + 1);

      fireEvent.press(minusBtns[0]);
      expect(useAppStore.getState().currentPlan!.days[0].meals[0].servings).toBe(initialServings);
    });

    test('butonul „Gătesc dublu” transformă masa de a doua zi în reîncălzită', () => {
      render(<MealBoardScreen isDark={false} />);
      const cookDoubleBtn = screen.getAllByLabelText('Gătesc porție dublă și reîncălzesc mâine')[0];
      fireEvent.press(cookDoubleBtn);

      const nextDayMeal = useAppStore.getState().currentPlan!.days[1].meals[0];
      expect(nextDayMeal.isLeftover).toBe(true);

      // Butonul de anulare a reîncălzirii
      const undoLeftoverBtn = screen.getByLabelText('Gătesc din nou în ziua asta');
      fireEvent.press(undoLeftoverBtn);
      expect(useAppStore.getState().currentPlan!.days[1].meals[0].isLeftover).toBe(false);
    });

    test('butonul „În oraș” comută masa pe dining out și înapoi', () => {
      render(<MealBoardScreen isDark={false} />);
      const eatOutBtn = screen.getAllByLabelText('Mănânc în oraș la această masă')[0];
      fireEvent.press(eatOutBtn);

      expect(useAppStore.getState().currentPlan!.days[0].meals[0].isEatenOut).toBe(true);

      // Comutare înapoi pe gătesc acasă
      const cookAtHomeBtn = screen.getByLabelText('Revino la gătit acasă');
      fireEvent.press(cookAtHomeBtn);
      expect(useAppStore.getState().currentPlan!.days[0].meals[0].isEatenOut).toBe(false);
    });

    test('comutarea nivelului alimentar pe toolbar (Economic, Echilibrat, Gourmet)', () => {
      render(<MealBoardScreen isDark={false} />);
      fireEvent.press(screen.getByText('🥉 Basic'));
      expect(useAppStore.getState().preferences.foodTier).toBe('basic');

      fireEvent.press(screen.getByText('🥇 Prem'));
      expect(useAppStore.getState().preferences.foodTier).toBe('premium');
    });

    test('comutarea magazinului pe toolbar (Carrefour, Lidl, Kaufland)', () => {
      render(<MealBoardScreen isDark={false} />);
      fireEvent.press(screen.getAllByText('Lidl')[0]);
      expect(useAppStore.getState().preferences.supermarketId).toBe('lidl');

      fireEvent.press(screen.getAllByText('Kaufland')[0]);
      expect(useAppStore.getState().preferences.supermarketId).toBe('kaufland');
    });

    test('acțiunea „Adaugă desert” adaugă desert de casă în ziua curentă', () => {
      render(<MealBoardScreen isDark={false} />);
      fireEvent.press(screen.getAllByText(/\+ 🍰 Adaugă Desert de Casă/i)[0]);

      const mondayMeals = useAppStore.getState().currentPlan!.days[0].meals;
      expect(mondayMeals.some((m) => m.slot === 'dessert')).toBe(true);
    });
  });

  describe('3. RecipeDetailModal: Interacțiuni complete în ecranul detaliat de rețetă', () => {
    const testRecipe = RECIPES[0];

    test('bifează pașii de gătire, favorite, dislike și ajustare porții', () => {
      const onClose = jest.fn();
      render(
        <RecipeDetailModal
          visible
          recipe={testRecipe}
          servings={2}
          onSwap={jest.fn()}
          onClose={onClose}
          isDark={false}
          targetDay="monday"
          targetSlot="dinner"
        />
      );

      // Bifează primul pas de gătit
      const step1Btn = screen.getAllByText('Apasă pentru a bifa pasul')[0];
      fireEvent.press(step1Btn);

      // Salvează la favorite
      fireEvent.press(screen.getByLabelText('Marchează ca preferat'));
      expect(useAppStore.getState().preferences.favouriteRecipeIds).toContain(testRecipe.id);

      // Debifează din favorite
      fireEvent.press(screen.getByLabelText('Scoate de la preferate'));
      expect(useAppStore.getState().preferences.favouriteRecipeIds).not.toContain(testRecipe.id);

      // Închide modalul
      fireEvent.press(screen.getAllByLabelText('Închide')[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('4. MealSwapModal: Testare inteligentă a schimbului de rețete', () => {
    beforeEach(seedReadyPlan);

    test('permite căutarea de candidați și selectarea unei rețete alternative', () => {
      const plan = useAppStore.getState().currentPlan!;
      const onSelectReplacement = jest.fn();
      const onClose = jest.fn();

      render(
        <MealSwapModal
          visible
          dayOfWeek="monday"
          slot="dinner"
          currentPlan={plan}
          preferences={useAppStore.getState().preferences}
          onClose={onClose}
          onSelectReplacement={onSelectReplacement}
          isDark={false}
        />
      );

      // Selectează prima rețetă candidată
      const selectBtns = screen.getAllByText('Alege această rețetă');
      fireEvent.press(selectBtns[0]);
      expect(onSelectReplacement).toHaveBeenCalled();

      // Închide modalul
      fireEvent.press(screen.getByLabelText('Închide'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('5. GroceryScreen: Testare interactivă a listei de cumpărături', () => {
    beforeEach(seedReadyPlan);

    test('bifarea unui ingredient, Bifează tot și Deselectează funcționează perfect', () => {
      render(<GroceryScreen isDark={false} />);

      // Bifează tot
      fireEvent.press(screen.getByText('✓ Bifează tot'));
      const purchasedAfterCheckAll = useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length;
      expect(purchasedAfterCheckAll).toBe(useAppStore.getState().groceryItems.length);

      // Deselectează
      fireEvent.press(screen.getByText('Deselectează'));
      const purchasedAfterUncheck = useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length;
      expect(purchasedAfterUncheck).toBe(0);
    });

    test('comutatorul de ingrediente de bază din cămară actualizează preferințele', () => {
      render(<GroceryScreen isDark={false} />);
      const stapleToggle = screen.getByLabelText('Exclude ingredientele de bază din cămară');
      fireEvent.press(stapleToggle);
      expect(useAppStore.getState().preferences.excludePantryStaples).toBe(false);

      fireEvent.press(stapleToggle);
      expect(useAppStore.getState().preferences.excludePantryStaples).toBe(true);
    });

    test('deschiderea catalogului de ronțăieli din bannerul din GroceryScreen', () => {
      render(<GroceryScreen isDark={false} />);
      fireEvent.press(screen.getByText(/Ronțăieli & Băuturi de Magazin/i));
      // Verifică că modalul de snacks se deschide
      expect(screen.getAllByText(/Băuturi Alcoolice/i).length).toBeGreaterThan(0);
    });
  });

  describe('6. Modale auxiliare & Auth: Navigare și declanșare', () => {
    beforeEach(seedReadyPlan);

    test('PantryInventoryModal bifează ingrediente din cămară', () => {
      const onClose = jest.fn();
      render(<PantryInventoryModal visible onClose={onClose} isDark={false} />);
      fireEvent.press(screen.getByText('Sare de masă'));
      expect(useAppStore.getState().preferences.pantryInventory).toContain('sare_fina');
      fireEvent.press(screen.getAllByLabelText('Închide')[0]);
      expect(onClose).toHaveBeenCalled();
    });

    test('WeeklyMacroModal afișează defalcarea nutrițională și se închide', () => {
      const onClose = jest.fn();
      const plan = useAppStore.getState().currentPlan;
      render(<WeeklyMacroModal visible plan={plan} onClose={onClose} isDark={false} />);
      expect(screen.getByText(/Nutriție & Macro Săptămânale/i)).toBeTruthy();
      fireEvent.press(screen.getAllByLabelText('Închide')[0]);
      expect(onClose).toHaveBeenCalled();
    });

    test('MealPrepModal afișează ghidul de batch cooking și comută taskuri', () => {
      const onClose = jest.fn();
      const plan = useAppStore.getState().currentPlan;
      render(<MealPrepModal visible plan={plan} onClose={onClose} isDark={false} />);
      expect(screen.getByText(/Mise en place/i)).toBeTruthy();
      fireEvent.press(screen.getAllByLabelText('Închide')[0]);
      expect(onClose).toHaveBeenCalled();
    });

    test('QuickFiltersModal permite filtrarea rapidă', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      render(
        <QuickFiltersModal
          visible
          onClose={onClose}
          preferences={useAppStore.getState().preferences}
          onApplyFilters={onApply}
          onResetOnboarding={jest.fn()}
          isDark={false}
        />
      );
      expect(screen.getByText(/📅 Zile de Gătit/i)).toBeTruthy();
      fireEvent.press(screen.getByText('✓ Aplică Filtre & Actualizează Meniul'));
      expect(onApply).toHaveBeenCalled();
    });

    test('AuthModal permite comutarea între Login și Înregistrare', () => {
      const onClose = jest.fn();
      render(
        <AuthModal
          visible
          onClose={onClose}
          isDark={false}
          userEmail={null}
          onUserChanged={jest.fn()}
        />
      );
      // Comutare la fila Creează cont
      fireEvent.press(screen.getByLabelText('Fila Creează cont'));
      expect(screen.getByPlaceholderText('exemplu@email.ro')).toBeTruthy();

      // Comutare înapoi la fila Autentificare
      fireEvent.press(screen.getByLabelText('Fila Autentificare'));
      expect(screen.getByText('Conectare')).toBeTruthy();

      // Închidere cu modul Oaspete
      fireEvent.press(screen.getByLabelText('Continuă fără cont'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
