import { getErrorMessage } from '@/lib/validation';

/** The same shape as a platform alert button, so call sites keep their exact behavior. */
export type AskButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => unknown;
};

export type AskRequest = { id: number; title: string; message?: string; buttons: AskButton[] };
export type ToastTone = 'success' | 'error' | 'info';
export type Toast = { id: number; tone: ToastTone; title: string; message?: string };

type State = { ask: AskRequest | null; toast: Toast | null };

/** Long enough for the sheet to leave, so pickers and the camera can open over the app. */
const DISMISS_MS = 280;

let state: State = { ask: null, toast: null };
let nextId = 1;
const waiting: AskRequest[] = [];
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeFeedback(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getFeedback = () => state;

/**
 * Ask the user to choose: the app's replacement for a platform alert with buttons.
 * Like an alert, a button's `onPress` runs after the sheet has closed.
 */
export function ask(title: string, message: string | undefined, buttons: AskButton[]) {
  const request = { id: nextId++, title, message, buttons };
  if (state.ask) waiting.push(request);
  else set({ ask: request });
}

/** Close sheet `id`; a dismissal counts as the cancel button, as on an alert. */
export function settleAsk(id: number, button?: AskButton) {
  if (state.ask?.id !== id) return;
  const chosen = button ?? state.ask.buttons.find((b) => b.style === 'cancel');
  set({ ask: waiting.shift() ?? null });
  if (!chosen?.onPress) return;
  const run = chosen.onPress;
  setTimeout(() => {
    Promise.resolve()
      .then(run)
      .catch((e) => notify.error('Something went wrong', getErrorMessage(e)));
  }, DISMISS_MS);
}

function show(tone: ToastTone, title: string, message?: string) {
  set({ toast: { id: nextId++, tone, title, message } });
}

/** A short message that doesn't need an answer. */
export const notify = {
  success: (title: string, message?: string) => show('success', title, message),
  error: (title: string, message?: string) => show('error', title, message),
  info: (title: string, message?: string) => show('info', title, message),
};

export function dismissToast(id: number) {
  if (state.toast?.id === id) set({ toast: null });
}
