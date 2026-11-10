/** @jsxImportSource @octane-xplat/jsx/dom */
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { View } from './View.web.tsrx'
import { Pressable } from '../actions/Pressable.web.tsrx'
import type { PanNotification, PanSample } from '../../gestures/types'

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    cleanup()
  }

  document.body.replaceChildren()
})

function fixture(handler: (event: PanNotification) => void) {
  const mount = document.createElement('div')

  document.body.append(mount)

  const root = createRoot(mount),
    pressed = vi.fn()

  const render = (onPan = handler) =>
    act(() =>
      root.render(
        <View onPan={onPan} ref={() => {}}>
          <Pressable onPress={pressed}>Action</Pressable>
        </View>,
      ),
    )

  render()

  const host = mount.firstElementChild as HTMLElement,
    button = host.firstElementChild as HTMLElement

  for (const node of [host, button]) {
    Object.defineProperties(node, {
      offsetWidth: { value: 300, configurable: true },
      offsetHeight: { value: 200, configurable: true },
    })

    node.getBoundingClientRect = () => ({
      x: 20,
      y: 30,
      left: 20,
      top: 30,
      width: 300,
      height: 200,
      right: 320,
      bottom: 230,
      toJSON() {},
    })
  }

  let held: number | null = null,
    time = 0

  host.setPointerCapture = vi.fn((id) => {
    held = id
  })

  host.releasePointerCapture = vi.fn(() => {
    held = null
  })

  host.hasPointerCapture = (id) => held === id

  const pointer = (type: string, x: number, y = 35, target: EventTarget = button, id = 1) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: x,
      clientY: y,
    })

    Object.defineProperties(event, {
      pointerId: { value: id },
      pointerType: { value: 'mouse' },
      timeStamp: { value: (time += 20) },
    })

    act(() => target.dispatchEvent(event))
  }

  const dispose = () => act(() => root.unmount())

  cleanups.push(dispose)
  return { host, button, pressed, render, pointer, dispose }
}

it('claims after intent and reports separate local positions, translation and stable semantic targets', () => {
  const events: PanNotification[] = [],
    f = fixture((event) => {
      events.push(event)
    })

  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 32)
  expect(events).toEqual([])
  f.pointer('pointermove', 37)
  expect(events.map((event) => event.phase)).toEqual(['start', 'update'])

  const first = events[0]

  if (first.phase === 'finish') {
    throw new Error('Expected start')
  }

  expect(first.sample.translation.x).toBe(12)
  expect(first.sample.startPosition.local).toEqual({ x: 5, y: 5 })
  expect(first.sample.position.local).toEqual({ x: 17, y: 5 })
  expect(first.sample.target).not.toBe(first.sample.currentTarget)
  f.pointer('pointerup', 37)

  const end = events.at(-1)

  expect(end?.phase).toBe('finish')
  if (end?.phase === 'finish') {
    expect(end.terminal.outcome).toBe('ended')
    expect(end.terminal.sample.pointerCount).toBe(0)
  }
})

it('keeps a contact and capture through callback and callback-ref replacement', () => {
  const first: PanNotification[] = [],
    next: PanNotification[] = []

  const f = fixture((event) => {
    first.push(event)
  })

  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 40)

  const start = first[0]

  if (start.phase === 'finish') {
    throw new Error('Expected start')
  }

  f.render((event) => {
    next.push(event)
  })

  f.pointer('pointermove', 50)
  f.pointer('pointerup', 50)
  expect(first.filter((event) => event.phase === 'finish')).toHaveLength(0)
  expect(f.host.setPointerCapture).toHaveBeenCalledTimes(1)
  expect(next.at(-1)?.phase).toBe('finish')

  const event = next[0]

  if (event.phase !== 'finish') {
    expect(event.sample.session.id).toBe(start.sample.session.id)
  }
})

it('cancels capture loss with the last coordinates and cannot restart before all contacts lift', () => {
  const events: PanNotification[] = [],
    f = fixture((event) => {
      events.push(event)
    })

  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 45)
  f.pointer('lostpointercapture', 0, 0, f.host)

  const finish = events.at(-1)

  if (finish?.phase !== 'finish') {
    throw new Error('Expected terminal')
  }

  expect(finish.terminal.outcome).toBe('cancelled')
  if (finish.terminal.outcome === 'cancelled') {
    expect(finish.terminal.reason).toBe('capture-lost')
  }

  expect(finish.terminal.sample.position.window).toEqual({ x: 45, y: 35 })
  f.pointer('pointermove', 100)
  f.pointer('pointerup', 100)
  expect(events.filter((event) => event.phase === 'finish')).toHaveLength(1)
  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 45)
  expect(events.filter((event) => event.phase === 'start')).toHaveLength(2)
})

it('keeps keyboard and virtual activation eligible after a claimed drag while rejecting its pointer click', () => {
  const f = fixture(() => {})

  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 45)
  f.pointer('pointerup', 45)
  act(() =>
    f.button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })),
  )

  expect(f.pressed).not.toHaveBeenCalled()
  act(() => f.button.click())
  expect(f.pressed).toHaveBeenCalledTimes(1)
  expect(f.pressed.mock.calls[0][0].pointer).toBeNull()
  f.pointer('pointerdown', 25)
  f.pointer('pointerup', 25)
  act(() => f.button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })))
  expect(f.pressed).toHaveBeenCalledTimes(2)
})

it('finalizes an active attachment exactly once on unmount', () => {
  const terminals: PanSample[] = []
  const f = fixture((event) => {
    if (event.phase === 'finish') {
      terminals.push(event.terminal.sample)
    }
  })

  f.pointer('pointerdown', 25)
  f.pointer('pointermove', 45)
  f.dispose()
  f.pointer('pointerup', 45, 35, document)
  expect(terminals).toHaveLength(1)
  expect(f.host.releasePointerCapture).toHaveBeenCalledTimes(1)
})
