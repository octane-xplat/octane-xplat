import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import System from 'system'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { runDesktopCases } from './desktop-cases.mjs'

globalThis.setTimeout = (callback, ms = 0, ...args) =>
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, Math.max(1, ms), () => {
    callback(...args)
    return false
  })
globalThis.clearTimeout = (id) => GLib.source_remove(id)
Gtk.init()

const window = new Gtk.Window({
  title: 'layout-defaults-qualification',
  default_width: 900,
  default_height: 900,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
window.present()
let root, container
const findNode = (node, id) => {
  if (node.props?.id === id && node.view) return node.view
  for (const child of node.children ?? []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}
// Overlay content can belong to another logical root. Search its actual GTK
// widget tree too, just as the NativeScript adapter searches the native Page.
const findWidget = (widget, id) => {
  if (widget.get_name() === id) return widget
  for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
    const found = findWidget(child, id)
    if (found) return found
  }
  return null
}
const find = (id) => {
  for (const node of container?.children ?? []) {
    const found = findNode(node, id)
    if (found) return found
  }
  return findWidget(window, id)
}
const loop = GLib.MainLoop.new(null, false)
GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
  runDesktopCases(
    {
      host,
      identity: 'GTK4/GJS',
      interaction: 'numeric-geometry-and-programmatic-scroll',
      mount(Component, props) {
        root?.unmount()
        ;({ root, container } = createGtkRoot(host, {
          onUncaughtError(error) {
            throw error
          },
        }))
        root.render(Component, props)
      },
      find,
      inspect(id) {
        const view = find(id)
        if (!view) throw Error('Missing view ' + id)
        if (
          id === 'block-second' &&
          GObject.type_name(view.constructor.$gtype) !== 'XplatMasonView'
        )
          throw Error('Real XplatMasonView is required')
        const [ok, bounds] = view.compute_bounds(window)
        return {
          text: String(view.text ?? ''),
          value: String(view.text ?? ''),
          frame: ok
            ? {
                x: bounds.origin.x,
                y: bounds.origin.y,
                width: bounds.size.width,
                height: bounds.size.height,
              }
            : null,
        }
      },
      dispose() {
        root?.unmount()
      },
    },
    'linux',
    (result) => print('[xplat-probe] ' + JSON.stringify(result)),
  )
    .then((pass) => {
      window.destroy()
      loop.quit()
      System.exit(pass ? 0 : 1)
    })
    .catch((error) => {
      printerr(String(error) + '\n' + (error.stack ?? ''))
      window.destroy()
      loop.quit()
      System.exit(1)
    })
  return false
})
loop.run()
