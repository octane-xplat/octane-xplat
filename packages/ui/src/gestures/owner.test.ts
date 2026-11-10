import { describe, expect, it } from 'vitest'
import { createScope } from 'octane/signals'
import { createPanController, createPinchController, type GestureController } from './controller'
import { compete, prioritize, simultaneous, gestureLeaves, sameGestureInput } from './composition'
import { createGestureOwner, type InputContact, type InputFrame } from './owner'
import type { GestureInput, PanSample } from './types'

function fixture(input: GestureInput, controllers: readonly GestureController[]) {
  const host = {},
    frames = new Set<() => void>(),
    errors: unknown[] = []

  let hostX = 0
  const owner = createGestureOwner({
    frame: (callback) => {
      frames.add(callback)
      return () => {
        frames.delete(callback)
      }
    },
    error: (error) => errors.push(error),
  })

  const release = owner.register(host, input, {
    target: { id: 'host' },
    local: (p) => ({ x: p.x - hostX, y: p.y }),
    freeze: () => {
      const x = hostX

      return (p) => ({ x: p.x - x, y: p.y })
    },
  })

  let time = 0
  const contact = (id: string, x: number, y = 0): InputContact => ({
    id,
    kind: 'touch',
    window: { x, y },
    screen: null,
  })

  const send = (
    type: InputFrame['type'],
    contacts: readonly InputContact[],
    changed = contacts[0] ?? contact('1', 0),
  ) => owner.dispatch({ type, contacts, changed, time: (time += 10), hitPath: [host] })

  return {
    owner,
    send,
    contact,
    errors,
    release,
    frame() {
      for (const callback of [...frames]) {
        frames.delete(callback)
        callback()
      }
    },
    moveHost(x: number) {
      hostX = x
    },
    dispose() {
      owner.dispose()
      for (const controller of controllers) {
        controller.dispose()
      }
    },
  }
}

