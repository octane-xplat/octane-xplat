import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import Graphene from 'gi://Graphene'

interface Point {
  readonly x: number
  readonly y: number
}
interface Contact {
  readonly id: string
  readonly kind: 'mouse'
  readonly window: Point
  readonly screen: null
}
export interface GtkContactFrame {
  readonly type: 'down' | 'move' | 'up' | 'cancel'
  readonly time: number
  readonly cohort: string
  readonly contacts: readonly Contact[]
  readonly changed: Contact
  readonly hitPath: readonly object[]
  readonly nativeOwned: boolean
  readonly nativeBoundary?: object
}
type Observer = (frame: GtkContactFrame, identity: string) => void
interface WindowInput {
  readonly observers: Set<Observer>
  claim(): boolean
  dispose(): void
}
const pointerTurns = new WeakSet<object>()
export function gtkActivationSource(view: Gtk.Widget): 'pointer' | 'virtual' {
  return pointerTurns.has(view.get_root()) ? 'pointer' : 'virtual'
}

const windows = new WeakMap<object, WindowInput>()

/** Logical GTK coordinates include allocation and CSS transforms; no device-scale multiplication. */
function convert(from: Gtk.Widget, to: Gtk.Widget, point: Point): Point | null {
  const [ok, value] = from.compute_point(to, new Graphene.Point({ x: point.x, y: point.y }))
  return ok && Number.isFinite(value.x) && Number.isFinite(value.y)
    ? { x: value.x, y: value.y }
    : null
}
export function gtkGestureSurface(host: Gtk.Widget, parentView?: () => Gtk.Widget) {
  const window = host.get_root()
  const root = host.get_native()
  if (!(window instanceof Gtk.Window) || !root) {
    throw new Error('GTK gesture attachment requires a mounted window')
  }
  const local = (p: Point) => (host.get_native() === root ? convert(root, host, p) : null)
  return {
    root,
    host,
    local,
    parentLocal(point: Point) {
      const parent = parentView?.() ?? host.get_parent()
      return parent && parent.get_native() === root ? convert(root, parent, point) : null
    },
    containsHost(other: object) {
      if (!(other instanceof Gtk.Widget)) {
        return false
      }
      for (let node: Gtk.Widget | null = other; node; node = node.get_parent()) {
        if (node === host) {
          return true
        }
      }
      return false
    },
    containsPoint(p: Point) {
      const point = local(p)
      return Boolean(
        point &&
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= host.get_width() &&
        point.y <= host.get_height(),
      )
    },
    claim: () => windows.get(root)?.claim() ?? false,
    observe: (observer: Observer) => observeWindow(root, window, observer),
  }
}
export type GtkGestureSurface = ReturnType<typeof gtkGestureSurface>

