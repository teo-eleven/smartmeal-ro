import { act, renderHook } from '@testing-library/react-native';
import { useRecipeDetail } from '../useRecipeDetail';
import { useAppStore } from '../../../store/useAppStore';
import { useHealthSafetyStore } from '../../../store/healthSafetyStore';
import { RECIPES } from '../../../data/recipes';
import { HealthGoalTag } from '../../../types';

const GOALS: HealthGoalTag[] = ['heart_healthy', 'diabetic_friendly', 'high_fiber'];

const setAnswer = (answer: 'yes' | 'no' | null) =>
  useHealthSafetyStore.setState({ answer, isLoaded: true });

const mountDetail = () =>
  renderHook(() => useRecipeDetail({ recipe: RECIPES[0], initialServings: 2, visible: true }));

beforeEach(() => {
  setAnswer('no');
  useAppStore.setState((s) => ({
    currentPlan: null,
    preferences: { ...s.preferences, healthGoalTags: GOALS },
  }));
});

describe('useRecipeDetail suggestion follows the safety answer (A.7f-2)', () => {
  test('recomputes the suggestion when the answer changes while the detail is open', () => {
    const { result } = mountDetail();
    const suggestedWhileNo = result.current.suggestedReplacement?.id;

    act(() => setAnswer('yes'));

    expect(result.current.suggestedReplacement?.id).not.toBe(suggestedWhileNo);

    act(() => setAnswer('no'));

    expect(result.current.suggestedReplacement?.id).toBe(suggestedWhileNo);
  });
});
