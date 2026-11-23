import GLib from 'gi://GLib'
import Gio from 'gi://Gio'

import Gtk from 'gi://Gtk?version=4.0'
import { Application, ViewBase } from '@nativescript/core'
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { hmrUniversalComponent, UNIVERSAL_HMR, type GtkRoot } from '@octane-xplat/linux-gtk'
import { First, Updated } from './core-app.gtk'

const nextTurn = () => new Promise<void>((resolve) => setTimeout(resolve, 30))
let checks = 0
function check(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(message)
  }
  checks++
}

let mountCleanup = 0
let result = 1

const status = runGtkApp(
  { applicationId: 'dev.xplat.GtkCoreTest', flags: Gio.ApplicationFlags.NON_UNIQUE },
  ({ app, content, root, container }) => {
    let loaded = 0
    const panStates: string[] = []
    // The compiler brands these components at runtime.
    const live = hmrUniversalComponent(root.renderer, First as never)
    root.render(live as unknown as Parameters<GtkRoot['render']>[0], {
      onLoaded: () => loaded++,
      onPan(event: { state: string }) {
        panStates.push(event.state)
      },
    })
    const find = (id: string) => [...container.nodes.values()].find((node) => node.props.id === id)

    void (async () => {
      await nextTurn()
      check(root.renderer === 'nativescript', 'expected the shared renderer')
      check(Application.getRootView() instanceof ViewBase, 'GTK application owns a Core view')
      const button = find('button')?.view
      const entry = find('entry')?.view
      const value = find('value')?.view
      const toggle = find('switch')?.view
      const row = find('row')?.view
      check(button instanceof Gtk.Button && entry instanceof Gtk.Entry, 'expected native controls')
      check(
        value instanceof Gtk.Label && toggle instanceof Gtk.Switch,
        'expected native label and switch',
      )
      check(row && button.get_parent() === row, 'expected GTK parent')
      const nativeMason = row.constructor.$gtype?.name === 'XplatMasonView'
      check(nativeMason, 'expected native Mason')
      check(loaded === 1, 'Core loaded fired once')
      check(button.get_label() === 'first:0', 'initial mixed text')
      const deadline = GLib.get_monotonic_time() + 3_000_000
      while (button.get_width() <= 0 || entry.get_width() <= 0) {
        check(GLib.get_monotonic_time() < deadline, 'GTK allocated controls')
        await nextTurn()
      }
      if (nativeMason) {
        const [measured, bounds] = entry.compute_bounds(row)
        check(measured && bounds.get_x() >= button.get_width() + 10, 'Mason applied horizontal gap')
      }

      const controllers = row.observe_controllers()
      const drag = Array.from({ length: controllers.get_n_items() }, (_, i) =>
        controllers.get_item(i),
      ).find((controller) => controller instanceof Gtk.GestureDrag)
      check(drag, 'GTK installed the pan controller')
      drag.emit('drag-begin', 0, 0)
      drag.emit('drag-update', 10, 3)
      drag.emit('drag-end', 10, 3)
      check(panStates.join(',') === 'began,moved,ended', 'Core routed GTK gesture payloads')

      button.emit('clicked')
      entry.set_text('edited')
      await nextTurn()
      check(button.get_label() === 'first:1', 'GTK clicked updates Octane state')
      check(value.get_text() === 'edited', 'GTK entry signal updates Octane state')
      check(toggle.get_active(), 'GTK switch receives updated prop')

      live[UNIVERSAL_HMR].update(Updated as never)
      await nextTurn()
      check(
        find('button')?.view === button && find('entry')?.view === entry,
        'HMR retained GTK widgets',
      )
      check(button.get_label() === 'updated:1', 'HMR rendered new code with the previous state')
      check(entry.get_text() === 'edited', 'HMR retained entry text')
      check(loaded === 1, 'HMR preserved the Core load lifetime')

      root.unmount()
      check(
        container.nodes.size === 0 && content.get_first_child() === null,
        'root released widget tree',
      )
      check(button.get_parent() === null, 'button detached')
      button.emit('clicked')
      result = 0
    })()
      .catch(console.error)
      .finally(() => app.quit())
    return () => {
      mountCleanup++
    }
  },
)

check(mountCleanup === 1, 'GTK host cleanup fired once')
check(!Application.getRootView(), 'GTK shutdown clears the Core app root')
if (status || result) {
  imports.system.exit(status || result)
}
print('GTK_CORE_OK ' + JSON.stringify({ checks, osInput: false }))
