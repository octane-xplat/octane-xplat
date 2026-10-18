// Headless mount check: create the GTK root over a bare Gtk.Box, render the
// fixture App, and print the realized widget hierarchy as JSON lines. No
// GtkApplication, no window — widget construction is enough to prove the
// driver creates, orders, and attaches real widgets.
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { App } from './App.gtk'

// Bare-widget construction needs an initialized display — the runGtkApp
// path gets this free from GtkApplication.
Gtk.init()

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const { root } = createGtkRoot(host)
root.render(App, {})

const seen: string[] = []
const all: Gtk.Widget[] = []
const walk = (w: Gtk.Widget | null, depth: number) => {
	while (w) {
		all.push(w)
		seen.push(`${'  '.repeat(depth)}${w.constructor.$gtype.name}`)
		walk(w.get_first_child(), depth + 1)
		w = w.get_next_sibling()
	}
}
walk(host, 0)
print(JSON.stringify(seen, null, 0))

// Event + reconciliation check: pressing the button runs onPress → setState →
// the label text folds to "Count: 1".
const button = all.find((w) => w.constructor.$gtype.name === 'GtkButton')
button?.emit('clicked')
// The octane re-render flushes through a Promise microtask — drain the main
// loop once so it lands before reading the label.
const loop = GLib.MainLoop.new(null, false)
GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
	loop.quit()
	return false
})
loop.run()
const label = all.find((w) => w.constructor.$gtype.name === 'GtkLabel')
print(JSON.stringify({ buttonPressed: !!button, labelText: (label as any)?.label ?? null }))
