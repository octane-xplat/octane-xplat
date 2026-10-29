import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { ToggleControls, changes } from './ui-toggle-controls.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK toggle controls test',
	default_width: 400,
	default_height: 350,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const errors: unknown[] = []
const { root, container } = createGtkRoot(host, { onUncaughtError: (error) => errors.push(error) })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 160) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0,
	ack = 0
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const controller = (view: any) => {
	const all = view.observe_controllers()
	for (let i = 0; i < all.get_n_items(); i++)
		if (all.get_item(i) instanceof Gtk.EventControllerKey) return all.get_item(i)
	throw new Error('no toggle keyboard controller')
}
const down = (view: any, key = Gdk.KEY_space) => controller(view).emit('key-pressed', key, 0, 0)
const up = (view: any, key = Gdk.KEY_space) => controller(view).emit('key-released', key, 0, 0)
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: any, key: number) => {
	if (key === Gdk.KEY_F12) {
		ack++
		return true
	}
	return false
})
window.add_controller(keys)
async function phase(name: string) {
	const next = ack + 1
	print('GTK_TOGGLE_CONTROLS_READY ' + JSON.stringify({ phase: name }))
	for (let i = 0; i < 250 && ack < next; i++) await pause(20)
	check('OS phase completed ' + name, ack >= next)
	await pause()
}
let osInput = false
async function run() {
	root.render(ToggleControls, {})
	window.present()
	await pause(250)
	const checkbox = node('toggle-checkbox').view!
	const mixed = node('toggle-mixed').view!
	const toggle = node('toggle-switch').view!
	const peer = node('toggle-peer').view!
	const native = (globalThis as any).imports.gi.XplatMason
	const checked = (view: any, state: number) =>
		native.test_accessible_state(view, Gtk.AccessibleState.CHECKED, state) === null
	check('checkbox role reaches GTK', checkbox.get_accessible_role() === Gtk.AccessibleRole.CHECKBOX)
	check('switch role reaches GTK', toggle.get_accessible_role() === Gtk.AccessibleRole.SWITCH)
	check('checkbox accepts keyboard focus', checkbox.get_focusable() && checkbox.focus())
	await pause()
	check('checkbox owns actual GTK focus', window.get_focus() === checkbox)
	check('checkbox consumes Space down', down(checkbox) === true)
	down(checkbox)
	check('held/repeated Space does not commit a change', changes.length === 0)
	up(checkbox)
	await pause()
	check(
		'Space release changes checkbox once',
		changes.length === 1 && changes[0][0] === 'checkbox' && changes[0][1] === true,
	)
	check(
		'uncontrolled checkbox exposes its checked state',
		checked(checkbox, Gtk.AccessibleTristate.TRUE),
	)
	check('checkbox leaves Return to its containing form', down(checkbox, Gdk.KEY_Return) === false)
	up(checkbox, Gdk.KEY_Return)
	check('Return does not toggle checkbox', changes.length === 1)
	down(checkbox)
	up(checkbox)
	await pause()
	check(
		'second Space restores unchecked value',
		changes.length === 2 &&
			changes[1][1] === false &&
			checked(checkbox, Gtk.AccessibleTristate.FALSE),
	)
	check('switch accepts keyboard focus', toggle.get_focusable() && toggle.focus())
	await pause()
	check('switch owns actual GTK focus', window.get_focus() === toggle)
	check('switch consumes Space down', down(toggle) === true)
	up(toggle)
	await pause()
	check(
		'Space release changes switch once',
		changes.length === 3 && changes[2][0] === 'switch' && changes[2][1] === true,
	)
	check('uncontrolled switch exposes checked state', checked(toggle, Gtk.AccessibleTristate.TRUE))
	check('mixed checkbox exposes native mixed state', checked(mixed, Gtk.AccessibleTristate.MIXED))
	mixed.focus()
	await pause()
	down(mixed)
	up(mixed)
	await pause()
	check(
		'mixed selection requests true once',
		changes.length === 4 && changes[3][0] === 'mixed' && changes[3][1] === true,
	)
	check(
		'controlled mixed checkbox retains owner value',
		checked(mixed, Gtk.AccessibleTristate.MIXED),
	)
	root.render(ToggleControls, { readOnly: true })
	await pause()
	checkbox.focus()
	await pause()
	down(checkbox)
	up(checkbox)
	toggle.focus()
	await pause()
	down(toggle)
	up(toggle)
	await pause()
	check('read-only controls remove activation callbacks', changes.length === 4)
	check(
		'state updates retain both native control hosts',
		node('toggle-checkbox').view === checkbox && node('toggle-switch').view === toggle,
	)
	root.render(ToggleControls, {})
	await pause()
	if (GLib.getenv('GTK_TOGGLE_CONTROLS_OS') === '1') {
		osInput = true
		peer.focus()
		await pause()
		await phase('tab')
		check('OS Tab enters the first toggle', window.get_focus() === checkbox)
		await phase('space')
		check(
			'OS Space commits one checkbox change',
			changes.length === 5 && changes[4][0] === 'checkbox' && changes[4][1] === true,
		)
		await phase('return')
		check('OS Return does not toggle checkbox', changes.length === 5)
		mixed.focus()
		await pause()
		await phase('space')
		check(
			'OS Space requests mixed-to-true without changing owner value',
			changes.length === 6 &&
				changes[5][0] === 'mixed' &&
				checked(mixed, Gtk.AccessibleTristate.MIXED),
		)
		toggle.focus()
		await pause()
		await phase('space')
		check(
			'OS Space changes the switch once',
			changes.length === 7 && changes[6][0] === 'switch' && changes[6][1] === false,
		)
	}
	check('input completes without effect errors', errors.length === 0)
	checkbox.focus()
	await pause()
	down(checkbox)
	const oldController = controller(checkbox)
	const count = changes.length
	const retired = node('toggle-checkbox')
	root.unmount()
	oldController.emit('key-released', Gdk.KEY_space, 0, 0)
	check(
		'unmount clears the native host and node',
		host.get_first_child() == null && retired.destroyed,
	)
	check('retired key controller cannot activate a control', changes.length === count)
	window.destroy()
	print(
		'GTK_TOGGLE_CONTROLS ' +
			JSON.stringify({
				checks,
				osInput,
				gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
			}),
	)
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	console.error(error)
	try {
		root.unmount()
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) (globalThis as any).imports.system.exit(1)
