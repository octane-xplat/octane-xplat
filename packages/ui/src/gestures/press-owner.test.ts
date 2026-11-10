import { expect, it } from 'vitest'
import { createGestureOwner, type GestureSpace, type InputFrame } from './owner'
import { createPanController } from './controller'
import type { ActivationEvent, GestureSession, PanSample } from './types'

function fixture() {
  const panel = {},
    button = {},
    calls: string[] = [],
    events: ActivationEvent[] = [],
    errors: unknown[] = []

  const owner = createGestureOwner({
    frame: () => () => {},
    error: (error) => {
      errors.push(error)
    },
  })

  const space = (id: string): GestureSpace => ({
    target: { id },
    local: (point) => point,
    freeze: () => (point) => point,
  })

  const press = owner.registerPress(
    button,
    {
      slop: 100,
      onPress: (event) => {
        calls.push('press')
        events.push(event)
      },
      onPressIn: () => calls.push('in'),
      onPressOut: () => calls.push('out'),
    },
    space('button'),
    () => true,
  )

  const panSamples: PanSample[] = []
  const pan = createPanController({
    axis: 'x',
    onStart: (sample) => {
      calls.push('pan')
      panSamples.push(sample)
    },
  })

  const detach = owner.register(panel, pan.handle, space('panel'))
  let time = 0
  const send = (type: InputFrame['type'], x: number) => {
    const contact = { id: '1', kind: 'touch' as const, window: { x, y: 10 }, screen: null }

    return owner.dispatch({
      type,
      time: (time += 20),
      contacts: type === 'up' || type === 'cancel' ? [] : [contact],
      changed: contact,
      hitPath: [button, panel],
    })
  }

  return {
    owner,
    panel,
    button,
    press,
    pan,
    calls,
    events,
    panSamples,
    errors,
    send,
    space,
    dispose() {
      press.dispose()
      detach()
      pan.dispose()
      owner.dispose()
    },
  }
}

it('lets a nested button activate before claim and cancels its pointer eligibility before the parent pan callback', () => {
  const f = fixture()

  try {
    f.send('down', 20)
    f.send('up', 20)
    expect(f.press.activate('pointer')).toBe(true)
    expect(f.events[0].target.id).toBe('button')
    f.calls.length = 0
    f.send('down', 20)
    f.send('move', 40)
    // The movement is inside press slop: ownership, rather than a duplicate slop rule, cancels it.
    expect(f.calls).toEqual(['in', 'out', 'pan'])
    expect(f.panSamples[0].target.id).toBe('button')
    expect(f.panSamples[0].currentTarget.id).toBe('panel')
    f.send('up', 40)
    expect(f.press.activate('pointer')).toBe(false)
    expect(f.press.activate('keyboard')).toBe(true)
    expect(f.events.at(-1)?.pointer).toBeNull()
    f.send('down', 20)
    f.send('up', 20)
    expect(f.press.activate('pointer')).toBe(true)
    expect(f.errors).toEqual([])
  } finally {
    f.dispose()
  }
})

it('cancels pending semantic activation through scoped ownership without cancelling an outside pan', () => {
  const f = fixture()

  try {
    f.send('down', 20)
    f.send('move', 40)
    f.owner.cancelWhere((host) => host === f.button, 'scope-suspended')
    expect(f.pan.handle.active$.get()).toBe(true)
    f.send('up', 40)
    expect(f.press.activate('pointer')).toBe(false)
    f.send('down', 20)
    f.send('up', 20)
    f.owner.cancelWhere((host) => host === f.button, 'scope-suspended')
    expect(f.press.activate('pointer')).toBe(false)
  } finally {
    f.dispose()
  }
})

it('keeps a single target identity when gesture and press bindings share a host', () => {
  const f = fixture(),
    ownPan = createPanController({ axis: 'y' })

  const off = f.owner.register(f.button, ownPan.handle, f.space('second-attachment-target'))

  try {
    f.send('down', 20)
    f.send('up', 20)
    f.press.activate('pointer')
    expect(f.events[0].currentTarget.id).toBe('button')
    expect(f.events[0].target).toBe(f.events[0].currentTarget)
  } finally {
    off()
    ownPan.dispose()
    f.dispose()
  }
})

it('makes retained sessions and registrations inert after owner disposal, including callback failures', () => {
  const session: { current: GestureSession | null } = { current: null }
  const errors: unknown[] = []
  const owner = createGestureOwner({
    frame: () => () => {},
    error(error) {
      errors.push(error)
    },
  })

  const host = {},
    pan = createPanController({
      axis: 'x',
      onStart(sample) {
        session.current = sample.session
      },
      onCancel() {
        throw new Error('cancel failure')
      },
    })

  const detach = owner.register(host, pan.handle, {
    target: { id: 'host' },
    local: (point) => point,
    freeze: () => (point) => point,
  })

  const contact = (x: number) => ({
    id: '1',
    kind: 'touch' as const,
    window: { x, y: 0 },
    screen: null,
  })

  owner.dispatch({
    type: 'down',
    time: 0,
    contacts: [contact(0)],
    changed: contact(0),
    hitPath: [host],
  })

  owner.dispatch({
    type: 'move',
    time: 20,
    contacts: [contact(20)],
    changed: contact(20),
    hitPath: [host],
  })

  owner.dispose()
  expect(errors).toHaveLength(1)
  expect(pan.handle.pointerCount$.get()).toBe(0)

  expect(() => session.current?.cancel()).not.toThrow()
  expect(() => detach()).not.toThrow()
  pan.dispose()
})

