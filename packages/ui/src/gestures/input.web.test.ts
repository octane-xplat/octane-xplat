import { afterEach, expect, it } from 'vitest'
import {
  attachWebGesture,
  registerWebGestureViewport,
  attachWebInteractionScope,
} from './input.web'

import { createScope } from 'octane/signals'
import { createInteractionScope } from './scope'
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

it('reserves axes on each registered scroll viewport and tracks committed options in place', () => {
  const { node } = host(),
    viewport = document.createElement('div')

  node.append(viewport)

  const pan = createPanController({ axis: 'x' })
  const detach = attachWebGesture(node, pan.handle)
  const unregister = registerWebGestureViewport(viewport)

  cleanups.push(() => pan.dispose(), detach, unregister)
  expect(viewport.style.touchAction).toBe('pan-y pinch-zoom')
  pan.commit({ axis: 'y' })
  expect(viewport.style.touchAction).toBe('pan-x pinch-zoom')
  pan.commit({ axis: 'y', enabled: false })
  expect(viewport.style.touchAction ?? '').toBe('')
})

it('preserves authored restrictions and restores only the value owned by the policy writer', () => {
  const { node } = host()

  node.style.touchAction = 'none'

  const pan = createPanController({ axis: 'x' })
  const detach = attachWebGesture(node, pan.handle)

  cleanups.push(() => pan.dispose(), detach)
  expect(node.style.touchAction).toBe('none')
  node.style.touchAction = 'pan-x'
  pan.commit({ axis: 'x' })
  expect(node.style.touchAction).toBe('none')
  detach()
  expect(node.style.touchAction).toBe('pan-x')
})

it('gates semantic events during a lease and retains the root after gesture detach', () => {
  const { node, button } = host()

  // jsdom has no inert implementation; the driver boundary requires its presence.
  Object.defineProperty(node, 'inert', { value: false, writable: true })

  const owner = createScope({ scopeKey: 'web-scope-test' }),
    state$ = owner.signal$('suspended', false)

  const scope = createInteractionScope(
    state$,
    owner.derived$('readonly', () => state$.get()),
  )

  const offScope = attachWebInteractionScope(node, scope.handle)
  const pan = createPanController({ axis: 'x' }),
    offPan = attachWebGesture(node, pan.handle)

  cleanups.push(
    () => owner.dispose(),
    () => scope.dispose(),
    offScope,
    () => pan.dispose(),
    offPan,
  )

  const lease = scope.handle.suspend()

  if (!lease.ok) {
    throw new Error('Expected a lease')
  }

  offPan()

  let count = 0

  button.addEventListener('click', () => count++)
  button.click()
  expect(count).toBe(0)
  lease.lease.release()
  button.click()
  expect(count).toBe(1)
  expect(node.inert).toBe(false)
})

it('rejects scroll suspension before mutating a scrollable subtree', () => {
  const { node } = host()

  Object.defineProperties(node, {
    inert: { value: false, writable: true },
    scrollHeight: { value: 500 },
    clientHeight: { value: 200 },
  })

  node.style.overflowY = 'auto'

  const owner = createScope({ scopeKey: 'web-scope-unsupported' }),
    state$ = owner.signal$('suspended', false)

  const scope = createInteractionScope(
    state$,
    owner.derived$('readonly', () => state$.get()),
  )

  cleanups.push(
    () => owner.dispose(),
    () => scope.dispose(),
    attachWebInteractionScope(node, scope.handle),
  )

  expect(scope.handle.suspend()).toEqual({ ok: false, reason: 'unsupported' })
  expect(node.inert).toBe(false)
  expect(scope.handle.suspended$.get()).toBe(false)
})

it('restores the original inert flag after independent scopes on the same host release in either order', () => {
  const { node } = host()

  Object.defineProperty(node, 'inert', { value: false, writable: true })

  const owner = createScope({ scopeKey: 'web-independent-scopes' })
  const first$ = owner.signal$('first', false),
    second$ = owner.signal$('second', false)

  const first = createInteractionScope(
    first$,
    owner.derived$('first-read', () => first$.get()),
  )

  const second = createInteractionScope(
    second$,
    owner.derived$('second-read', () => second$.get()),
  )

  cleanups.push(
    () => owner.dispose(),
    () => first.dispose(),
    () => second.dispose(),
    attachWebInteractionScope(node, first.handle),
    attachWebInteractionScope(node, second.handle),
  )

  const a = first.handle.suspend(),
    b = second.handle.suspend()

  if (!a.ok || !b.ok) {
    throw new Error('Expected independent leases')
  }

  a.lease.release()
  expect(node.inert).toBe(true)
  b.lease.release()
  expect(node.inert).toBe(false)
})
