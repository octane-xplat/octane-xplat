import { gestureLeaves } from './composition'
import { observeGesturePolicy, restrictTouchAction } from './gesture-policy'
import {
  createScrollPolicyRegistry,
  unrestrictedScroll,
  suspendedScroll,
  type ScrollPolicy,
  type ScrollPolicyRegistry,
} from './scroll-policy'

import { interactionScopeController } from './scope'
import { createGestureOwner, type GestureOwner, type InputContact, type InputFrame } from './owner'
import { inverseGestureTransform, type GestureTransform } from './geometry'
import type { GestureInput, InteractionScope } from './types'
import type { PressOptions } from './press'
import { interactionTarget } from './target'
import type { GestureSpace } from './owner'

interface WebAttachment {
  readonly node: HTMLElement
  readonly input: GestureInput
}

interface WebRoot {
  readonly owner: GestureOwner
  readonly attachments: Set<WebAttachment>
  readonly policies: ScrollPolicyRegistry<HTMLElement>
  readonly locks: Map<HTMLElement, { count: number; wasInert: boolean }>
  retain(): () => void
  policyHost(node: HTMLElement): () => void
  consumeWithin(node: HTMLElement): void
  dispose(): void
}

const roots = new WeakMap<Document, WebRoot>()

/** Visual press observer shares cohort cancellation without a second semantic target. */
export function observeWebPress(node: HTMLElement, options: PressOptions): () => void {
  const root = rootFor(node.ownerDocument)
  const release = root.retain()
  const space = webSpace(node)
  const registration = root.owner.registerPress(node, options, space, (point) => {
    const local = space.local(point)

    return Boolean(
      local &&
      local.x >= 0 &&
      local.y >= 0 &&
      local.x <= node.offsetWidth &&
      local.y <= node.offsetHeight,
    )
  })

  return () => {
    try {
      registration.dispose()
    } finally {
      release()
    }
  }
}

function deepestSemanticHost(path: readonly EventTarget[], document: Document): HTMLElement | null {
  const Element = document.defaultView?.HTMLElement

  return (
    path.find((entry): entry is HTMLElement =>
      Boolean(
        Element &&
        entry instanceof Element &&
        (presses.has(entry) ||
          entry.isContentEditable ||
          /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(entry.tagName) ||
          /^(button|slider|spinbutton)$/.test(entry.getAttribute('role') ?? '')),
      ),
    ) ?? null
  )
}

/** Compute a stable 2D plane, accounting for transformed ancestors and border-box origin. */
function windowTransform(node: HTMLElement): GestureTransform | null {
  const window = node.ownerDocument.defaultView

  if (!window) {
    return null
  }

  let a = 1,
    b = 0,
    c = 0,
    d = 1

  for (let current: HTMLElement | null = node; current; current = current.parentElement) {
    const style = window.getComputedStyle(current)

    if (!style.transform || style.transform === 'none') {
      continue
    }

    const matrix = new window.DOMMatrixReadOnly(style.transform)

    if (!matrix.is2D) {
      return null
    }

    const nextA = matrix.a * a + matrix.c * b
    const nextB = matrix.b * a + matrix.d * b
    const nextC = matrix.a * c + matrix.c * d
    const nextD = matrix.b * c + matrix.d * d

    a = nextA
    b = nextB
    c = nextC
    d = nextD
  }

  const bounds = node.getBoundingClientRect()
  const width = node.offsetWidth || bounds.width,
    height = node.offsetHeight || bounds.height

  const minX = Math.min(0, a * width, c * height, a * width + c * height)
  const minY = Math.min(0, b * width, d * height, b * width + d * height)

  return { a, b, c, d, x: bounds.left - minX, y: bounds.top - minY }
}