it('keeps suspended hosts ineligible for later pointer and semantic activation until the last owner releases', () => {
  const f = fixture()
  const offA = f.owner.suspendWhere((host) => host === f.button)
  const offB = f.owner.suspendWhere((host) => host === f.button)

  try {
    f.send('down', 20)
    f.send('up', 20)
    expect(f.press.activate('keyboard')).toBe(false)
    expect(f.press.activate('pointer')).toBe(false)
    offA()
    expect(f.press.activate('virtual')).toBe(false)
    offB()
    // Releasing a scope cannot resurrect a rejected pointer sequence.
    expect(f.press.activate('pointer')).toBe(false)
    expect(f.press.activate('accessibility')).toBe(true)
    f.send('down', 20)
    f.send('up', 20)
    expect(f.press.activate('pointer')).toBe(true)
  } finally {
    offA()
    offB()
    f.dispose()
  }
})

it('cancels visual press observers with the semantic press before a pan starts', () => {
  const f = fixture()
  const observer = f.owner.registerPress(
    f.panel,
    {
      observeOnly: true,
      slop: 100,
      onPressIn: () => f.calls.push('visual-in'),
      onPressOut: () => f.calls.push('visual-out'),
    },
    f.space('panel'),
    () => true,
  )

  try {
    f.send('down', 20)
    expect(f.calls).toEqual(['in', 'visual-in'])
    f.send('move', 40)
    expect(f.calls).toEqual(['in', 'visual-in', 'out', 'visual-out', 'pan'])
    f.send('up', 40)
    expect(f.press.activate('pointer')).toBe(false)
    f.send('down', 20)
    f.send('up', 20)
    expect(f.press.activate('pointer')).toBe(true)
    expect(f.events).toHaveLength(1)
  } finally {
    observer.dispose()
    f.dispose()
  }
})

it('gives a nested manipulation control admission priority over a faster ancestor pan', () => {
  const f = fixture()
  const starts: string[] = []

  f.pan.commit({ axis: 'x', activation: { distance: 1 }, onStart: () => starts.push('panel') })

  const control = createPanController(
    { axis: 'x', activation: { distance: 12 }, onStart: () => starts.push('control') },
    undefined,
    true,
  )

  const release = f.owner.register(f.button, control.handle, f.space('control'))

  try {
    f.send('down', 20)
    f.send('move', 25)
    expect(starts).toEqual([])
    f.send('move', 40)
    expect(starts).toEqual(['control'])
  } finally {
    release()
    control.dispose()
    f.dispose()
  }
})

it('keeps physical input on an editable native control away from ancestor presses', () => {
  const f = fixture()
  const contact = { id: '1', kind: 'touch' as const, window: { x: 20, y: 10 }, screen: null }

  try {
    f.owner.dispatch({
      type: 'down',
      time: 10,
      contacts: [contact],
      changed: contact,
      hitPath: [f.button, f.panel],
      nativeOwned: true,
    })

    f.owner.dispatch({
      type: 'up',
      time: 20,
      contacts: [],
      changed: contact,
      hitPath: [f.button, f.panel],
      nativeOwned: true,
    })

    expect(f.press.activate('pointer')).toBe(false)
    expect(f.calls).toEqual([])
    expect(f.press.activate('keyboard')).toBe(true)
  } finally {
    f.dispose()
  }
})

it('lets a managed control own its adjustable descendant without admitting an ancestor pan', () => {
  const f = fixture(),
    thumb = {},
    starts: string[] = []

  f.pan.commit({ axis: 'x', activation: { distance: 1 }, onStart: () => starts.push('panel') })

  const control = createPanController(
    { axis: 'x', onStart: () => starts.push('control') },
    undefined,
    true,
  )

  const release = f.owner.register(f.button, control.handle, f.space('control'))

  try {
    const send = (type: InputFrame['type'], x: number) => {
      const contact = { id: '1', kind: 'mouse' as const, window: { x, y: 10 }, screen: null }

      f.owner.dispatch({
        type,
        time: x,
        changed: contact,
        contacts: [contact],
        hitPath: [thumb, f.button, f.panel],
        nativeBoundary: thumb,
      })
    }

    send('down', 0)
    send('move', 4)
    expect(starts).toEqual([])
    send('move', 20)
    expect(starts).toEqual(['control'])
  } finally {
    release()
    control.dispose()
    f.dispose()
  }
})
