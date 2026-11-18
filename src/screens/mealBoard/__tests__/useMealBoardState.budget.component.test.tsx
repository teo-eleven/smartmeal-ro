import { act, renderHook } from '@testing-library/react-native';
import { useMealBoardState } from '../useMealBoardState';
import { useAppStore } from '../../../store/useAppStore';
import { MealPlan } from '../../../types';

const planCosting = (totalCartCostRon: number, totalBudgetRon = 100) =>
  ({ totalCartCostRon, totalBudgetRon, peopleCount: 2, days: [] }) as unknown as MealPlan;

const setPlan = (plan: MealPlan) => useAppStore.setState({ currentPlan: plan });

beforeEach(() => {
  useAppStore.setState({ currentPlan: null, budgetOverrunPromptedCost: null });
});

/** Over budget: the board asks once per cart total, and the store remembers across tabs. */
describe('întrebarea despre depășirea bugetului', () => {
  test('apare o dată pentru un total, nu și la reafișare sau la altă schimbare din magazin', () => {
    setPlan(planCosting(150));
    const { result, rerender } = renderHook(() => useMealBoardState());
    expect(result.current.budgetOverrunModalVisible).toBe(true);

    act(() => result.current.setBudgetOverrunModalVisible(false));
    rerender({});
    act(() => useAppStore.setState({ isReloading: true }));
    act(() => useAppStore.setState({ isReloading: false }));

    expect(result.current.budgetOverrunModalVisible).toBe(false);
    expect(useAppStore.getState().budgetOverrunPromptedCost).toBe(150);
  });

  test('nu apare când planul încape în buget', () => {
    setPlan(planCosting(80));

    const { result } = renderHook(() => useMealBoardState());

    expect(result.current.budgetOverrunModalVisible).toBe(false);
  });

  test('apare din nou pentru un total nou, mai mare', () => {
    setPlan(planCosting(150));
    const { result } = renderHook(() => useMealBoardState());
    act(() => result.current.setBudgetOverrunModalVisible(false));
    expect(result.current.budgetOverrunModalVisible).toBe(false);

    act(() => setPlan(planCosting(180)));

    expect(result.current.budgetOverrunModalVisible).toBe(true);
    expect(useAppStore.getState().budgetOverrunPromptedCost).toBe(180);
  });

  test('nu apare la reîntoarcerea pe tab dacă totalul a fost deja întrebat', () => {
    setPlan(planCosting(150));
    useAppStore.setState({ budgetOverrunPromptedCost: 150 });

    const { result } = renderHook(() => useMealBoardState());

    expect(result.current.budgetOverrunModalVisible).toBe(false);
  });
});
