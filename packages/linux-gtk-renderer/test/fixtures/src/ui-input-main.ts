import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Input } from './ui-input.gtk.tsrx'
import './ui-input.css'

Gtk.init()

const window = new Gtk.Window({
  title: 'Octane GTK input test',
  default_width: 240,
  default_height: 180,
  decorated: false,
})

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })

window.set_child(host)

const { root, container } = createGtkRoot(host, {
  onUncaughtError(error) {
    throw error
  },
})

const loop = GLib.MainLoop.new(null, false)
let pressed = false
let complete = false
const events: Record<string, unknown>[] = []
let size: { width: number; height: number } | undefined
const timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, () => {
  console.error('OS input timeout')
  loop.quit()
  return false
})

root.render(Input, {
  report(kind: string, detail?: any) {
    const event = { kind, ...detail }
    events.push(event)
    print('GTK_UI_INPUT ' + JSON.stringify(event))
    if (kind === 'press') {
      pressed = true
    }

    if (
      kind === 'pan' &&
      detail.state === 'ended' &&
      (Math.abs(detail.x) >= 40 || Math.abs(detail.y) >= 20) &&
      pressed
    ) {
      complete = true
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        root.unmount()
        window.destroy()
        loop.quit()
        return false
      })
    }
  },
})

window.present()
GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
  const target = [...container.nodes.values()].find((n) => n.props.id === 'input-target')?.view

  if (!target || target.get_width() < 100) {
    return true
  }

  size = { width: target.get_width(), height: target.get_height() }
  print('GTK_UI_INPUT_READY ' + JSON.stringify(size))

  return false
})

loop.run()
if (complete) {
  GLib.source_remove(timeout)
}

if (!complete) {
  throw new Error('Real pointer click and drag were not received')
}
print('GTK_UI_INPUT_RESULT ' + JSON.stringify({ size, events, osInput: true }))
