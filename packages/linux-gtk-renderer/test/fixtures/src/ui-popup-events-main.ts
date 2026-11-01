import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { bindPopupEvents } from '../../../src/popup-events'
import { dispatchLayerKey, registerLayer, shouldCloseLayer } from '../../../../ui/src/components/overlays/layer-stack'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK popup events test',
	default_width: 850,
	default_height: 600,
	decorated: false,
})
const fixed = new Gtk.Fixed()
window.set_child(fixed)
const anchorA = new Gtk.Button({ label: 'Anchor A' })
const anchorB = new Gtk.Button({ label: 'Anchor B' })
const outside = new Gtk.Button({ label: 'Outside' })
for (const [widget, x, y] of [
	[anchorA, 120, 80],
	[anchorB, 470, 80],
	[outside, 620, 440],
] as const) {
	widget.set_size_request(120, 40)
	fixed.put(widget, x, y)
}
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 180) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0,
	ack = 0,
	outsideClicks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => {
	checks++
	if (!ok) {failures.push(name)}
}
outside.connect('clicked', () => outsideClicks++)
const acknowledgers: Array<[any, any]> = []
function acknowledge(widget: any) {
	const keys = new Gtk.EventControllerKey()
	keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
	keys.connect('key-pressed', (_controller: any, key: number) => {
		if (key !== Gdk.KEY_F12) {return false}
		ack++
		return true
	})
	widget.add_controller(keys)
	acknowledgers.push([widget, keys])
}
acknowledge(window)
const controllerCount = (widget: any) => widget.observe_controllers().get_n_items()
const windowBaseline = controllerCount(window)
function layer(anchor: any, depth: number) {
	const popup = new Gtk.Popover({ autohide: false, has_arrow: false })
	const panel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8 })
	const entry = new Gtk.Entry()
	const action = new Gtk.Button({ label: 'Inside popup' })
	panel.append(entry)
	panel.append(action)
	popup.set_child(panel)
	popup.set_parent(anchor)
	acknowledge(popup)
	const baseline = controllerCount(popup)
	const token = {}
	const state = {
		popup,
		entry,
		action,
		baseline,
		escape: 0,
		outside: 0,
		clicks: 0,
		escapeEnabled: true,
		outsideEnabled: true,
		closeOnRequest: false,
		disposed: false,
		dispose: () => {},
	}
	action.connect('clicked', () => state.clicks++)
	const request = () => {
		if (state.closeOnRequest) {
			popup.popdown()
			state.dispose()
		}
	}
	const removeLayer = registerLayer({
		token,
		depth,
		get behavior() {
			return state.escapeEnabled ? 'close' : 'block'
		},
		isPresent: () => !state.disposed && popup.get_mapped(),
		dismiss() {
			state.escape++
			request()
		},
	})
	const removeEvents = bindPopupEvents(window, popup, {
		isPresent: () => !state.disposed && popup.get_mapped(),
		onEscape(event) {
			dispatchLayerKey({ key: 'Escape', preventDefault: () => event.preventDefault() })
		},
		onOutside(event) {
			if (!state.outsideEnabled || !shouldCloseLayer(token)) {return}
			event.preventDefault()
			state.outside++
			request()
		},
	})
	state.dispose = () => {
		if (state.disposed) {return}
		state.disposed = true
		removeLayer()
		removeEvents()
	}
	return state
}
const a = layer(anchorA, 0),
	b = layer(anchorB, 0),
	c = layer(a.action, 1)
