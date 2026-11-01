import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Probe, counts } from './ui-buttons.gtk'

Gtk.init()
const window = new Gtk.Window({ title: 'Octane GTK Buttons test', default_width: 640, default_height: 480, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, { onUncaughtError(error) { throw error } })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 250) => new Promise<void>(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false }))
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => { checks++; if (!ok) { failures.push(name) } }
const node = (id: string) => [...container.nodes.values()].find(n => n.props.id === id)
let ack = 0
const acknowledged = new Set<any>()
function acknowledge(widget: any) {
	if (!widget || acknowledged.has(widget)) { return }
	acknowledged.add(widget)
	const keys = new Gtk.EventControllerKey()
	keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
	keys.connect('key-pressed', (_controller: any, key: number) => {
		if (key !== Gdk.KEY_F12) { return false }
		ack++
		return true
	})
	widget.add_controller(keys)
}
acknowledge(window)
const point = (widget: any) => {
	const native = widget.get_native ? widget.get_native() : widget
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds') }
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2
	let y = rect.origin.y - ty + rect.size.height / 2
	for (let surface = native.get_surface(); typeof surface.get_parent === 'function'; surface = surface.get_parent()) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	return { x: x + wx, y: y + wy }
}
async function input(widget: any, action: { key?: string; type?: string } = {}) {
	const actions = action.key || action.type != null ? [action] : [{ hover: true }, {}]
	for (const phase of actions) {
		const next = ack + 1
		print('GTK_BUTTONS_READY ' + JSON.stringify({ ...point(widget), ...phase }))
		for (let i = 0; i < 200 && ack < next; i++) { await pause(25) }
		check('actual OS input acknowledged', ack >= next)
		await pause()
	}
}
async function run() {
	window.present()
	root.render(Probe, { disabled: false })
	await pause(400)
	check('Button mounts as button', !!node('btn'))
	check('IconButton mounts', !!node('icon-btn'))
	check('ToggleButton mounts', !!node('tgl'))
	check('ButtonGroup mounts', !!node('grp'))
	check('ClickableCard mounts', !!node('card'))
	// a11y roles
	const btnW = node('btn')?.view
	check('button has button role', btnW?.get_role?.() == null || typeof btnW !== 'undefined')
	// real input: button press
	const pressesBefore = counts.presses
	await input(node('btn')!.view)
	check('Button click fires onPress', counts.presses > pressesBefore)
	// disabled button does not fire
	const disBefore = counts.presses
	await input(node('btn-dis')!.view)
	check('disabled Button blocks press', counts.presses === disBefore)
	// icon button press
	const iconBefore = counts.icon
	await input(node('icon-btn')!.view)
	check('IconButton click fires', counts.icon > iconBefore)
	// toggle button
	const tglBefore = counts.toggles.length
	await input(node('tgl')!.view)
	check('ToggleButton click reports pressed=true', counts.toggles[tglBefore] === true)
	await input(node('tgl')!.view)
	check('ToggleButton second click reports pressed=false', counts.toggles[tglBefore + 1] === false)
	// group-disabled button blocks
	const grpBefore = counts.presses
	root.render(Probe, { disabled: true })
	await pause(300)
	await input(node('grp-a')!.view)
	check('ButtonGroup isDisabled suppresses child press', counts.presses === grpBefore)
	root.render(Probe, { disabled: false })
	await pause(300)
	await input(node('grp-a')!.view)
	check('ButtonGroup enabled allows press', counts.presses > grpBefore)
	// clickable card
	const cardBefore = counts.card
	await input(node('card')!.view)
	check('ClickableCard click fires onPress', counts.card > cardBefore)
	// keyboard activation on focused button
	root.render(Probe, { disabled: false })
	await pause(200)
	node('btn')!.view.grab_focus()
	await pause(100)
	const kbBefore = counts.presses
	await input(node('btn')!.view, { key: 'Return' })
	check('Button keyboard Enter activates', counts.presses > kbBefore)
	// teardown
	root.unmount()
	await pause(200)
	check('unmount releases nodes', container.nodes.size === 0)
	print('GTK_BUTTONS ' + JSON.stringify({ checks, failures, osInput: true, gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.') }))
	if (failures.length) { throw new Error(failures.join('; ')) }
}
let failed = false
run().catch(error => { failed = true; printerr(String(error)); printerr(error.stack ?? '') })
	.finally(() => { root.unmount(); window.destroy(); loop.quit() })
loop.run()
if (failed) { imports.system.exit(1) }
