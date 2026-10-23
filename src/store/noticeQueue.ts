import { StoreApi } from 'zustand';

/** The shape the queue needs from the store; the full SystemNotice lives in useAppStore. */
export interface QueuedNotice {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface NoticeState {
  activeNotice: QueuedNotice | null;
  noticeQueue: QueuedNotice[];
}

/** Enough to never lose a safety warning, few enough that a loop cannot flood the screen. */
const MAX_QUEUED_NOTICES = 5;

/**
 * Same title and message. Not the id: ids are Date.now() strings, so two different notices
 * raised in the same millisecond share one.
 */
const isSameNotice = (a: QueuedNotice, b: QueuedNotice) =>
  a === b || (a.title === b.title && a.message === b.message);

/**
 * A state change with any new notice routed through the queue: the notice on screen stays
 * until it is dismissed, and the new one waits its turn. There was a single slot, so a later
 * message silently replaced an earlier one, safety warnings from launch included.
 */
export function routeNotice<S extends NoticeState>(state: S, patch: Partial<S>): Partial<S> {
  if (!('activeNotice' in patch)) return patch;
  const incoming = patch.activeNotice;
  const showing = state.activeNotice;
  if (!incoming || !showing || isSameNotice(incoming, showing)) return patch;

  const alreadyQueued = state.noticeQueue.some((queued) => isSameNotice(queued, incoming));
  const noticeQueue = alreadyQueued
    ? state.noticeQueue
    : [...state.noticeQueue, incoming].slice(-MAX_QUEUED_NOTICES);
  return { ...patch, activeNotice: showing, noticeQueue };
}

/** Wraps a zustand `set` so every notice an action raises goes through the queue. */
export function withNoticeQueue<S extends NoticeState>(
  set: StoreApi<S>['setState'],
  get: () => S
): StoreApi<S>['setState'] {
  return ((partial: S | Partial<S> | ((state: S) => S | Partial<S>), replace?: boolean) => {
    const resolved = typeof partial === 'function' ? partial(get()) : partial;
    const routed = routeNotice(get(), resolved as Partial<S>);
    (set as (p: Partial<S>, r?: boolean) => void)(routed, replace);
  }) as StoreApi<S>['setState'];
}

/** The next queued notice, shown once the current one is dismissed. */
export function nextNotice<S extends NoticeState>(state: S): Partial<S> {
  const [next, ...rest] = state.noticeQueue;
  return { activeNotice: next ?? null, noticeQueue: rest } as Partial<S>;
}
