// Real driver operations, observed independently over AT-SPI by atspi-check.py.
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'

Gtk.init()
const window = new Gtk.Window({ title: 'Xplat AT-SPI regression' })
const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(box)
const container = createGtkContainer(box)
const apply = (commands: UniversalHostCommand[]) =>
	gtkDriver.prepareBatch(container, { renderer: 'gtk', commands }).apply()

const cmd = (op: string, id: number, extra: Record<string, unknown> = {}) =>
	({ op, id, ...extra }) as UniversalHostCommand

apply([
	cmd('create', 1, {
		type: 'button',
		props: { accessibilityLabel: 'Save draft', text: 'Save', testID: 'save-id' },
	}),
	cmd('insert', 1, { parent: null, before: null }),
	cmd('create', 2, {
		type: 'label',
		props: { accessibilityLabel: 'Build status: passing', text: 'OK' },
	}),
	cmd('insert', 2, { parent: null, before: null }),
])

window.present()
const loop = new GLib.MainLoop(null, false)
GLib.timeout_add(0, 4000, () => {
	apply([
		cmd('update', 1, {
			props: { text: 'Changed', testID: 'save-id', accessibilityLabel: 'Save final' },
		}),
		cmd('update', 2, { props: { accessibilityLabel: 'Build status: passing', text: 'Still OK' } }),
	])
	return false
})

GLib.timeout_add(0, 8000, () => {
	apply([
		cmd('update', 1, { props: { text: 'Changed', testID: 'save-id' } }),
		cmd('update', 2, { props: { text: 'Still OK' } }),
	])
	return false
})

GLib.timeout_add(0, 12000, () => {
	apply([cmd('destroy', 1), cmd('destroy', 2)])
	window.destroy()
	loop.quit()
	return false
})

loop.run()
