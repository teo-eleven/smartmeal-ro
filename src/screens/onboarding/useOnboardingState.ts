import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { RETAIL_PRODUCTS_MAP } from '../../data/retailProducts';
import { useAppStore } from '../../store/useAppStore';

/**
 * The onboarding wizard's state: what the store holds for it, the price of the chosen
 * extras, and finishing the last step. Kept apart from the screens so each step can be a
 * small component of its own.
 */
export function useOnboardingState(onPlanGenerated?: () => void) {
  const {
    currentStep,
    maxVisitedStep,
    totalSteps,
    preferences,
    setSupermarket,
    setPeopleCount,
    toggleCookingDay,
    setCookingDays,
    setMealSlots,
    setFoodTier,
    setBudget,
    toggleMoodTag,
    setMoodTags,
    toggleDietType,
    toggleAvoidedAllergen,
    toggleHealthGoalTag,
    setSnackTastePreference,
    toggleAppliance,
    toggleSnackProduct,
    toggleDrinkProduct,
    setIncludeAlcohol,
    nextStep,
    prevStep,
    goToStep,
    generatePlan,
    quickStart,
    setActiveView,
    showNotice,
  } = useAppStore(
    useShallow((state) => ({
      currentStep: state.currentStep,
      maxVisitedStep: state.maxVisitedStep,
      totalSteps: state.totalSteps,
      preferences: state.preferences,
      setSupermarket: state.setSupermarket,
      setPeopleCount: state.setPeopleCount,
      toggleCookingDay: state.toggleCookingDay,
      setCookingDays: state.setCookingDays,
      setMealSlots: state.setMealSlots,
      setFoodTier: state.setFoodTier,
      setBudget: state.setBudget,
      toggleMoodTag: state.toggleMoodTag,
      setMoodTags: state.setMoodTags,
      toggleDietType: state.toggleDietType,
      toggleAvoidedAllergen: state.toggleAvoidedAllergen,
      toggleHealthGoalTag: state.toggleHealthGoalTag,
      setSnackTastePreference: state.setSnackTastePreference,
      toggleAppliance: state.toggleAppliance,
      toggleSnackProduct: state.toggleSnackProduct,
      toggleDrinkProduct: state.toggleDrinkProduct,
      setIncludeAlcohol: state.setIncludeAlcohol,
      nextStep: state.nextStep,
      prevStep: state.prevStep,
      goToStep: state.goToStep,
      generatePlan: state.generatePlan,
      quickStart: state.quickStart,
      setActiveView: state.setActiveView,
      showNotice: state.showNotice,
    }))
  );

  const extrasCost = useMemo(() => {
    const snackIds = preferences.selectedSnackIds || [];
    const drinkIds = preferences.selectedDrinkIds || [];
    return [...snackIds, ...drinkIds].reduce((sum, id) => {
      const prod = RETAIL_PRODUCTS_MAP[id];
      return sum + (prod?.typicalPriceRon[preferences.supermarketId] ?? 0);
    }, 0);
  }, [preferences.selectedSnackIds, preferences.selectedDrinkIds, preferences.supermarketId]);

  const handleNextOrFinish = () => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      try {
        // An impossible combination stays on this step, where the notice explains it and the
        // user can change it. It used to navigate on and leave an empty board spinning.
        if (!generatePlan()) return;
        onPlanGenerated?.();
        setActiveView('generating');
      } catch (err) {
        // The detail goes to the log; the person gets a sentence they can act on. The raw
        // message ("Cannot read properties of undefined") used to be shown as is.
        console.error('[OnboardingWizard] generatePlan error:', err);
        showNotice(
          'Meniul nu a putut fi generat',
          'A apărut o eroare neașteptată. Încearcă din nou sau schimbă una dintre alegeri.',
          'error'
        );
      }
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return {
    currentStep,
    maxVisitedStep,
    totalSteps,
    preferences,
    setSupermarket,
    setPeopleCount,
    toggleCookingDay,
    setCookingDays,
    setMealSlots,
    setFoodTier,
    setBudget,
    toggleMoodTag,
    setMoodTags,
    toggleDietType,
    toggleAvoidedAllergen,
    toggleHealthGoalTag,
    setSnackTastePreference,
    toggleAppliance,
    toggleSnackProduct,
    toggleDrinkProduct,
    setIncludeAlcohol,
    nextStep,
    prevStep,
    goToStep,
    generatePlan,
    quickStart,
    setActiveView,
    showNotice,
    extrasCost,
    handleNextOrFinish,
    progressPercent,
  };
}

export type OnboardingState = ReturnType<typeof useOnboardingState>;