c.popup.set_position(Gtk.PositionType.RIGHT)
const layers = [a, b, c]
const point = (widget: any) => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) {throw new Error('No native input bounds')}
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2,
		y = rect.origin.y - ty + rect.size.height / 2
	for (
		let surface = native.get_surface();
		typeof surface.get_parent === 'function';
		surface = surface.get_parent()
	) {
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
		print('GTK_POPUP_EVENTS_READY ' + JSON.stringify({ ...point(widget), ...phase }))
		for (let i = 0; i < 200 && ack < next; i++) {await pause(25)}
		check('actual OS input acknowledged', ack >= next)
		await pause()
	}
}
async function run() {
	check('one shared window controller pair', controllerCount(window) === windowBaseline + 2)
	for (const item of layers)
		{check('one controller pair per native popup', controllerCount(item.popup) === item.baseline + 2)}
	window.present()
	await pause()
	a.popup.popup()
	await pause(300)
	check('parent popup maps nonmodally', a.popup.get_mapped() && !a.popup.get_autohide())
	let osInput = false
	if (GLib.getenv('GTK_POPUP_EVENTS_OS') === '1') {
		await input(a.action)
		check('inside click reaches popup button', a.clicks === 1 && a.outside === 0)
		await input(a.entry)
		await input(a.entry, { type: 'GTK' })
		check('popup entry handles actual text input', a.entry.get_text() === 'GTK')
		a.escapeEnabled = false
		await input(a.entry, { key: 'Escape' })
		check(
			'blocked Escape keeps controlled layer and request count',
			a.escape === 0 && a.popup.get_mapped(),
		)
		a.escapeEnabled = true
		await input(a.entry, { key: 'Escape' })
		check('unhandled editor Escape reaches layer once', a.escape === 1 && a.popup.get_mapped())
		const editorKeys = new Gtk.EventControllerKey()
		editorKeys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
		editorKeys.connect('key-pressed', (_controller: any, key: number) => key === Gdk.KEY_Escape)
		a.entry.add_controller(editorKeys)
		await input(a.entry, { key: 'Escape' })
		check('handled editor Escape does not reach layer', a.escape === 1)
		a.entry.remove_controller(editorKeys)
		a.outsideEnabled = false
		await input(outside)
		check(
			'outside policy can allow background interaction',
			outsideClicks === 1 && a.outside === 0 && a.popup.get_mapped(),
		)
		a.outsideEnabled = true
		await input(outside)
		check('outside claim consumes click before background', outsideClicks === 1 && a.outside === 1)
		check('outside controlled rejection keeps popup mapped', a.popup.get_mapped())
		b.popup.popup()
		await pause(300)
		check('sibling popup maps', b.popup.get_mapped())
		await input(a.action)
		check(
			'sibling popup claims lower popup click',
			b.outside === 1 && a.clicks === 1 && a.outside === 1,
		)
		await input(a.entry, { key: 'Escape' })
		check('sibling owns Escape from another native surface', b.escape === 1 && a.escape === 1)
		c.popup.popup()
		await pause(300)
		check('nested popup maps', c.popup.get_mapped())
		await input(b.action)
		check(
			'nested depth claims sibling surface click',
			c.outside === 1 && b.clicks === 0 && b.outside === 1,
		)
		c.outsideEnabled = false
		await input(b.action)
		check(
			'nested outside policy permits lower surface interaction',
			c.outside === 1 && b.clicks === 1,
		)
		c.escapeEnabled = false
		await input(b.action, { key: 'Escape' })
		check(
			'nested block protects lower Escape owners',
			c.escape === 0 && b.escape === 1 && a.escape === 1,
		)
		c.escapeEnabled = true
		await input(b.action, { key: 'Escape' })
		check(
			'nested owner receives Escape once across surfaces',
			c.escape === 1 && c.popup.get_mapped(),
		)
		dispatchLayerKey({ key: 'Escape', isComposing: true, preventDefault() {} })
		check('synthetic composition guard retains layer', c.escape === 1)
		await input(c.entry)
		check(
			'nested entry accepts focus on its own native surface',
			window.get_focus() === c.entry.get_delegate(),
		)
		c.closeOnRequest = true
		await input(c.entry, { key: 'Escape' })
		check(
			'synchronous close removes only top layer',
			c.escape === 2 && !c.popup.get_mapped() && b.escape === 1 && a.escape === 1,
		)
		check('closing removes nested native controllers', controllerCount(c.popup) === c.baseline)
		b.popup.popdown()
		b.dispose()
		await pause()
		check(
			'sibling cleanup preserves shared window pair',
			controllerCount(window) === windowBaseline + 2,
		)
		check('sibling native controllers are removed', controllerCount(b.popup) === b.baseline)
		await input(a.entry, { key: 'Escape' })
		check(
			'remaining parent resumes Escape ownership',
			a.escape === 2 && b.escape === 1 && c.escape === 2,
		)
		osInput = true
	}
	for (const item of layers) {
		item.popup.popdown()
		item.dispose()
		item.dispose()
	}
	check('last layer removes shared window pair', controllerCount(window) === windowBaseline)
	for (const item of layers)
		{check('all popup controller pairs are removed', controllerCount(item.popup) === item.baseline)}
	const reopened = layer(anchorA, 0)
	layers.push(reopened)
	reopened.popup.popup()
	await pause(300)
	check(
		'a new layer rebinds after complete teardown',
		reopened.popup.get_mapped() && controllerCount(window) === windowBaseline + 2,
	)
	if (osInput) {
		await input(reopened.entry, { key: 'Escape' })
		check(
			'a new layer receives real Escape after complete teardown',
			reopened.escape === 1 && a.escape === 2,
		)
	}
	reopened.dispose()
	reopened.popup.popdown()
	check(
		'reopened layer cleanup removes its window controllers',
		controllerCount(window) === windowBaseline,
	)

	print(
		'GTK_POPUP_EVENTS ' +
			JSON.stringify({
				checks,
				failures,
				osInput,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
	if (failures.length) {throw new Error(failures.join('; '))}
}
let failed = false
run()
	.catch((error) => {
		failed = true
		printerr(String(error))
		printerr(error.stack ?? '')
	})
	.finally(() => {
		for (const item of layers.reverse()) {
			item.dispose()
			item.popup.popdown()
			item.popup.unparent()
		}
		for (const [widget, controller] of acknowledgers) {widget.remove_controller(controller)}
		window.destroy()
		loop.quit()
	})
loop.run()
if (failed) {imports.system.exit(1)}