function observeWindow(root: Gtk.NativeWidget, window: Gtk.Window, observer: Observer) {
  let input = windows.get(root)
  if (!input) {
    const observers = new Set<Observer>()
    let turnGeneration = 0
    let serial = 0,
      cohort = 0,
      active = false,
      drained = false
    let last: GtkContactFrame | null = null
    const controller = new Gtk.EventControllerLegacy()
    controller.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    const notify = (frame: GtkContactFrame) => {
      const identity = String(++serial)
      for (const listener of Array.from(observers)) {
        if (observers.has(listener)) {
          listener(frame, identity)
        }
      }
    }
    const cancel = () => {
      if (!active || !last) {
        return
      }
      active = false
      drained = true
      notify({ ...last, type: 'cancel', contacts: [] })
    }
    const eventId = controller.connect('event', (_controller: unknown, event: Gdk.Event) => {
      // Popovers own another Gdk surface. Their events also pass ancestors;
      // never interpret those coordinates in the containing window's plane.
      if (event.get_surface() !== root.get_surface()) {
        return false
      }
      const type = event.get_event_type()
      if (type === Gdk.EventType.GRAB_BROKEN) {
        cancel()
        return false
      }
      const source = event.get_device()?.get_source()
      if (source !== Gdk.InputSource.MOUSE && source !== Gdk.InputSource.TOUCHPAD) {
        return false
      }
      const down = type === Gdk.EventType.BUTTON_PRESS,
        up = type === Gdk.EventType.BUTTON_RELEASE
      if (!down && !up && type !== Gdk.EventType.MOTION_NOTIFY) {
        return false
      }
      if ((down || up) && event.get_button?.() !== 1) {
        return false
      }
      // Mouse emulation of touch must never become a second physical contact.
      if (event.get_pointer_emulated()) {
        return false
      }
      const [ok, x, y] = event.get_position()
      if (!ok || !Number.isFinite(x) || !Number.isFinite(y)) {
        cancel()
        return false
      }
      if (down) {
        active = true
        drained = false
        cohort++
      }
      if (
        active &&
        type === Gdk.EventType.MOTION_NOTIFY &&
        !(event.get_modifier_state() & Gdk.ModifierType.BUTTON1_MASK)
      ) {
        cancel()
        return false
      }
      if (!active || drained) {
        if (up) {
          drained = false
        }
        return false
      }
      pointerTurns.add(window)
      const turn = ++turnGeneration
      Promise.resolve().then(() => {
        if (turnGeneration === turn) {
          pointerTurns.delete(window)
        }
      })
      const [surfaceX, surfaceY] = root.get_surface_transform()
      const point = { x: x + surfaceX, y: y + surfaceY }
      let path = last?.hitPath ?? []
      let nativeOwned = last?.nativeOwned ?? false
      if (down) {
        const hit = root.pick(point.x, point.y, 0)
        const next: Gtk.Widget[] = []
        for (let node = hit; node; node = node.get_parent()) {
          next.push(node)
        }
        path = next
        nativeOwned = next.some(
          (node) =>
            node instanceof Gtk.Editable ||
            node instanceof Gtk.TextView ||
            node instanceof Gtk.Range ||
            node instanceof Gtk.Scrollbar ||
            node instanceof Gtk.Switch ||
            node instanceof Gtk.DropDown ||
            node instanceof Gtk.SpinButton ||
            node instanceof Gtk.CheckButton ||
            (node instanceof Gtk.Label && node.selectable),
        )
      }
      const changed: Contact = { id: String(cohort), kind: 'mouse', window: point, screen: null }
      last = {
        type: down ? 'down' : up ? 'up' : 'move',
        cohort: String(cohort),
        time: GLib.get_monotonic_time() / 1000,
        changed,
        contacts: up ? [] : [changed],
        hitPath: path,
        nativeOwned,
        nativeBoundary: path.find(
          (node) =>
            node instanceof Gtk.Widget &&
            [Gtk.AccessibleRole.SLIDER, Gtk.AccessibleRole.SPIN_BUTTON].includes(
              node.get_accessible_role(),
            ),
        ),
      }
      if (up) {
        active = false
      }
      notify(last)
      return false
    })
    root.add_controller(controller)
    const activeId = window.connect('notify::is-active', () => {
      const value = window.is_active
      const active = typeof value === 'function' ? value.call(window) : value
      if (!active) {
        cancel()
      }
    })
    const unmapId = root.connect('unmap', cancel)
    input = {
      observers,
      claim() {
        if (!active || !last || last.nativeOwned) {
          return false
        }
        // Cancel only pending tracking on the original hit path. Never disable
        // widgets, change focus or consume keyboard/accessibility activation.
        for (const host of last.hitPath) {
          if (!(host instanceof Gtk.Widget)) {
            continue
          }
          const controllers = host.observe_controllers()
          for (let i = 0; i < controllers.get_n_items(); i++) {
            const gesture = controllers.get_item(i)
            if (gesture instanceof Gtk.Gesture) {
              gesture.reset()
            }
          }
        }
        return true
      },
      dispose() {
        try {
          cancel()
        } finally {
          try {
            window.disconnect(activeId)
          } finally {
            try {
              root.disconnect(unmapId)
            } finally {
              try {
                controller.disconnect(eventId)
              } finally {
                root.remove_controller(controller)
              }
            }
          }
        }
      },
    }
    windows.set(root, input)
  }
  const current = input
  current.observers.add(observer)
  let alive = true
  return () => {
    if (!alive) {
      return
    }
    alive = false
    current.observers.delete(observer)
    if (!current.observers.size) {
      windows.delete(root)
      current.dispose()
    }
  }
}
