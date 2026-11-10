// Headless #229 regression: root.unmount() must undo wireContainerWindow —
// window and surface signal handlers disconnect, the window's key/legacy
// controllers come off, the pre-window notify::root watch disconnects, and
// the container fields clear. Prints one GTK_ROOT_TEARDOWN summary.
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { App } from './App.gtk'

Gtk.init()

let checks = 0
const check = (ok: boolean, label: string) => {
  checks++
  if (!ok) {
    throw Error(`root-teardown check failed: ${label}`)
  }
}
const pause = () => {
  let done = false

  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
    done = true
    return GLib.SOURCE_REMOVE
  })
  while (!done) {
    GLib.MainContext.default().iteration(true)
  }
}

// Windowed host: five mount/unmount cycles into the same window must leave
// the window exactly as it found it each time.
const win = new Gtk.Window({ title: 'root teardown' })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })

win.set_child(host)
win.present()
pause()

const baseline = win.observe_controllers().get_n_items()

for (let i = 0; i < 5; i++) {
  const { root, container } = createGtkRoot(host)

  root.render(App, {})
  pause()

  const pairs = container.windowConnections ?? []

  check(
    win.observe_controllers().get_n_items() === baseline + 3,
    `cycle ${i}: window carries the root's 3 added controllers`,
  )
  check(pairs.length > 0, `cycle ${i}: windowConnections recorded`)
  check(
    pairs.some(([emitter]) => emitter instanceof Gdk.Surface),
    `cycle ${i}: surface layout watch recorded`,
  )
  check(
    pairs.every(([emitter, id]) => GObject.signal_handler_is_connected(emitter, id)),
    `cycle ${i}: every windowConnections handler is live`,
  )

  root.unmount()
  pause()

  check(
    win.observe_controllers().get_n_items() === baseline,
    `cycle ${i}: controllers back to the window's baseline`,
  )
  check(
    pairs.every(([emitter, id]) => !GObject.signal_handler_is_connected(emitter, id)),
    `cycle ${i}: every windowConnections handler is disconnected`,
  )
  check(
    container.windowConnections === undefined &&
      container.modalityControllers === undefined &&
      container.layerKeyController === undefined &&
      container.rootSignalId === undefined,
    `cycle ${i}: container wiring fields cleared`,
  )
}

// Pre-window host: wiring waits on notify::root; unmount must remove that
// watch too, so a later window attachment cannot rewire a dead container.
const host2 = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const pre = createGtkRoot(host2)

pre.root.render(App, {})
pause()

const watchId = pre.container.rootSignalId

check(
  typeof watchId === 'number' && GObject.signal_handler_is_connected(host2, watchId),
  'pre-window: notify::root watch connected on the host',
)

pre.root.unmount()
pause()

check(
  !GObject.signal_handler_is_connected(host2, watchId),
  'pre-window: notify::root watch disconnected after unmount',
)
check(pre.container.rootSignalId === undefined, 'pre-window: rootSignalId cleared')

const win2 = new Gtk.Window({ title: 'root teardown late' })
const base2 = win2.observe_controllers().get_n_items()

win2.set_child(host2)
win2.present()
pause()

check(
  win2.observe_controllers().get_n_items() === base2,
  'pre-window: attaching the host to a window after unmount adds no wiring',
)

win.destroy()
win2.destroy()

print(
  `GTK_ROOT_TEARDOWN ${JSON.stringify({
    checks,
    gtk: `${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`,
    engine: 'gjs',
  })}`,
)
