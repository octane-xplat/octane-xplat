import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { SharedGestures } from './ui-shared-gestures.gtk.tsrx'
Gtk.init()
const window = new Gtk.Window({
  title: 'solid-birch-shared-gestures',
  default_width: 500,
  default_height: 320,
  decorated: false,
})
const other = new Gtk.Window({
  title: 'solid-birch-gesture-interruption',
  default_width: 100,
  default_height: 100,
})
other.present()
const host = new Gtk.Box()
window.set_child(host)
const { root, container } = createGtkRoot(host, {
  onUncaughtError(error) {
    console.error('GESTURE_ERROR', String(error))
  },
})
root.render(SharedGestures, {
  report(kind: string, detail?: unknown) {
    print('SHARED_GESTURE ' + JSON.stringify({ kind, detail }))
  },
})
window.present()
GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
  const button = [...container.nodes.values()].find(
    (node) => node.props.id === 'shared-button',
  )?.view
  if (!button || button.get_width() < 1) {
    return true
  }
  const [ok, bounds] = button.compute_bounds(window)
  if (!ok) {
    return true
  }
  print('SHARED_READY ' + JSON.stringify({ x: bounds.origin.x + 30, y: bounds.origin.y + 30 }))
  return false
})
const loop = GLib.MainLoop.new(null, false)
GLib.timeout_add(GLib.PRIORITY_DEFAULT, 12000, () => {
  const button = [...container.nodes.values()].find(
    (node) => node.props.id === 'shared-button',
  )?.view
  print(
    'SHARED_FOCUS ' +
      JSON.stringify({
        focusable: button?.get_focusable(),
        focused: button?.has_focus,
        role: button?.get_accessible_role(),
        controllers: button?.observe_controllers().get_n_items(),
      }),
  )
  root.unmount()
  other.destroy()
  window.destroy()
  loop.quit()
  return false
})
loop.run()
