import { afterEach, expect, it } from 'vitest'
import { attachWebGesture } from './input.web'
import { createPanController } from './controller'

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    cleanup()
  }

  document.body.replaceChildren()
})

function pointer(node: Element, type: string, x: number, y = 0, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
  })

  Object.defineProperties(event, { pointerId: { value: id }, pointerType: { value: 'mouse' } })
  node.dispatchEvent(event)
}

function host() {
  const node = document.createElement('div'),
    button = document.createElement('button')

  node.append(button)
  document.body.append(node)
  node.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 300,
    height: 200,
    right: 300,
    bottom: 200,
    toJSON() {},
  })

  return { node, button }
}

it('preserves nested activation before claim and rejects only the claimed sequence click', () => {
  const { node, button } = host()
  const pan = createPanController({ axis: 'x' })

  cleanups.push(() => pan.dispose(), attachWebGesture(node, pan.handle))

  let activated = 0

  button.addEventListener('click', () => activated++)
  pointer(button, 'pointerdown', 10)
  pointer(button, 'pointerup', 10)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
  expect(activated).toBe(1)
  pointer(button, 'pointerdown', 10)
  pointer(button, 'pointermove', 40)
  pointer(button, 'pointerup', 40)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
  expect(activated).toBe(1)
  // A fresh independent press and keyboard/virtual activation remain eligible.
  pointer(button, 'pointerdown', 10)
  pointer(button, 'pointerup', 10)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
  button.click()
  expect(activated).toBe(3)
})

it('does not spend a cancelled drag guard on keyboard activation or a different pointer', () => {
  const { node, button } = host()
  const pan = createPanController({ axis: 'x' })

  cleanups.push(() => pan.dispose(), attachWebGesture(node, pan.handle))

  let activated = 0

  button.addEventListener('click', () => activated++)
  pointer(button, 'pointerdown', 10)
  pointer(button, 'pointermove', 40)
  pointer(button, 'pointercancel', 40)
  button.click()
  expect(activated).toBe(1)

  const click = new MouseEvent('click', { bubbles: true, detail: 1 })

  Object.defineProperty(click, 'pointerId', { value: 7 })
  button.dispatchEvent(click)
  expect(activated).toBe(2)
})

it('reserves only the configured axis and restores authored policy on release', () => {
  const { node } = host()

  node.style.touchAction = 'manipulation'

  const pan = createPanController({ axis: 'x' })
  const release = attachWebGesture(node, pan.handle)

  cleanups.push(() => pan.dispose(), release)
  expect(node.style.touchAction).toBe('pan-y pinch-zoom')
  release()
  expect(node.style.touchAction).toBe('manipulation')
})
