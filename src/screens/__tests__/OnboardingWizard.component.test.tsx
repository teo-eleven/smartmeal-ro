import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { useAppStore } from '../../store/useAppStore';

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
});