describe('interaction owner', () => {
  it('observes without claiming, preserves full displacement, then finalizes exactly once', () => {
    const events: string[] = [],
      samples: PanSample[] = []

    const pan = createPanController({
      axis: 'x',
      onStart: (e) => {
        events.push('start')
        samples.push(e)
      },
      onUpdate: () => events.push('update'),
      onEnd: () => events.push('end'),
      onFinalize: () => events.push('finalize'),
    })

    const f = fixture(pan.handle, [pan])

    expect(f.send('down', [f.contact('1', 10)])).toBe(false)
    expect(f.send('move', [f.contact('1', 17)])).toBe(false)
    expect(events).toEqual([])
    expect(f.send('move', [f.contact('1', 25)])).toBe(true)
    expect(samples[0].translation.x).toBe(15)
    expect(samples[0].startPosition.window.x).toBe(10)
    f.send('up', [], f.contact('1', 30))
    f.send('cancel', [], f.contact('1', 30))
    expect(events).toEqual(['start', 'update', 'end', 'finalize'])
    f.dispose()
  })

  it('lets axis intent fail silently without producing a completed drag', () => {
    let started = 0
    const pan = createPanController({ axis: 'x', onStart: () => started++ })
    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    expect(f.send('move', [f.contact('1', 2, 20)])).toBe(false)
    f.send('move', [f.contact('1', 100, 20)])
    expect(started).toBe(0)
    f.dispose()
  })

  it('distinguishes competition from ordered waiting and retains accumulated movement', () => {
    for (const ordered of [false, true]) {
      const starts: string[] = []
      const horizontal = createPanController({
        axis: 'x',
        onStart: () => starts.push('horizontal'),
      })

      const fallback = createPanController({
        axis: 'both',
        onStart: (e) => starts.push(`fallback:${e.translation.y}`),
      })

      const f = fixture((ordered ? prioritize : compete)(horizontal.handle, fallback.handle), [
        horizontal,
        fallback,
      ])

      f.send('down', [f.contact('1', 0)])
      f.send('move', [f.contact('1', 7, 7)])
      expect(starts).toEqual(ordered ? [] : ['fallback:7'])
      f.send('move', [f.contact('1', 7, 20)])
      expect(starts).toEqual(ordered ? ['fallback:20'] : ['fallback:7'])
      f.dispose()
    }
  })

  it('composes independent active gestures and rejects duplicate attachment leaves', () => {
    const a = createPanController({ axis: 'x' }),
      b = createPanController({ axis: 'x' })

    const input = simultaneous(a.handle, b.handle)

    expect(sameGestureInput(input, simultaneous(a.handle, b.handle))).toBe(true)
    expect(() => compete(input, a.handle)).toThrow(/only once/)
    expect(gestureLeaves(input)).toEqual([a.handle, b.handle])

    const f = fixture(input, [a, b])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    expect(a.handle.active$.get()).toBe(true)
    expect(b.handle.active$.get()).toBe(true)
    expect(() => fixture(a.handle, [])).toThrow(/already attached/)
    f.dispose()
  })

  it('cancels one-contact pan before admitting pinch and never rearms the one-finger tail', () => {
    const events: string[] = []
    const pan = createPanController({
      axis: 'both',
      onStart: () => events.push('pan'),
      onCancel: (_, reason) => events.push(reason),
    })

    const pinch = createPinchController({ onStart: () => events.push('pinch') })
    const f = fixture(compete(pinch.handle, pan.handle), [pan, pinch])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    f.send('down', [f.contact('1', 20), f.contact('2', 40)], f.contact('2', 40))
    expect(events).toEqual(['pan', 'pointer-count'])
    f.send('move', [f.contact('1', 10), f.contact('2', 50)])
    expect(events).toEqual(['pan', 'pointer-count', 'pinch'])
    f.send('up', [f.contact('1', 10)], f.contact('2', 50))
    f.send('move', [f.contact('1', 100)])
    expect(events).toEqual(['pan', 'pointer-count', 'pinch'])
    f.send('up', [], f.contact('1', 100))
    f.send('down', [f.contact('3', 0)])
    f.send('move', [f.contact('3', 20)])
    expect(events.at(-1)).toBe('pan')
    f.dispose()
  })

  it('uses frozen movement axes when the host follows the finger', () => {
    const samples: PanSample[] = []
    const pan = createPanController({ axis: 'both', onUpdate: (e) => samples.push(e) })
    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 10)])
    f.send('move', [f.contact('1', 30)])
    f.moveHost(20)
    f.send('move', [f.contact('1', 30)])
    expect(samples.at(-1)?.translation.x).toBe(20)
    expect(samples.at(-1)?.position.local?.x).toBe(10)
    expect(samples[0].target).toBe(samples.at(-1)?.target)
    f.dispose()
  })

  it('cancels synchronously from live enablement and retains exclusion after re-enabling', () => {
    const scope = createScope({ scopeKey: 'test:enabled' }),
      enabled$ = scope.signal$('enabled', true)

    const events: string[] = []
    const pan = createPanController({
      axis: 'x',
      enabled$,
      onCancel: (_, reason) => events.push(reason),
    })

    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    enabled$.set(false)
    expect(events).toEqual(['disabled'])
    expect(pan.handle.active$.get()).toBe(false)
    enabled$.set(true)
    f.send('move', [f.contact('1', 30)])
    expect(pan.handle.active$.get()).toBe(false)
    f.dispose()
    scope.dispose()
  })

  it('delivers latest committed callbacks without replacing the active session', () => {
    const calls: string[] = [],
      sessions: string[] = []

    const pan = createPanController({
      axis: 'x',
      onUpdate: (e) => {
        calls.push('old')
        sessions.push(e.session.id)
      },
    })

    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    pan.commit({
      axis: 'x',
      onUpdate: (e) => {
        calls.push('new')
        sessions.push(e.session.id)
      },
    })

    f.send('move', [f.contact('1', 30)])
    expect(calls).toEqual(['old', 'new'])
    expect(sessions[0]).toBe(sessions[1])
    f.dispose()
  })

  it('cancels from onStart without a trailing update or successful end', () => {
    const events: string[] = []
    const pan = createPanController({
      axis: 'x',
      onStart: (e) => {
        events.push('start')
        e.session.cancel()
      },
      onUpdate: () => events.push('update'),
      onCancel: () => events.push('cancel'),
      onEnd: () => events.push('end'),
      onFinalize: () => events.push('finalize'),
    })

    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    f.send('up', [], f.contact('1', 30))
    expect(events).toEqual(['start', 'cancel', 'finalize'])
    f.dispose()
  })

  it('flushes terminal samples before callbacks and never publishes stale frame work', () => {
    const seen: number[] = []
    const pan = createPanController({
      axis: 'x',
      samples: 'frame',
      onEnd: () => seen.push(pan.handle.sample$?.get()?.translation.x ?? -1),
    })

    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    expect(pan.handle.sample$?.get()?.translation.x).toBe(20)
    f.send('move', [f.contact('1', 30)])
    expect(pan.handle.sample$?.get()?.translation.x).toBe(20)
    f.send('up', [], f.contact('1', 40))
    f.frame()
    expect(seen).toEqual([40])
    expect(pan.handle.sample$?.get()?.translation.x).toBe(40)
    f.dispose()
    expect(() => pan.handle.active$.get()).toThrow()
  })

  it('finalizes and releases ownership even when a terminal callback throws', () => {
    let finalized = 0
    const pan = createPanController({
      axis: 'x',
      onEnd: () => {
        throw new Error('consumer')
      },
      onFinalize: () => finalized++,
    })

    const f = fixture(pan.handle, [pan])

    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    f.send('up', [], f.contact('1', 30))
    expect(finalized).toBe(1)
    expect(f.errors).toHaveLength(1)
    expect(pan.handle.active$.get()).toBe(false)
    f.dispose()
  })
})

