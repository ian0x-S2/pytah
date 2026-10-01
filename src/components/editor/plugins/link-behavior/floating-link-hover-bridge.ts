/**
 * The hover chip's dismissal bridge. The pointer can travel from link text
 * into the chip (or back into a link), so leaving a link must not dismiss
 * the chip outright — a grace-period timer gives the pointer that window.
 *
 * The bridge owns three pointer facts and one timer:
 * - over a link → the bridge succeeded, any pending dismissal is cancelled
 * - over a chip/card surface → those surfaces own their own dismissal, any
 *   pending dismissal is cancelled
 * - over plain (non-link) content → arm the grace-period dismissal
 *
 * The timer is armed at most once and only ever fires while the pointer is
 * over plain content — re-entering a link or a surface always cancels it.
 * (Bug fixed here: the timer used to survive link re-entry and kill a freshly
 * opened chip mid-hover, which made the first mouse pass unreliable.)
 */
export interface HoverBridgeDeps {
  /** Dispatched when the grace period expires over plain content. */
  onGraceExpired: () => void;
  /** Grace period in ms the pointer has to reach a link or the chip. */
  graceMs: number;
  /** Injectable scheduler (defaults to window timers); lets tests advance time. */
  schedule?: (callback: () => void, ms: number) => number;
  cancel?: (timerId: number) => void;
}

export interface HoverBridge {
  /** Pointer is over a link: cancel any pending grace dismissal. */
  onLink: () => void;
  /** Pointer is over a chip/card surface: cancel any pending grace dismissal. */
  onSurface: () => void;
  /** Pointer is over plain content: arm the grace-period dismissal. */
  onPlainContent: () => void;
  /** Cancel the timer without firing; used on unmount. */
  dispose: () => void;
}

const defaultSchedule =
  typeof window === "undefined"
    ? undefined
    : (callback: () => void, ms: number) => window.setTimeout(callback, ms);
const defaultCancel =
  typeof window === "undefined"
    ? undefined
    : (timerId: number) => window.clearTimeout(timerId);

export const createHoverBridge = ({
  onGraceExpired,
  graceMs,
  schedule = defaultSchedule,
  cancel = defaultCancel,
}: HoverBridgeDeps): HoverBridge => {
  let timerId: number | null = null;

  const cancelPending = () => {
    if (timerId !== null && cancel) {
      cancel(timerId);
    }
    timerId = null;
  };

  const arm = () => {
    if (timerId !== null || !schedule) {
      return;
    }

    timerId = schedule(() => {
      timerId = null;
      onGraceExpired();
    }, graceMs);
  };

  return {
    dispose: cancelPending,
    onLink: cancelPending,
    onPlainContent: arm,
    onSurface: cancelPending,
  };
};
