import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Registers a Modal while it is on screen. iOS presents one Modal at a time, so the notice
 * and the Face ID question wait until no registered window is open instead of being dropped.
 */
export function useBlockingWindow(visible: boolean): void {
  useEffect(() => {
    if (!visible) return undefined;
    const { windowOpened, windowClosed } = useAppStore.getState();
    windowOpened();
    return windowClosed;
  }, [visible]);
}