function rootFor(document: Document): WebRoot {
  const prior = roots.get(document)

  if (prior) {
    return prior
  }

  const window = document.defaultView

  if (!window) {
    throw new Error('Cannot attach gestures to a detached document')
  }

  const attachments = new Set<WebAttachment>()
  const contacts = new Map<number, InputContact>()
  const locks = new Map<HTMLElement, { count: number; wasInert: boolean }>()
  const policies = createScrollPolicyRegistry<HTMLElement>((ancestor, descendant) =>
    ancestor.contains(descendant),
  )

  const policyHosts = new Map<HTMLElement, { count: number; release(): void }>()
  let references = 0
  let disposed = false
  const blocked = (event: Event) => {
    const path = event.composedPath()

    if (![...locks.keys()].some((node) => path.includes(node))) {
      return false
    }

    event.preventDefault()
    event.stopImmediatePropagation()
    return true
  }

  let path: readonly EventTarget[] = []
  let capture: { node: HTMLElement; id: number } | null = null
  let tail: { pointer: number; path: readonly object[]; capture: HTMLElement | null } | null = null
  let claimed = false
  const owner = createGestureOwner({
    frame: (callback) => {
      const id = window.requestAnimationFrame(callback)

      return () => window.cancelAnimationFrame(id)
    },
    error: (error) => {
      window.reportError(error)
    },
  })

  const contact = (event: PointerEvent): InputContact => ({
    id: String(event.pointerId),
    kind: event.pointerType === 'pen' ? 'pen' : event.pointerType === 'touch' ? 'touch' : 'mouse',
    window: { x: event.clientX, y: event.clientY },
    screen: { x: event.screenX, y: event.screenY },
  })

  const send = (
    event: PointerEvent,
    type: InputFrame['type'],
    cancelReason?: InputFrame['cancelReason'],
    changed = contact(event),
  ) => {
    const semanticHost = deepestSemanticHost(path, document)

    return owner.dispatch({
      type,
      time: event.timeStamp,
      contacts: [...contacts.values()],
      changed,
      hitPath: path,
      cancelReason,
      nativePressOwned: semanticHost !== null && !presses.has(semanticHost),
      nativeBoundary: path.find(
        (node) =>
          node instanceof window.HTMLElement &&
          /^(slider|spinbutton)$/.test(node.getAttribute('role') ?? ''),
      ),
      nativeOwned: path.some(
        (node) =>
          node instanceof window.HTMLElement &&
          (node.isContentEditable ||
            /^(INPUT|SELECT|TEXTAREA|IFRAME|OBJECT|EMBED)$/.test(node.tagName)),
      ),
    })
  }

  const down = (event: PointerEvent) => {
    if (blocked(event)) {
      return
    }

    if (event.button !== 0 || contacts.has(event.pointerId)) {
      return
    }

    if (!contacts.size) {
      tail = null
      path = event.composedPath()
      claimed = false
    }

    contacts.set(event.pointerId, contact(event))
    send(event, 'down')
  }

  const move = (event: PointerEvent) => {
    if (!contacts.has(event.pointerId)) {
      return
    }

    contacts.set(event.pointerId, contact(event))
    if (!send(event, 'move')) {
      return
    }

    claimed = true
    if (!capture) {
      const winner = [...attachments].find((a) =>
        gestureLeaves(a.input).some((handle) => handle.active$.get()),
      )

      if (winner) {
        try {
          winner.node.setPointerCapture(event.pointerId)
          capture = { node: winner.node, id: event.pointerId }
        } catch (error) {
          // Dispatch-only tests have no browser-owned pointer. Real capture failure cancels.
          if (event.isTrusted) {
            send(event, 'cancel')
            throw error
          }
        }
      }
    }

    if (event.cancelable) {
      event.preventDefault()
    }
  }

  const finish = (
    event: PointerEvent,
    type: 'up' | 'cancel',
    cancelReason?: InputFrame['cancelReason'],
  ) => {
    if (!contacts.has(event.pointerId)) {
      return
    }

    const previousContact = contacts.get(event.pointerId)

    contacts.delete(event.pointerId)
    claimed =
      send(event, type, cancelReason, type === 'cancel' ? previousContact : undefined) || claimed

    if (claimed && !contacts.size) {
      tail = { pointer: event.pointerId, path, capture: capture?.node ?? null }
    }

    if (!contacts.size) {
      const previous = capture

      capture = null
      if (previous?.node.hasPointerCapture(previous.id)) {
        previous.node.releasePointerCapture(previous.id)
      }
    }
  }

  const up = (event: PointerEvent) => finish(event, 'up')
  const cancel = (event: PointerEvent) => finish(event, 'cancel')
  const lost = (event: PointerEvent) => {
    if (
      !capture ||
      capture.id !== event.pointerId ||
      capture.node !== event.target ||
      !contacts.size
    ) {
      return
    }

    capture = null
    // Capture loss does not end the physical contacts. Retain their cohort until up.
    claimed = send(event, 'cancel', 'capture-lost', contacts.get(event.pointerId)) || claimed
  }

  const click = (event: MouseEvent) => {
    if (blocked(event)) {
      return
    }

    if (!tail || event.detail === 0) {
      return
    }

    const pointer = 'pointerId' in event ? event.pointerId : null

    if (pointer !== null && pointer !== tail.pointer) {
      return
    }

    if (event.target !== tail.capture && (!event.target || !tail.path.includes(event.target))) {
      return
    }

    tail = null
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const blur = () => {
    const last = contacts.values().next().value

    if (!last) {
      return
    }

    contacts.clear()
    owner.dispatch({
      type: 'cancel',
      time: window.performance.now(),
      contacts: [],
      changed: last,
      hitPath: path,
    })

    const previous = capture

    capture = null
    if (previous?.node.hasPointerCapture(previous.id)) {
      previous.node.releasePointerCapture(previous.id)
    }
  }

  document.addEventListener('pointerdown', down, true)
  document.addEventListener('pointermove', move, { capture: true, passive: false })
  document.addEventListener('pointerup', up, true)
  document.addEventListener('pointercancel', cancel, true)
  document.addEventListener('lostpointercapture', lost, true)
  document.addEventListener('click', click, true)
  window.addEventListener('blur', blur)
  document.addEventListener('wheel', blocked, { capture: true, passive: false })
  document.addEventListener('keydown', blocked, true)
  document.addEventListener('keyup', blocked, true)

  const root: WebRoot = {
    owner,
    attachments,
    policies,
    locks,
    retain() {
      if (disposed) {
        throw new Error('Cannot retain a disposed gesture root')
      }

      references++

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false
        if (--references === 0) {
          root.dispose()
        }
      }
    },
    policyHost(node) {
      const prior = policyHosts.get(node)

      if (prior) {
        prior.count++
      } else {
        const writer = touchActionWriter(node)
        const release = policies.register({ host: node, apply: writer })

        policyHosts.set(node, { count: 1, release })
      }

      let alive = true

      return () => {
        if (!alive) {
          return
        }

        alive = false

        const record = policyHosts.get(node)

        if (record && --record.count === 0) {
          policyHosts.delete(node)
          record.release()
        }
      }
    },
    consumeWithin(node) {
      if (path.includes(node)) {
        claimed = true
      }

      owner.cancelWhere(
        (host) => host instanceof window.Node && node.contains(host),
        'scope-suspended',
      )
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      roots.delete(document)
      try {
        blur()
        owner.dispose()
      } finally {
        document.removeEventListener('pointerdown', down, true)
        document.removeEventListener('pointermove', move, true)
        document.removeEventListener('pointerup', up, true)
        document.removeEventListener('pointercancel', cancel, true)
        document.removeEventListener('lostpointercapture', lost, true)
        document.removeEventListener('click', click, true)
        window.removeEventListener('blur', blur)
        document.removeEventListener('wheel', blocked, true)
        document.removeEventListener('keydown', blocked, true)
        document.removeEventListener('keyup', blocked, true)
      }
    },
  }

  roots.set(document, root)
  return root
}

