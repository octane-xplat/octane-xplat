// GJS parity entry: same screen as main.mjs through the shipping GI path —
// emits the identical ready-frame contract for cross-runtime comparison.
// Run under `gjs -m` with XPLAT_MASON_TYPELIB + LD_LIBRARY_PATH pointing at
// the facade artifacts.
import Gtk from 'gi://Gtk?version=4.0'
import GObject from 'gi://GObject'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PortScreen, portState } from './screen.gtk.tsx'

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const check = (name, ok, detail) => {
  console.log(JSON.stringify({ check: name, pass: !!ok, detail }))
  if (!ok) {
    throw Error(name)
  }
}
const wait = async (fn, ms = 8000) => {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > ms) {
      throw Error(`wait timed out: ${JSON.stringify(portState)}`)
    }
    await pause(10)
  }
}
const nodeById = (container, id) =>
  [...container.nodes.values()].find((node) => node.props?.id === id)
const widgetOf = (node) => node?.layoutView ?? node?.view
const frame = (widget, target) => {
  const [ok, rect] = widget.compute_bounds(target)
  if (!ok) {
    throw Error('gtk_widget_compute_bounds failed')
  }
  const origin = rect.origin ?? rect
  const size = rect.size ?? rect
  return {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
    width: Math.round(size.width),
    height: Math.round(size.height),
  }
}

Gtk.init()
const win = new Gtk.Window({
  title: 'Octane runtime evaluation',
  default_width: 480,
  default_height: 320,
  decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
win.set_child(host)
const mounted = createGtkRoot(host)
mounted.root.render(PortScreen, {})
win.present()

await pause(150)
const layout = widgetOf(nodeById(mounted.container, 'layout'))
const counterNode = nodeById(mounted.container, 'counter')
const entry = widgetOf(nodeById(mounted.container, 'entry'))
const textview = nodeById(mounted.container, 'multiline')?.view
check('probe-widgets-present', layout && counterNode?.view && entry && textview, {
  ids: [...mounted.container.nodes.values()].map((n) => n.props?.id),
})
let layoutType
try {
  layoutType = GObject.type_name(layout.constructor.$gtype)
} catch {
  layoutType = layout.constructor?.name
}
check('mason-mode', layoutType === 'XplatMasonView', layoutType)
const frames = [
  { id: 'layout', ...frame(layout, win) },
  { id: 'increment', ...frame(widgetOf(nodeById(mounted.container, 'increment')), layout) },
  { id: 'entry', ...frame(entry, layout) },
  { id: 'multiline', ...frame(widgetOf(nodeById(mounted.container, 'multiline')), layout) },
]
console.log(JSON.stringify({ ready: true, frames }))
await wait(() => portState.count === 1 && portState.text === 'ABC' && portState.multiline === 'de')
check('counter-label-text', counterNode.view.get_label?.() === 'Count: 1', portState)
check('controlled-entry-uppercase', entry.get_text() === 'ABC', portState)
check('entry-caret-at-end', entry.get_position() === 3, entry.get_position())
check('controlled-write-no-echo', portState.changes === 3, portState)
check('multiline-buffer-text', textview.get_text() === 'de', textview.get_text())
check(
  'stable-counter-identity',
  nodeById(mounted.container, 'counter') === counterNode &&
    nodeById(mounted.container, 'counter').view === counterNode.view,
)
mounted.root.unmount()
await pause(50)
win.destroy()
console.log(JSON.stringify({ complete: true }))
