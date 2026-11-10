import {
  NSEvent,
  NSNotificationCenter,
  NSWindowDidResignKeyNotification,
  NSControl,
  NSTextField,
  NSTextView,
  NSView,
  NSWindow,
} from '@octane-xplat/platform/macos'

import { viewPoint } from './pointer-motion'
import { appKitMouseHit } from './primary-click'

interface Point {
  readonly x: number
  readonly y: number
}

export interface AppKitContactFrame {
  readonly cohort: string
  readonly type: 'down' | 'move' | 'up' | 'cancel'
  readonly time: number
  readonly contacts: readonly {
    readonly id: string
    readonly kind: 'mouse'
    readonly window: Point
    readonly screen: null
  }[]
  readonly changed: {
    readonly id: string
    readonly kind: 'mouse'
    readonly window: Point
    readonly screen: null
  }
  readonly hitPath: readonly object[]
  readonly nativeOwned: boolean
  readonly nativeBoundary?: object
}

/** Mouse contacts only. Trackpad magnification is not a direct-touch pinch. */
export function appKitGestureSurface(view: NSView) {
  const window = view.window,
    content = window?.contentView

  if (!window || !content) {
    throw new Error('AppKit gesture attachment requires a view in a window')
  }

  const toNative = (point: Point) =>
    content.convertPointToView(
      {
        x: point.x + content.bounds.origin.x,
        y: content.flipped
          ? point.y + content.bounds.origin.y
          : content.bounds.origin.y + content.bounds.size.height - point.y,
      },
      null,
    )

  const local = (point: Point) => (view.window === window ? viewPoint(view, toNative(point)) : null)
  let observing = false

  return {
    root: window,
    host: view,
    local,
    parentBasis() {
      const parent = view.superview ?? content
      const convert = (point: Point) =>
        parent.window === window ? viewPoint(parent, toNative(point)) : null

      const zero = convert({ x: 0, y: 0 }),
        x = convert({ x: 1, y: 0 }),
        y = convert({ x: 0, y: 1 })

      if (!zero || !x || !y) {
        return null
      }

      const a = x.x - zero.x,
        b = x.y - zero.y,
        c = y.x - zero.x,
        d = y.y - zero.y

      if (!Number.isFinite(a * d - b * c) || Math.abs(a * d - b * c) < 1e-10) {
        return null
      }

      return (point: Point) => ({
        x: zero.x + a * point.x + c * point.y,
        y: zero.y + b * point.x + d * point.y,
      })
    },
    freeze() {
      const zero = local({ x: 0, y: 0 }),
        x = local({ x: 1, y: 0 }),
        y = local({ x: 0, y: 1 })

      if (!zero || !x || !y) {
        return null
      }

      const a = x.x - zero.x,
        b = x.y - zero.y,
        c = y.x - zero.x,
        d = y.y - zero.y

      if (!Number.isFinite(a * d - b * c) || Math.abs(a * d - b * c) < 1e-10) {
        return null
      }

      return (point: Point) => ({
        x: zero.x + a * point.x + c * point.y,
        y: zero.y + b * point.x + d * point.y,
      })
    },
    containsPoint(point: Point) {
      const p = local(point)

      return Boolean(
        p &&
        p.x >= 0 &&
        p.y >= 0 &&
        p.x <= view.bounds.size.width &&
        p.y <= view.bounds.size.height,
      )
    },
    containsHost(other: object) {
      if (!(other instanceof NSView)) {
        return false
      }

      for (let current: NSView | null = other; current; current = current.superview) {
        if (current === view) {
          return true
        }
      }

      return false
    },
    observe(dispatch: ContactObserver) {
      if (observing) {
        throw new Error('An AppKit gesture surface can observe only once')
      }

      observing = true

      let release: () => void

      try {
        release = observeWindow(window, content, dispatch)
      } catch (error) {
        observing = false
        throw error
      }

      return () => {
        observing = false
        release()
      }
    },
  }
}

export type AppKitGestureSurface = ReturnType<typeof appKitGestureSurface>

type ContactObserver = (frame: AppKitContactFrame, identity: string) => void
interface WindowInput {
  readonly observers: Set<ContactObserver>
  dispose(): void
}

const windows = new WeakMap<object, WindowInput>()
function observeWindow(window: NSWindow, content: NSView, dispatch: ContactObserver): () => void {
  let root = windows.get(window)

  if (!root) {
    const observers = new Set<ContactObserver>()
    const notify: ContactObserver = (frame, identity) => {
      for (const observer of [...observers]) {
        if (observers.has(observer)) {
          observer(frame, identity)
        }
      }
    }

    let active = false,
      sequence = 0,
      path: object[] = [],
      nativeOwned = false

    let last: AppKitContactFrame | null = null
    const monitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
      (1 << 1) | (1 << 2) | (1 << 6),
      (event) => {
        if (event.window !== window) {
          return event
        }

        const type = Number(event.type)

        if (type !== 1 && !active) {
          return event
        }

        const point = viewPoint(content, event.locationInWindow)

        if (!point) {
          return event
        }

        if (type === 1) {
          active = true
          sequence++
          path = []

          const hit = appKitMouseHit(window, event.locationInWindow)

          for (let current = hit; current; current = current.superview) {
            path.push(current)
          }

          nativeOwned =
            Boolean(Number(event.modifierFlags) & (1 << 18)) ||
            path.some(
              (host) =>
                host instanceof NSTextView ||
                (host instanceof NSControl &&
                  !(host instanceof NSTextField && !host.editable && !host.selectable)),
            )
        }

        const changed = {
          id: String(sequence),
          kind: 'mouse' as const,
          window: point,
          screen: null,
        }

        last = {
          cohort: String(sequence),
          type: type === 1 ? 'down' : type === 2 ? 'up' : 'move',
          time: event.timestamp * 1000,
          contacts: type === 2 ? [] : [changed],
          changed,
          hitPath: path,
          nativeOwned,
          nativeBoundary: path.find((host) => {
            const value: unknown = Reflect.get(host, 'accessibilityRole')
            const role = typeof value === 'function' ? value.call(host) : value

            return role === 'AXSlider' || role === 'AXIncrementor'
          }),
        }

        if (type === 2) {
          active = false
        }

        notify(last, `${last.time}:${type}:${event.eventNumber}`)
        return event
      },
    )

    if (!monitor) {
      throw new Error('AppKit local pointer monitor unavailable')
    }

    const notification = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
      NSWindowDidResignKeyNotification,
      window,
      null,
      () => {
        if (active && last) {
          active = false
          notify({ ...last, type: 'cancel', contacts: [] }, `resign:${sequence}`)
        }
      },
    )

    root = {
      observers,
      dispose() {
        try {
          NSEvent.removeMonitor(monitor)
        } finally {
          NSNotificationCenter.defaultCenter.removeObserver(notification)
        }
      },
    }

    windows.set(window, root)
  }

  const current = root

  current.observers.add(dispatch)

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false
    current.observers.delete(dispatch)
    if (!current.observers.size) {
      windows.delete(window)
      current.dispose()
    }
  }
}
