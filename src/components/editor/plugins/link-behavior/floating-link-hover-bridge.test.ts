import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHoverBridge } from "./floating-link-hover-bridge";

/**
 * Manual clock: records scheduled timers so tests fire them explicitly.
 * Deterministic replacement for the real window timers.
 */
const makeClock = () => {
  const pending = new Map<number, () => void>();
  let nextId = 1;
  return {
    cancel: (id: number) => {
      pending.delete(id);
    },
    count: () => pending.size,
    /** Fire every pending timer (grace periods all expire). */
    fireAll: () => {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) {
        callback();
      }
    },
    schedule: (callback: () => void) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, callback);
      return id;
    },
  };
};

const makeHarness = () => {
  const clock = makeClock();
  const dismissals: number[] = [];
  const bridge = createHoverBridge({
    cancel: clock.cancel,
    graceMs: 120,
    onGraceExpired: () => {
      dismissals.push(dismissals.length);
    },
    schedule: clock.schedule,
  });
  return { bridge, clock, dismissals };
};

describe("createHoverBridge", () => {
  test("grace expiring over plain content dismisses once", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    strictEqual(clock.count(), 1);
    clock.fireAll();

    deepStrictEqual(dismissals, [0]);
  });

  test("re-arming over plain content keeps a single timer", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    bridge.onPlainContent();
    bridge.onPlainContent();
    strictEqual(clock.count(), 1);
    clock.fireAll();

    deepStrictEqual(dismissals, [0]);
  });

  test("entering a link cancels the pending grace dismissal", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    bridge.onLink();
    strictEqual(clock.count(), 0);
    clock.fireAll();

    deepStrictEqual(dismissals, []);
  });

  test("entering a chip surface cancels the pending grace dismissal", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    bridge.onSurface();
    clock.fireAll();

    deepStrictEqual(dismissals, []);
  });

  test("a fired grace arms again for the next leave", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    clock.fireAll();
    deepStrictEqual(dismissals, [0]);

    bridge.onPlainContent();
    strictEqual(clock.count(), 1);
    clock.fireAll();
    deepStrictEqual(dismissals, [0, 1]);
  });

  test("link re-entry after a fired grace still keeps the chip alive", () => {
    // Regression: the pointer leaves a link, the grace is armed, the pointer
    // re-enters a link within the grace window and rests there. The fired
    // grace must not kill the chip — and no second timer may linger.
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onLink();
    bridge.onPlainContent();
    bridge.onLink();
    clock.fireAll();

    deepStrictEqual(dismissals, []);
    strictEqual(clock.count(), 0);
  });

  test("dispose cancels the pending grace without firing", () => {
    const { bridge, clock, dismissals } = makeHarness();

    bridge.onPlainContent();
    bridge.dispose();
    clock.fireAll();

    deepStrictEqual(dismissals, []);
  });
});