/** Attach one gesture tree. The renderer retains this attachment across equivalent descriptions. */
export function attachWebGesture(
  node: HTMLElement,
  input: GestureInput,
  basis: 'host' | 'parent' = 'host',
): () => void {
  const root = rootFor(node.ownerDocument)
  const releaseRoot = root.retain()
  const record = { node, input }
  const cleanups: (() => void)[] = [releaseRoot]
  let alive = true
  const release = () => {
    if (!alive) {
      return
    }

    alive = false
    root.attachments.delete(record)

    // Every owned resource is attempted even if a cancellation callback fails.
    const errors: unknown[] = []

    for (const cleanup of cleanups.reverse()) {
      try {
        cleanup()
      } catch (error) {
        errors.push(error)
      }
    }

    if (errors.length) {
      throw new AggregateError(errors, 'Gesture attachment cleanup failed')
    }
  }

  try {
    const detach = root.owner.register(node, input, webSpace(node, basis))

    cleanups.push(detach, root.policyHost(node))

    const reservation = root.policies.reserve(node, unrestrictedScroll)

    cleanups.push(() => reservation.release())
    cleanups.push(observeGesturePolicy(input, (policy) => reservation.update(policy)))
    root.attachments.add(record)
  } catch (error) {
    release()
    throw error
  }

  return release
}