it('keeps cancellation samples current and preserves a specific host cancellation reason', () => {
  const samples: PanSample[] = [],
    reasons: string[] = []

  const pan = createPanController({
    axis: 'x',
    onCancel(sample, reason) {
      samples.push(sample)
      reasons.push(reason)
    },
  })

  const f = fixture(pan.handle, [pan])

  try {
    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    f.owner.dispatch({
      type: 'cancel',
      time: 100,
      contacts: [],
      changed: f.contact('1', 25),
      hitPath: [],
      cancelReason: 'capture-lost',
    })

    expect(reasons).toEqual(['capture-lost'])
    expect(samples[0].pointerCount).toBe(0)
    expect(samples[0].translation.x).toBe(25)
    expect(samples[0].time).toBe(100)
  } finally {
    f.dispose()
  }
})

it('does not recognize over native manipulation and cancels only hosts contained by a scope', () => {
  const pan = createPanController({ axis: 'x' })
  const f = fixture(pan.handle, [pan])

  try {
    const contact = f.contact('1', 0)

    f.owner.dispatch({
      type: 'down',
      time: 0,
      contacts: [contact],
      changed: contact,
      hitPath: [pan.owner!],
      nativeOwned: true,
    })

    f.send('move', [f.contact('1', 20)])
    expect(pan.handle.active$.get()).toBe(false)
    f.send('up', [], f.contact('1', 20))
    f.send('down', [contact])
    f.send('move', [f.contact('1', 20)])
    expect(pan.handle.active$.get()).toBe(true)
    f.owner.cancelWhere(() => false, 'scope-suspended')
    expect(pan.handle.active$.get()).toBe(true)
    f.owner.cancelWhere(() => true, 'scope-suspended')
    expect(pan.handle.phase$.get()).toBe('cancelled')
  } finally {
    f.dispose()
  }
})

