import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
export const stats = { callbacks: 0, released: 0, nodes: 0 }
export const api = {
  init: () => Gtk.init(),
  window: () =>
    new Gtk.Window({
      title: 'Octane runtime evaluation',
      default_width: 480,
      default_height: 80,
      decorated: false,
    }),
  create(type) {
    stats.nodes++
    if (type === 'host') {
      return new Gtk.Box({ orientation: 1 })
    }
    if (type === 'masonview') {
      return new Gtk.Box({ orientation: 0, spacing: 0 })
    }
    if (type === 'label') {
      return new Gtk.Label()
    }
    if (type === 'button') {
      return new Gtk.Button()
    }
    if (type === 'textfield') {
      return new Gtk.Entry()
    }
    throw Error(type)
  },
  setText(type, p, text) {
    if (type === 'textfield') {
      const pos = p.get_position()
      p.set_text(text)
      p.set_position(pos)
    } else {
      p.set_label(text)
    }
  },
  text: (type, p) => (type === 'textfield' ? p.get_text() : p.get_label()),
  attach(parent, child, before) {
    child.set_size_request(120, 60)
    child.insert_before(parent, before)
  },
  detach: (p) => {
    if (p.get_parent()) {
      p.unparent()
    }
  },
  connect(p, signal, callback) {
    const id = p.connect(signal, callback)
    stats.callbacks++
    return () => {
      p.disconnect(id)
      stats.callbacks--
    }
  },
  destroy() {
    stats.nodes--
  },
  show: (win, child) => {
    win.set_child(child)
    win.present()
  },
  close: (win) => win.destroy(),
  bounds: (p) => {
    const a = p.get_allocation()
    return { x: a.x, y: a.y, width: a.width, height: a.height }
  },
  deferEvent: (fn) =>
    GLib.idle_add(0, () => {
      fn()
      return false
    }),
  cancelEvent: (id) => GLib.source_remove(id),
  emitClick: (p) => p.emit('clicked'),
  focus: (p) => p.grab_focus(),
  now: () => GLib.get_monotonic_time() / 1000,
  pause: (ms) =>
    new Promise((resolve) =>
      GLib.timeout_add(0, ms, () => {
        resolve()
        return false
      }),
    ),
  run(task) {
    const loop = GLib.MainLoop.new(null, false)
    let error
    task().then(
      () => loop.quit(),
      (e) => {
        error = e
        loop.quit()
      },
    )
    loop.run()
    if (error) {
      throw error
    }
  },
}