/** Register the actual scroll viewport, not its layout wrapper. */
export function registerWebGestureViewport(node: HTMLElement): () => void {
  const root = rootFor(node.ownerDocument),
    releaseRoot = root.retain()

  let releaseHost: () => void

  try {
    releaseHost = root.policyHost(node)
  } catch (error) {
    releaseRoot()
    throw error
  }

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      releaseHost()
    } finally {
      releaseRoot()
    }
  }
}

/** Input-only suspension. Scrollable subtrees remain unsupported until momentum is qualified. */
export function attachWebInteractionScope(node: HTMLElement, scope: InteractionScope): () => void {
  const root = rootFor(node.ownerDocument),
    releaseRoot = root.retain()

  let release: () => void

  try {
    release = interactionScopeController(scope).attach({
      covers(member) {
        const window = node.ownerDocument.defaultView

        return Boolean(window && member instanceof window.Node && node.contains(member))
      },
      freeze() {
        const window = node.ownerDocument.defaultView

        if (
          !window ||
          typeof node.inert !== 'boolean' ||
          node.querySelector('iframe,object,embed')
        ) {
          return { ok: false, reason: 'unsupported' }
        }

        const descendants = [node, ...node.querySelectorAll<HTMLElement>('*')]

        // No standard browser operation promises to stop already-owned touch momentum.
        // Do not return success based solely on touch-action or an instant scroll seek.
        if (
          descendants.some((child) => {
            const style = window.getComputedStyle(child)

            return (
              (child.scrollHeight > child.clientHeight &&
                /auto|scroll|hidden/.test(style.overflowY)) ||
              (child.scrollWidth > child.clientWidth && /auto|scroll|hidden/.test(style.overflowX))
            )
          })
        ) {
          return { ok: false, reason: 'unsupported' }
        }

        const focused = node.ownerDocument.activeElement

        if (
          focused instanceof window.HTMLElement &&
          node.contains(focused) &&
          (focused.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName))
        ) {
          return { ok: false, reason: 'unsupported' }
        }

        const reservation = root.policies.reserve(node, suspendedScroll)

        const lock = root.locks.get(node)

        if (lock) {
          lock.count++
        } else {
          root.locks.set(node, { count: 1, wasInert: node.inert })
        }

        node.inert = true

        let alive = true
        const restore = () => {
          if (!alive) {
            return
          }

          alive = false

          const lock = root.locks.get(node)

          if (lock && --lock.count === 0) {
            root.locks.delete(node)
            if (node.inert) {
              node.inert = lock.wasInert
            }
          }

          reservation.release()
        }

        try {
          root.consumeWithin(node)
        } catch (error) {
          restore()
          throw error
        }

        return { ok: true, release: restore }
      },
    })
  } catch (error) {
    releaseRoot()
    throw error
  }

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      release()
    } finally {
      releaseRoot()
    }
  }
}

/** One writer per host avoids separate gesture/viewport writers restoring each other's masks. */
function touchActionWriter(node: HTMLElement): (policy: ScrollPolicy) => void {
  let authored = node.style.touchAction
  let original = node.ownerDocument.defaultView?.getComputedStyle(node).touchAction ?? authored

  let written: string | null = null

  return (policy) => {
    if (written !== null && node.style.touchAction !== written) {
      authored = node.style.touchAction
      original = node.ownerDocument.defaultView?.getComputedStyle(node).touchAction ?? authored
    }

    if (policy.x && policy.y && policy.pinch) {
      if (written !== null && node.style.touchAction === written) {
        node.style.touchAction = authored
      }

      written = null
      return
    }

    written = restrictTouchAction(original, policy)
    node.style.touchAction = written
  }
}

