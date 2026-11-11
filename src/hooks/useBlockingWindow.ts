import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Registers a Modal while it is on screen. iOS presents one Modal at a time, so the notice
 * and the Face ID question wait until no registered window is open instead of being dropped.
 *
 * A window may pass an id: the registry then knows which open windows are its own, which lets
 * it ask about "windows other than mine" without depending on effect order.
 */
export function useBlockingWindow(visible: boolean, id?: string): void {
  useEffect(() => {
    if (!visible) return undefined;
    const { windowOpened, windowClosed } = useAppStore.getState();
    windowOpened(id);
    return () => windowClosed(id);
  }, [visible, id]);
}
