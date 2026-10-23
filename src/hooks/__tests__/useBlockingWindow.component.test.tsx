import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useBlockingWindow } from '../useBlockingWindow';
import { useAppStore } from '../../store/useAppStore';
import { InformativeNoticeModal } from '../../components/InformativeNoticeModal';

/**
 * The 2026-10-21 audit: iOS presents one Modal at a time, so a notice raised while the
 * account window or a recipe was open was dropped. Open windows register here, and the
 * notice waits in the queue until the screen is clear.
 */

function Window({ visible }: { visible: boolean }) {
  useBlockingWindow(visible);
  return <Text>fereastră</Text>;
}

const NOTICE = { id: '1', title: 'Plan gata', message: 'Totul e pregătit.', type: 'info' as const };

beforeEach(() => useAppStore.setState({ openWindowCount: 0 }));

describe('ferestrele deschise', () => {
  test('o fereastră vizibilă se numără, iar la închidere nu mai contează', () => {
    const { rerender } = render(<Window visible />);
    expect(useAppStore.getState().openWindowCount).toBe(1);

    rerender(<Window visible={false} />);

    expect(useAppStore.getState().openWindowCount).toBe(0);
  });

  test('o fereastră demontată în timp ce era deschisă nu rămâne numărată', () => {
    const { unmount } = render(<Window visible />);

    unmount();

    expect(useAppStore.getState().openWindowCount).toBe(0);
  });

  test('o fereastră ascunsă nu se numără', () => {
    render(<Window visible={false} />);

    expect(useAppStore.getState().openWindowCount).toBe(0);
  });
});

describe('notificarea așteaptă să se închidă ferestrele', () => {
  test('nu apare peste o fereastră deschisă', () => {
    render(
      <>
        <Window visible />
        <InformativeNoticeModal notice={NOTICE} onDismiss={jest.fn()} isDark />
      </>
    );

    expect(screen.queryByText('Plan gata')).toBeNull();
  });

  test('apare imediat ce fereastra se închide', () => {
    const tree = (visible: boolean) => (
      <>
        <Window visible={visible} />
        <InformativeNoticeModal notice={NOTICE} onDismiss={jest.fn()} isDark />
      </>
    );
    const { rerender } = render(tree(true));

    rerender(tree(false));

    expect(screen.getByText('Plan gata')).toBeTruthy();
  });
});
