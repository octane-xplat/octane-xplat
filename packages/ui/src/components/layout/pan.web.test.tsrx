/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { View } from './View.web.tsrx'

const roots: any[] = []

function mount(onPan: (e: any) => void) {
  const el = document.createElement('div')

  document.body.append(el)

  const root = createRoot(el)

  roots.push(root)

  act(() =>
    root.render(
      <View onPan={onPan}>
        <div id="child" />
      </View>,
    ),
  )

  const host = el.firstElementChild as HTMLElement
  const child = host.firstElementChild as HTMLElement

  const pointer = (
    type: string,
    x: number,
    y: number,
    target: EventTarget = child,
    pointerId = 1,
    button = 0,
    isPrimary = true,
  ) =>
    act(() =>
      target.dispatchEvent(
        Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
          clientX: x,
          clientY: y,
          pointerId,
          button,
          isPrimary,
        }),
      ),
    )

  const click = (target: EventTarget) =>
    act(() => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))

  const render = (cb?: (e: any) => void) =>
    act(() =>
      root.render(
        <View onPan={cb}>
          <div id="child" />
        </View>,
      ),
    )

  return { root, host, child, pointer, click, render }
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  document.body.innerHTML = ''
})

it('reports began/moved/ended with cumulative deltas', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 25, 20)
  pointer('pointerup', 25, 20)

  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'ended'])
  expect(events[1]).toMatchObject({ dx: 15, dy: 10, x: 15, y: 10 })
  expect(events[2]).toMatchObject({ dx: 15, dy: 10 })
})

it('does not capture the pointer until the drag slop is crossed', () => {
  const { host, pointer } = mount(vi.fn())

  const capture = vi.fn()
  const release = vi.fn()

  Object.assign(host, {
    setPointerCapture: capture,
    hasPointerCapture: () => true,
    releasePointerCapture: release,
  })

  pointer('pointerdown', 10, 10)
  expect(capture).not.toHaveBeenCalled()

  pointer('pointermove', 15, 10)
  expect(capture).not.toHaveBeenCalled()

  pointer('pointermove', 20, 10)
  expect(capture).toHaveBeenCalledTimes(1)
  expect(capture).toHaveBeenCalledWith(1)

  pointer('pointermove', 30, 10)
  expect(capture).toHaveBeenCalledTimes(1)

  pointer('pointerup', 30, 10)
})

it('keeps tracking after the pointer leaves the element', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  // A fast drag can exit the host before the slop is crossed; the document
  // listeners still deliver the rest of the gesture.
  pointer('pointermove', 14, 10, document)
  pointer('pointermove', 30, 10, document)
  pointer('pointerup', 30, 10, document)

  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'moved', 'ended'])
})

it('ignores pointers other than the active one', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 50, 50, undefined, 2)
  pointer('pointerup', 50, 50, undefined, 2)

  expect(events.map((e) => e.state)).toEqual(['began'])
})

it('emits cancelled and stops tracking', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 20, 10)
  pointer('pointercancel', 20, 10)
  pointer('pointermove', 40, 10)

  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'cancelled'])
})

it('lets a click reach the document when no drag was captured', () => {
  const { child, pointer, click } = mount(vi.fn())
  const seen = vi.fn()

  document.addEventListener('click', seen)
  try {
    pointer('pointerdown', 10, 10)
    pointer('pointermove', 12, 10)
    pointer('pointerup', 12, 10)
    click(child)
    expect(seen).toHaveBeenCalledTimes(1)
  } finally {
    document.removeEventListener('click', seen)
  }
})

it('suppresses the retargeted click once, after a captured drag', () => {
  const { host, pointer, click } = mount(vi.fn())
  const seen = vi.fn()

  document.addEventListener('click', seen)
  try {
    pointer('pointerdown', 10, 10)
    pointer('pointermove', 40, 10)
    pointer('pointerup', 40, 10)

    click(host)
    expect(seen).not.toHaveBeenCalled()

    click(host)
    expect(seen).toHaveBeenCalledTimes(1)
  } finally {
    document.removeEventListener('click', seen)
  }
})

it('retains the initiating contact and origin across other pointer downs', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 30, 10)
  pointer('pointerdown', 100, 100, undefined, 2)
  pointer('pointermove', 110, 100, undefined, 2)
  pointer('pointerup', 110, 100, undefined, 2)
  pointer('pointermove', 40, 10)
  pointer('pointerup', 40, 10)
  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'moved', 'ended'])
  expect(events.at(-1).dx).toBe(30)
})

it('rejects nonprimary contacts and nonprimary buttons', () => {
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  pointer('pointerdown', 0, 0, undefined, 2, 0, false)
  pointer('pointerup', 0, 0, undefined, 2)
  pointer('pointerdown', 0, 0, undefined, 1, 2)
  pointer('pointerup', 0, 0)
  expect(events).toEqual([])
})

it('cancels capture loss exactly once using the last pointer coordinates', () => {
  const events: any[] = []
  const { pointer, host, child } = mount((e) => events.push(e))

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 30, 20)
  pointer('lostpointercapture', 0, 0, child)
  pointer('lostpointercapture', 0, 0, host, 2)
  expect(events).toHaveLength(2)
  pointer('lostpointercapture', 0, 0, host)
  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'cancelled'])
  pointer('pointercancel', 30, 20)
  pointer('pointerup', 30, 20)
  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'cancelled'])
  expect(events.at(-1)).toMatchObject({ dx: 20, dy: 10 })
})

it('keeps a contact through callback replacement and cancels it on disable', () => {
  const first = vi.fn(),
    next = vi.fn()

  const { pointer, render } = mount(first)

  pointer('pointerdown', 10, 10)
  render(next)
  pointer('pointermove', 30, 10)
  render()
  pointer('pointerup', 30, 10)
  expect(first.mock.calls.map(([e]) => e.state)).toEqual(['began'])
  expect(next.mock.calls.map(([e]) => e.state)).toEqual(['moved', 'cancelled'])
  render(next)
  pointer('pointerdown', 5, 5)
  pointer('pointerup', 5, 5)
  expect(next.mock.calls.slice(-2).map(([e]) => e.state)).toEqual(['began', 'ended'])
})

it('cancels on unmount and releases capture without a duplicate terminal', () => {
  const events: any[] = []
  const { pointer, root, host } = mount((e) => events.push(e))

  Object.assign(host, {
    hasPointerCapture: () => true,
    releasePointerCapture: () => {
      pointer('lostpointercapture', 0, 0, host)
    },
  })

  pointer('pointerdown', 10, 10)
  pointer('pointermove', 30, 10)
  act(() => root.unmount())
  pointer('pointerup', 30, 10, document)
  expect(events.map((e) => e.state)).toEqual(['began', 'moved', 'cancelled'])
})

it('preserves fresh velocity at up but expires a stationary sample', () => {
  const clock = vi.spyOn(performance, 'now')
  const events: any[] = []
  const { pointer } = mount((e) => events.push(e))

  try {
    clock.mockReturnValue(0)
    pointer('pointerdown', 10, 10)
    clock.mockReturnValue(20)
    pointer('pointermove', 30, 10)
    clock.mockReturnValue(30)
    pointer('pointerup', 30, 10)
    expect(events.at(-1).vx).toBe(1000)
    clock.mockReturnValue(100)
    pointer('pointerdown', 10, 10)
    clock.mockReturnValue(120)
    pointer('pointermove', 30, 10)
    clock.mockReturnValue(221)
    pointer('pointerup', 30, 10)
    expect(events.at(-1).vx).toBe(0)
  } finally {
    clock.mockRestore()
  }
})
