import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import System from 'system'
import { createShortcuts } from '../../src/index.gtk.ts'

Gtk.init()
const loop = new GLib.MainLoop(null, false)
const window = new Gtk.Window({ title: 'XplatShortcuts', default_width: 240, default_height: 120 })
const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const button = new Gtk.Button({ label: 'Shortcut target' })
box.append(button)
window.set_child(box)
window.present()
button.grab_focus()
const shortcuts = createShortcuts({ target: box })
const calls = []
shortcuts.setContext('editor.ready', true)
shortcuts.bind({
	combo: 'Mod+KeyK',
	when: 'editor.ready',
	preventDefault: true,
	handler: () => calls.push('palette'),
})
shortcuts.bind({ sequence: 'g i', handler: () => calls.push('inbox') })
let recording
shortcuts.bind({
	combo: 'F2',
	handler() {
		shortcuts.record({ timeout: 250, consumeEvents: true }).finished.then((result) => {
			recording = result.expression
			print('RECORDING-DONE')
		})
	},
})
let passed = false
shortcuts.bind({
	combo: 'F12',
	handler() {
		if (calls.join(',') !== 'palette,inbox' || recording !== 'Ctrl+Shift+x') {
			printerr(JSON.stringify({ calls, recording }))
		} else {
			passed = true
			print('PASS GTK native input, physical keys, when, sequence, recording')
		}
		shortcuts.dispose()
		window.destroy()
		loop.quit()
	},
})
GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 12, () => {
	loop.quit()
	return GLib.SOURCE_REMOVE
})
loop.run()
System.exit(passed ? 0 : 1)