it('freezes multi-contact axes at first admission while taking its centroid baseline when the second contact arrives', () => {
  let scale = 1
  const samples: PanSample[] = []
  const pan = createPanController({
    axis: 'x',
    pointers: { min: 2, max: 2 },
    onStart: (sample) => {
      samples.push(sample)
    },
  })

  const host = {},
    owner = createGestureOwner({
      frame: () => () => {},
      error: (error) => {
        throw error
      },
    })

  owner.register(host, pan.handle, {
    target: { id: 'scaled' },
    local: (point) => ({ x: point.x / scale, y: point.y }),
    freeze() {
      const basis = scale

      return (point) => ({ x: point.x / basis, y: point.y })
    },
  })

  let time = 0
  const contact = (id: string, x: number): InputContact => ({
    id,
    kind: 'touch',
    window: { x, y: 0 },
    screen: null,
  })

  const send = (type: InputFrame['type'], contacts: readonly InputContact[]) =>
    owner.dispatch({ type, time: (time += 20), contacts, changed: contacts[0], hitPath: [host] })

  try {
    send('down', [contact('1', 0)])
    scale = 2
    send('down', [contact('1', 0), contact('2', 20)])
    send('move', [contact('1', 10), contact('2', 30)])
    expect(samples[0].translation.x).toBe(10)
    expect(samples[0].startPosition.local?.x).toBe(5)
    expect(samples[0].position.local?.x).toBe(10)
  } finally {
    owner.dispose()
    pan.dispose()
  }
})

it('continues publishing cohort pointer counts after an exact-one pan is cancelled', () => {
  const pan = createPanController({ axis: 'x' }),
    f = fixture(pan.handle, [pan])

  try {
    f.send('down', [f.contact('1', 0)])
    f.send('move', [f.contact('1', 20)])
    f.send('down', [f.contact('1', 20), f.contact('2', 30)], f.contact('2', 30))
    expect(pan.handle.phase$.get()).toBe('cancelled')
    expect(pan.handle.pointerCount$.get()).toBe(2)
    f.send('up', [f.contact('1', 20)], f.contact('2', 30))
    expect(pan.handle.pointerCount$.get()).toBe(1)
    expect(pan.handle.active$.get()).toBe(false)
  } finally {
    f.dispose()
  }
})

it('does not admit a new contact after system cancellation while an old contact remains down', () => {
  let starts = 0,
    cancels = 0

  const pan = createPanController({ axis: 'x', onStart: () => starts++, onCancel: () => cancels++ })
  const pinch = createPinchController({ onStart: () => starts++ })
  const f = fixture(compete(pinch.handle, pan.handle), [pan, pinch])

  try {
    const one = f.contact('1', 0),
      moved = f.contact('1', 20)

    f.send('down', [one])
    f.send('move', [moved])
    f.send('cancel', [moved])
    expect(cancels).toBe(1)

    const two = f.contact('2', 60)

    f.send('down', [moved, two], two)
    f.send('move', [moved, f.contact('2', 120)])
    expect(starts).toBe(1)
    f.send('up', [moved], two)
    f.send('up', [], moved)
    expect(pan.handle.pointerCount$.get()).toBe(0)
    f.send('down', [one])
    f.send('move', [moved])
    expect(starts).toBe(2)
  } finally {
    f.dispose()
  }
})

it('applies leaf edge admission and signed intent before claim, preserving the cohort after cancellation', () => {
  const events: string[] = []
  const pan = createPanController({
    axis: 'x',
    onStart: () => events.push('start'),
    onCancel: () => events.push('cancel'),
    onFinalize: () => events.push('finalize'),
  })

  pan.admission = { admit: (p) => (p.local?.x ?? 100) <= 40, intent: (s) => s.translation.x > 0 }

  const f = fixture(pan.handle, [pan])

  f.send('down', [f.contact('1', 80)])
  f.send('move', [f.contact('1', 180)])
  expect(events).toEqual([])
  f.send('up', [])
  f.send('down', [f.contact('1', 10)])
  f.send('move', [f.contact('1', -10)])
  expect(events).toEqual([])
  f.send('up', [])
  f.send('down', [f.contact('1', 10)])
  f.send('move', [f.contact('1', 30)])
  expect(events).toEqual(['start'])
  f.send('down', [f.contact('1', 30), f.contact('2', 40)])
  f.send('up', [f.contact('1', 30)], f.contact('2', 40))
  f.send('move', [f.contact('1', 90)])
  expect(events).toEqual(['start', 'cancel', 'finalize'])
  f.send('up', [])
  f.dispose()
})
