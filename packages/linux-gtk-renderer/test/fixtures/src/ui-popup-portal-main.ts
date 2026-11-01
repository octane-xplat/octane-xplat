import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Graphene from 'gi://Graphene'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Portals, refs, lifetime } from './ui-portal.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK popup portal test',
	default_width: 800,
	default_height: 650,
	decorated: false,
})
const fixed = new Gtk.Fixed()
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
host.set_size_request(500, 400)
fixed.put(host, 35, 25)
window.set_child(fixed)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const target = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const nestedTarget = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const nestedAnchor = new Gtk.Button({ label: 'Nested anchor' })
target.append(nestedAnchor)
const popover = new Gtk.Popover({ autohide: false, has_arrow: false })
const nested = new Gtk.Popover({ autohide: false, has_arrow: false })
popover.set_child(target)
nested.set_child(nestedTarget)
popover.set_position(Gtk.PositionType.BOTTOM)
nested.set_position(Gtk.PositionType.RIGHT)
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 180) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => {
	checks++
	if (!ok) {
		failures.push(name)
	}
}
const near = (a: number, b: number) => Math.abs(a - b) <= 1
let props: Parameters<typeof Portals>[0] = { target, value: 'first', order: ['a'] }
const render = async () => {
	root.render(Portals, props)
	await pause()
}
const text = () => refs['label-a'].get_text()
let ack = 0
const controllers: Array<[any, any]> = []
for (const widget of [window, popover, nested]) {
	const keys = new Gtk.EventControllerKey()
	keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
	keys.connect('key-pressed', (_controller: any, key: number) => {
		if (key !== 65481) {
			return false
		}
		ack++
		return true
	})
	widget.add_controller(keys)
	controllers.push([widget, keys])
}
// Derive an independent expected point from native allocations and Gdk.Popup
// positions. The root host is deliberately offset within its top-level.
const expected = (widget: any) => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) {
		throw new Error('No bounds within native')
	}
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx,
		y = rect.origin.y - ty
	for (
		let surface = native.get_surface();
		typeof surface.get_parent === 'function';
		surface = surface.get_parent()
	) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [hostOk, origin] = host.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	if (!hostOk) {
		throw new Error('No root host origin')
	}
	const [wx, wy] = window.get_surface_transform()
	return {
		x: x + wx - origin.x,
		y: y + wy - origin.y,
		width: rect.size.width,
		height: rect.size.height,
	}
}
const measure = (name: string, widget: any) => {
	const actual = widget.getBounds(),
		wanted = expected(widget)
	check(name + ' has public bounds', actual !== null)
	check(
		name + ' origin matches popup surface chain',
		!!actual && near(actual.x, wanted.x) && near(actual.y, wanted.y),
	)
	check(
		name + ' size matches native border box',
		!!actual && near(actual.width, wanted.width) && near(actual.height, wanted.height),
	)
	return wanted
}
async function input(widget: any, key?: string) {
	const r = expected(widget)
	const [ok, origin] = host.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	if (!ok) {
		throw new Error('No input origin')
	}
	// Round-trip pointer entry before pressing on a different native surface.
	// A single immediate move/click was intermittent after nested retargeting.
	const point = { x: r.x + origin.x + r.width / 2, y: r.y + origin.y + r.height / 2 }
	for (const action of key ? [{ key }] : [{ hover: true }, {}]) {
		const next = ack + 1
		print('GTK_POPUP_PORTAL_READY ' + JSON.stringify({ ...point, ...action }))
		for (let i = 0; i < 200 && ack < next; i++) {
			await pause(25)
		}
		check('actual OS action acknowledged', ack >= next)
		await pause()
	}
}
async function run() {
	await render()
	popover.set_parent(refs.owned)
	window.present()
	popover.popup()
	await pause(300)
	check('portal popup maps', popover.get_mapped())
	check('portal content receives original context', text() === 'first:a:0')
	check(
		'portal action is parented to external popup target',
		refs['action-a'].get_parent() === target,
	)
	measure('popup label', refs['label-a'])
	measure('popup action', refs['action-a'])
	const action = refs['action-a']
	for (const style of [
		{ translateX: 13, translateY: 7 },
		{ scaleX: 1.3, scaleY: 0.8 },
		{ rotate: 12 },
	]) {
		for (const [name, value] of Object.entries(style)) {
			action.style[name] = value
		}
		await pause()
		measure('transformed popup action ' + JSON.stringify(style), action)
		for (const name of Object.keys(style)) {
			delete action.style[name]
		}
		await pause()
	}
	fixed.move(host, 60, 45)
	await pause()
	measure('moved original root host', action)
	fixed.move(host, 35, 25)
	await pause()
	let layouts = 0
	const changed = () => layouts++
	action.on('layoutChanged', changed)
	await pause()
	const before = expected(action)
	popover.set_offset(45, 12)
	popover.present()
	await pause(250)
	const moved = measure('moved popup action', action)
	check(
		'popup offset actually changes surface position',
		!near(before.x, moved.x) || !near(before.y, moved.y),
	)
	check('layout subscription observes surface movement', layouts >= 2)
	props = { ...props, value: 'updated' }
	await render()
	check('popup update preserves native action', refs['action-a'] === action)
	check('popup receives updated original context', text() === 'updated:a:0')
	let osInput = false
	if (GLib.getenv('GTK_POPUP_PORTAL_OS') === '1') {
		await input(action)
		check('real popup press updates original component state', text() === 'updated:a:1')
		osInput = true
	}
	nested.set_parent(nestedAnchor)
	props = { ...props, target: nestedTarget }
	await render()
	nested.popup()
	await pause(300)
	check('nested native popup maps', nested.get_mapped())
	check('retarget preserves portal action', refs['action-a'] === action)
	measure('nested popup action', action)
	if (osInput) {
		await input(action)
		check(
			'real nested popup press updates original component state: ' + text(),
			text() === 'updated:a:2',
		)
	}
	nested.popdown()
	await pause()
	props = { ...props, target }
	await render()
	nested.unparent()
	check('retarget returns action to parent popup', action.get_parent() === target)
	popover.popdown()
	await pause()
	check('native close unmaps popup', !popover.get_mapped())
	popover.popup()
	await pause()
	measure('reopened popup action', action)
	if (osInput) {
		check('reopened action accepts focus', action.focus())
		await input(action, 'Return')
		check(
			'reopened action receives actual keyboard activation: ' + text(),
			text() === 'updated:a:3',
		)
	}
	const otherWindow = new Gtk.Window({ title: 'Unrelated native surface' })
	const otherTarget = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
	otherWindow.set_child(otherTarget)
	otherWindow.present()
	props = { ...props, target: otherTarget }
	await render()
	check('unrelated realized top-level has no app-relative bounds', action.getBounds() === null)
	props = { ...props, target }
	await render()
	otherWindow.destroy()
	measure('returned from unrelated top-level', action)
	action.off('layoutChanged', changed)
	popover.popdown()
	popover.unparent()
	root.unmount()
	await pause()
	check('unmount cleans all managed portal nodes', container.nodes.size === 0)
	check('unmount clears portal refs', refs['action-a'] === null)
	check('disposed popup ref cannot measure', action.getBounds() === null)
	check(
		'portal effects balance after cross-surface retargets',
		lifetime.mounts === lifetime.unmounts,
	)
	check('explicit cleanup detaches popup', popover.get_parent() === null)
	print(
		'GTK_POPUP_PORTAL ' +
			JSON.stringify({
				checks,
				failures,
				osInput,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
	if (failures.length) {
		throw new Error(failures.join('; '))
	}
}
let failed = false
run()
	.catch((error) => {
		failed = true
		printerr(String(error))
		printerr(error.stack ?? '')
	})
	.finally(() => {
		nested.popdown()
		if (nested.get_parent()) {
			nested.unparent()
		}
		popover.popdown()
		if (popover.get_parent()) {
			popover.unparent()
		}
		root.unmount()
		for (const [widget, controller] of controllers) {
			widget.remove_controller(controller)
		}
		window.destroy()
		loop.quit()
	})
loop.run()
if (failed) {
	imports.system.exit(1)
}
