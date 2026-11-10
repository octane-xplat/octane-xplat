import type { PanGestureOptions, PanSample } from '@octane-xplat/ui'

/** Dispatch-only stand-in for the shared UI adapter. OS recognition lives in UI tests. */
export const attachments: { node: object | null; options: PanGestureOptions }[] = []

const presses = new WeakMap<object, { start(): void; end(): void }>()

export function attachOwnedPan(node: object, options: PanGestureOptions): () => void {
  const entry = { node: node as object | null, options }

  attachments.push(entry)
  return () => {
    entry.node = null
  }
}

export function observeOwnedPress(
  node: object,
  callbacks: { start(): void; end(): void },
): () => void {
  presses.set(node, callbacks)
  return () => {
    callbacks.end()
    presses.delete(node)
  }
}

export function dispatchOwnedPress(node: object, phase: 'down' | 'up' | 'cancel') {
  const callbacks = presses.get(node)

  if (phase === 'down') {
    callbacks?.start()
  } else {
    callbacks?.end()
  }
}

export function sample(x: number, velocity: number | null = null): PanSample {
  const position = { local: { x, y: 0 }, window: { x, y: 0 }, screen: null }

  return {
    sequenceId: 'test',
    time: 0,
    target: { id: 'host' },
    currentTarget: { id: 'host' },
    position,
    startPosition: { ...position, local: { x: 0, y: 0 }, window: { x: 0, y: 0 } },
    contacts: [],
    pointerCount: 0,
    session: { id: 'test', cancel() {} },
    translation: { x, y: 0 },
    velocity: velocity === null ? null : { x: velocity, y: 0 },
  }
}