function webSpace(node: HTMLElement, reference: 'host' | 'parent' = 'host'): GestureSpace {
  return {
    target: interactionTarget(node),
    local: (point) => {
      const matrix = windowTransform(node)

      return matrix ? (inverseGestureTransform(matrix)?.(point) ?? null) : null
    },
    freeze: () => {
      // Motion translation channels belong to the parent plane, independent
      // of the moving element's own scale/rotation. Public handles use host axes.
      const basis = reference === 'parent' ? node.parentElement : node

      if (!basis) {
        return (point) => point
      }

      const matrix = windowTransform(basis)

      return matrix ? inverseGestureTransform(matrix) : null
    },
  }
}

/** Semantic click delivery shares the gesture owner's pointer eligibility. */
export function attachWebPress(node: HTMLElement, options: PressOptions) {
  const root = rootFor(node.ownerDocument)
  const releaseRoot = root.retain()
  const space = webSpace(node)

  if (presses.has(node)) {
    releaseRoot()
    throw new Error('A semantic press can attach only once per host')
  }

  let registration: import('./owner').PressRegistration

  try {
    registration = root.owner.registerPress(node, options, space, (point) => {
      const local = space.local(point)

      return Boolean(
        local &&
        local.x >= 0 &&
        local.y >= 0 &&
        local.x <= node.offsetWidth &&
        local.y <= node.offsetHeight,
      )
    })
  } catch (error) {
    releaseRoot()
    throw error
  }

  let keyboard = false
  let spaceHeld = false
  let alive = true
  const own = (event: Event) => {
    // Only the deepest managed semantic host handles an activation.
    const path = event.composedPath()

    return deepestSemanticHost(path, node.ownerDocument) === node
  }

  const click = (event: MouseEvent) => {
    if (!own(event)) {
      return
    }

    const source = event.detail !== 0 ? 'pointer' : keyboard ? 'keyboard' : 'virtual'

    keyboard = false
    if (!registration.activate(source, () => event.preventDefault())) {
      event.preventDefault()
    }

    event.stopPropagation()
  }

  const double = (event: MouseEvent) => {
    if (own(event)) {
      registration.activate(
        event.detail ? 'pointer' : 'virtual',
        () => event.preventDefault(),
        'double',
      )

      event.stopPropagation()
    }
  }

  const down = (event: KeyboardEvent) => {
    if (event.target !== node || event.isComposing || event.repeat) {
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    keyboard = true
    if (node.tagName === 'BUTTON' || node.tagName === 'A') {
      return
    }

    event.preventDefault()
    if (event.key === 'Enter') {
      keyboard = false
      registration.activate('keyboard', () => event.preventDefault())
    } else {
      spaceHeld = true
    }
  }

  const up = (event: KeyboardEvent) => {
    if (event.target !== node || event.key !== ' ') {
      return
    }

    const activate = spaceHeld

    spaceHeld = false
    if (activate) {
      keyboard = false
      event.preventDefault()
      registration.activate('keyboard', () => event.preventDefault())
    }
  }

  const blur = () => {
    keyboard = false
    spaceHeld = false
  }

  presses.add(node)
  node.addEventListener('click', click)
  node.addEventListener('dblclick', double)
  node.addEventListener('keydown', down)
  node.addEventListener('keyup', up)
  node.addEventListener('blur', blur)
  return {
    commit(next: PressOptions) {
      if (next.enabled === false) {
        keyboard = false
        spaceHeld = false
      }

      registration.commit(next)
    },
    dispose() {
      if (!alive) {
        return
      }

      alive = false
      presses.delete(node)
      node.removeEventListener('click', click)
      node.removeEventListener('dblclick', double)
      node.removeEventListener('keydown', down)
      node.removeEventListener('keyup', up)
      node.removeEventListener('blur', blur)
      try {
        registration.dispose()
      } finally {
        releaseRoot()
      }
    },
  }
}

const presses = new WeakSet<HTMLElement>()

export type WebPressBinding = ReturnType<typeof attachWebPress>
