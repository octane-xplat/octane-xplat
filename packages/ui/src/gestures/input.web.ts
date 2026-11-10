import { gestureLeaves } from './composition'
import { gestureController } from './controller'
import { createGestureOwner, type GestureOwner, type InputContact, type InputFrame } from './owner'
import { inverseGestureTransform, type GestureTransform } from './geometry'
import type { GestureInput } from './types'

interface WebAttachment {
  readonly node: HTMLElement
  readonly input: GestureInput
}

interface WebRoot {
  readonly owner: GestureOwner
  readonly attachments: Set<WebAttachment>
  dispose(): void
}

const roots = new WeakMap<Document, WebRoot>()
let targetId = 0

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
  let path: readonly object[] = []
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

  const send = (event: PointerEvent, type: InputFrame['type']) =>
    owner.dispatch({
      type,
      time: event.timeStamp,
      contacts: [...contacts.values()],
      changed: contact(event),
      hitPath: path,
    })

  const down = (event: PointerEvent) => {
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

  const finish = (event: PointerEvent, type: 'up' | 'cancel') => {
    if (!contacts.has(event.pointerId)) {
      return
    }

    contacts.delete(event.pointerId)
    if (type === 'cancel') {
      contacts.clear()
    }

    claimed = send(event, type) || claimed
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
    finish(event, 'cancel')
  }

  const click = (event: MouseEvent) => {
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

  const root: WebRoot = {
    owner,
    attachments,
    dispose() {
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
        roots.delete(document)
      }
    },
  }

  roots.set(document, root)
  return root
}

/** Attach one gesture tree. The renderer retains this attachment across equivalent descriptions. */
export function attachWebGesture(node: HTMLElement, input: GestureInput): () => void {
  const root = rootFor(node.ownerDocument)
  const record = { node, input }
  const target = Object.freeze({ id: `web-target:${++targetId}` })
  const detach = root.owner.register(node, input, {
    target,
    local: (point) => {
      const matrix = windowTransform(node)

      return matrix ? (inverseGestureTransform(matrix)?.(point) ?? null) : null
    },
    freeze: () => {
      const matrix = windowTransform(node)

      return matrix ? inverseGestureTransform(matrix) : null
    },
  })

  root.attachments.add(record)

  const previous = node.style.touchAction
  const leaves = gestureLeaves(input)
  let horizontal = false,
    vertical = false

  for (const leaf of leaves) {
    const controller = gestureController(leaf)

    if (controller.kind === 'pinch') {
      horizontal = true
      vertical = true
    } else {
      horizontal ||= controller.options.axis !== 'y'
      vertical ||= controller.options.axis !== 'x'
    }
  }

  const action =
    horizontal && vertical ? 'none' : horizontal ? 'pan-y pinch-zoom' : 'pan-x pinch-zoom'

  node.style.touchAction = action

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    try {
      detach()
    } finally {
      root.attachments.delete(record)
      if (node.style.touchAction === action) {
        node.style.touchAction = previous
      }

      if (!root.attachments.size) {
        root.dispose()
      }
    }
  }
}
