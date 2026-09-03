import { afterEach, describe, expect, it } from "bun:test"

import {
  MAX_BATCH_SIZE,
  PAGE_SOURCE,
} from "../src/debugger/engine/page/constants"
import { createEventQueue } from "../src/debugger/engine/page/event-queue"

// A deferred flush must survive the page it was scheduled for going away. The
// eager debugger install (upstream #95) means the console/network runtime is
// installed at init(), so a batch can be scheduled and then flushed after the
// document is torn down — a torn-down test environment, an SSR/worker context,
// or a tab unloaded before the flush timer fired. Before the guard, the flush
// dereferenced a bare `window` and threw `ReferenceError: window is not defined`
// out of an unowned timer callback, which fails an entire vitest run.
describe("event queue is safe when the page is gone", () => {
  const originalWindow = (globalThis as { window?: unknown }).window

  afterEach(() => {
    ;(globalThis as { window?: unknown }).window = originalWindow
  })

  it("drops a flush that runs without a window instead of throwing", () => {
    const posted: unknown[] = []
    ;(globalThis as { window?: unknown }).window = {
      postMessage: (message: unknown) => posted.push(message),
    }

    const { enqueueEvent, flushEventQueue } = createEventQueue()
    enqueueEvent({
      kind: "console",
      timestamp: Date.now(),
      level: "log",
      message: "before teardown",
    })

    // The environment is torn down before the deferred flush runs.
    ;(globalThis as { window?: unknown }).window = undefined

    expect(() => flushEventQueue()).not.toThrow()
    expect(posted).toHaveLength(0)
  })

  it("still posts a batch to a live window", () => {
    const posted: Array<{ source: string; events: unknown[] }> = []
    ;(globalThis as { window?: unknown }).window = {
      postMessage: (message: { source: string; events: unknown[] }) =>
        posted.push(message),
    }

    const { enqueueEvent, flushEventQueue } = createEventQueue()
    for (let i = 0; i < MAX_BATCH_SIZE; i += 1) {
      enqueueEvent({
        kind: "console",
        timestamp: Date.now(),
        level: "log",
        message: `event ${i}`,
      })
    }
    flushEventQueue()

    expect(posted).toHaveLength(1)
    expect(posted[0]?.source).toBe(PAGE_SOURCE)
    expect(posted[0]?.events).toHaveLength(MAX_BATCH_SIZE)
  })
})
