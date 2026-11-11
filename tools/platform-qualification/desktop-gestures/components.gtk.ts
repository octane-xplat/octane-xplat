import { readScene } from './scene'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { Components, scene } from './components.tsrx'

declare function print(message: string): void

Gtk.init()

const window = new Gtk.Window({
  title: 'octane-packed-gestures',
  default_width: 640,
  default_height: 600,
  decorated: false,
})

const other = new Gtk.Window({
  title: 'octane-packed-interruption',
  default_width: 100,
  default_height: 100,
})

other.present()

const box = new Gtk.Box()

window.set_child(box)

const { root } = createGtkRoot(box, {
  onUncaughtError(error) {
    throw error
  },
})

const report = (kind: string, detail?: unknown) =>
  print('DESKTOP ' + JSON.stringify({ kind, detail }))

root.render(Components, { report })
window.present()

const bounds = (view: unknown) => {
  if (!(view instanceof Gtk.Widget)) {
    throw new Error('Expected a GTK widget')
  }

  const [ok, rect] = view.compute_bounds(window)

  if (!ok) {
    throw new Error('Unmeasurable qualification host')
  }

  return { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height }
}

const loop = GLib.MainLoop.new(null, false)

function sliderHost(view: Gtk.Widget): Gtk.Widget | null {
  if (view.get_accessible_role() === Gtk.AccessibleRole.SLIDER) {
    return view
  }

  for (let child = view.get_first_child(); child; child = child.get_next_sibling()) {
    const slider = sliderHost(child)

    if (slider) {
      return slider
    }
  }

  return null
}

GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
  if (!scene.motion || !scene.scroll || !scene.field) {
    return true
  }

  const hosts = readScene((host): host is Gtk.Widget => host instanceof Gtk.Widget)

  if (hosts.motion.get_width() < 1) {
    return true
  }

  const engine = GObject.type_name(Reflect.get(hosts.motion.constructor, '$gtype'))

  if (engine !== 'XplatMasonView') {
    throw new Error('Qualification requires Mason, not Gtk.Box fallback: ' + engine)
  }

  report('ready', {
    button: bounds(hosts.button),
    motion: bounds(hosts.motion),
    panel: bounds(hosts.panel),
    field: bounds(hosts.field.native),
    slider: bounds(sliderHost(hosts.slider)),
    scroll: bounds(hosts.scroll.native),
    engine,
  })

  return false
})

GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
  if (scene.motion && scene.scroll) {
    const hosts = readScene((host): host is Gtk.Widget => host instanceof Gtk.Widget)
    const viewport = hosts.scroll.native

    if (!(viewport instanceof Gtk.ScrolledWindow)) {
      throw new Error('Expected a GTK scroll viewport')
    }

    report('geometry', {
      motion: bounds(hosts.motion),
      x: Reflect.get(hosts.motion, 'translateX'),
      block: viewport.get_vadjustment().get_value(),
      text:
        typeof hosts.field.native === 'object' && hosts.field.native
          ? Reflect.get(hosts.field.native, 'text')
          : null,
    })
  }

  return true
})

GLib.timeout_add(GLib.PRIORITY_DEFAULT, 18000, () => {
  root.unmount()
  report('retired', {
    motion: scene.motion,
    button: scene.button,
    scroll: scene.scroll,
    field: scene.field,
  })

  other.destroy()
  window.destroy()
  loop.quit()
  return false
})

loop.run()
