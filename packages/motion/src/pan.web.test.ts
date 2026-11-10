import { afterEach, expect, it, vi } from 'vitest'
import { attachPan } from './pan.web'

const cleanups: (() => void)[] = []

afterEach(() => cleanups.splice(0).forEach((off) => off()))

function rig() {
  const host = document.createElement('div')
  const button = document.createElement('button')

  host.append(button)
  document.body.append(host)

  const clicked = vi.fn()
  const nested = vi.fn()

  host.addEventListener('click', clicked)
  button.addEventListener('click', nested)

  const callbacks = { start: vi.fn(), move: vi.fn(), end: vi.fn() }
  const off = attachPan(host, 'x', callbacks)

  cleanups.push(() => {
    off()
    host.remove()
  })

  const pointer = (type: string, x = 0, pointerId = 1, target = button) => {
    target.dispatchEvent(
      Object.assign(new Event(type, { bubbles: true }), {
        pointerId,
        clientX: x,
        clientY: 0,
        button: 0,
        isPrimary: true,
      }),
    )
  }

  const click = (detail = 1, pointerId = 1) =>
    button.dispatchEvent(
      Object.assign(new MouseEvent('click', { bubbles: true, cancelable: true, detail }), {
        pointerId,
      }),
    )

  const drag = () => {
    pointer('pointerdown')
    pointer('pointermove', 40)
    pointer('pointerup', 40)
  }

  return { host, button, clicked, nested, callbacks, pointer, click, drag, off }
}

it('consumes only the completed drag pointer click before nested and host actions (#211)', () => {
  const f = rig()

  f.drag()
  expect(f.callbacks.end).toHaveBeenCalledOnce()
  expect(f.click()).toBe(false)
  expect(f.clicked).not.toHaveBeenCalled()
  expect(f.nested).not.toHaveBeenCalled()
  expect(f.click()).toBe(true)
})

it('preserves nested taps below the activation distance separately from the drag tail (#192)', () => {
  const f = rig()

  f.pointer('pointerdown')
  f.pointer('pointermove', 7)
  f.pointer('pointerup', 7)
  expect(f.click()).toBe(true)
  expect(f.nested).toHaveBeenCalledOnce()
  expect(f.callbacks.start).not.toHaveBeenCalled()
})

it('preserves keyboard clicks and clicks from another pointer without consuming the tail guard', () => {
  const f = rig()

  f.drag()
  expect(f.click(0, -1)).toBe(true)
  expect(f.click(1, 2)).toBe(true)
  expect(f.click()).toBe(false)
  expect(f.nested).toHaveBeenCalledTimes(2)
})

it('clears a missing tail on the next independent press, even outside the host', () => {
  const f = rig()

  f.drag()
  document.body.dispatchEvent(
    Object.assign(new MouseEvent('pointerdown', { bubbles: true, button: 0 }), { pointerId: 2 }),
  )

  expect(f.click()).toBe(true)
})

it.each(['pointercancel', 'lostpointercapture'])(
  '%s rejects the correlated trailing pointer click',
  (terminal) => {
    const f = rig()

    f.pointer('pointerdown')
    f.pointer('pointermove', 40)
    f.pointer(terminal, 40, 1, terminal === 'lostpointercapture' ? f.host : f.button)
    f.pointer('pointerup', 40)
    expect(f.callbacks.end).toHaveBeenCalledOnce()
    expect(f.callbacks.end.mock.calls[0][1].cancelled).toBe(true)
    expect(f.click()).toBe(false)
    expect(f.click(0)).toBe(true)
  },
)

it('removes the tail guard on teardown', () => {
  const f = rig()

  f.drag()
  f.off()
  expect(f.click()).toBe(true)
})

it('maps drag offset into parent channel units independently of its own scale', () => {
  const f = rig()

  f.host.style.transform = 'scale(2)'
  f.pointer('pointerdown', 0)
  f.pointer('pointermove', 20)
  expect(f.callbacks.move.mock.calls.at(-1)![1].offset.x).toBe(20)
  expect(f.callbacks.move.mock.calls.at(-1)![0].position.local.x).toBe(10)
})

it('respects the parent scale while excluding its own scale from channel translation', () => {
  const f = rig(),
    parent = document.createElement('div')

  f.host.before(parent)
  parent.append(f.host)
  cleanups.push(() => parent.remove())
  parent.style.transform = 'scale(2)'
  f.host.style.transform = 'scale(2)'
  f.pointer('pointerdown', 0)
  f.pointer('pointermove', 40)
  expect(f.callbacks.move.mock.calls.at(-1)![1].offset.x).toBe(20)
  expect(f.callbacks.move.mock.calls.at(-1)![0].position.local.x).toBe(10)
})
