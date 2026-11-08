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
  ) =>
    act(() =>
      target.dispatchEvent(
        Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
          clientX: x,
          clientY: y,
          pointerId,
          button: 0,
        }),
      ),
    )

  const click = (target: EventTarget) =>
    act(() => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))

  return { root, host, child, pointer, click }
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
