import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { positionPopover } from '../../../../ui/src/components/overlays/popover-position'
import { Popovers, counts, refs } from './ui-popover.gtk'

Gtk.init()
const window = new Gtk.Window({ title: 'Octane GTK Popover test', default_width: 800, default_height: 600, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, { onUncaughtError(error) { throw error } })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 250) => new Promise<void>(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false }))
let checks = 0, ack = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => { checks++; if (!ok) { failures.push(name) } }
const near = (a: number, b: number) => Math.abs(a - b) <= 1
const node = (id: string) => [...container.nodes.values()].find(n => n.props.id === id)
const pane = () => [...container.nodes.values()].find(n => n.cssClasses.has('popup-custom'))!.view!
const focusTarget = (widget: any) => widget?.get_delegate?.() ?? widget
const popupFor = (anchor: any) => {
	for (let child = anchor?.get_first_child(); child; child = child.get_next_sibling()) {
		if (child instanceof Gtk.Popover) { return child }
	}
	return null
}
const controllerCount = (widget: any) => widget.observe_controllers().get_n_items()
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
const windowBaseline = controllerCount(window)
const point = (widget: any) => {
	const native = widget.get_native()
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
		print('GTK_POPOVER_READY ' + JSON.stringify({ ...point(widget), ...phase }))
		for (let i = 0; i < 200 && ack < next; i++) { await pause(25) }
		check('actual OS input acknowledged', ack >= next)
		await pause()
	}
}
const expectedFor = (anchor: any, panel: any, placement: any, gap: number, alignment: any) =>
	positionPopover({ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }, panel,
		{ left: 0, top: 0, width: host.get_width(), height: host.get_height() }, placement, gap, alignment)
let props: any = { open: false }
async function render(next: Record<string, unknown> = {}) { props = { ...props, ...next }; root.render(Popovers, props); await pause() }
async function run() {
	await render()
	window.present()
	await pause()
	refs.peer.focus()
	await pause(120)
	const initialFocus = window.get_focus()
	await render({ open: true })
	await pause(400)
	const anchor = refs.anchor
	const popup = popupFor(anchor)
	check('GTK leaf creates mapped nonmodal native popup', !!popup?.get_mapped() && !popup.get_autohide())
	check('opening preserves initial keyboard focus', window.get_focus() === initialFocus)
	check('portal preserves context and resets size', node('popup-context')?.view!.get_text() === 'first:md:0')
	check('shared chrome provider owns the display once: ' + container.popoverChromeUsers?.(), container.popoverChromeUsers?.() === 1)
	check('popup events bind the shared window pair', controllerCount(window) === windowBaseline + 2)
	for (const placement of ['top', 'bottom', 'left', 'right'] as const) {
		for (const alignment of ['start', 'center', 'end'] as const) {
			await render({ placement, alignment })
			const a = anchor.getBounds(), p = pane().getBounds()
			const expected = expectedFor(a, p, placement, 8, alignment)
			check('native placement ' + placement + '/' + alignment + ': ' + JSON.stringify({ actual: p, expected, offset: popup.get_offset() }), near(p.x, expected.left) && near(p.y, expected.top))
		}
	}
	await render({ anchorLeft: 620, anchorTop: 480, placement: 'bottom', alignment: 'start' })
	{
		const a = anchor.getBounds(), p = pane().getBounds()
		const expected = expectedFor(a, p, 'bottom', 8, 'start')
		check('overflowing placement flips inside viewport: ' + JSON.stringify({ actual: p, expected }), near(p.x, expected.left) && near(p.y, expected.top) && expected.placement === 'top')
	}
	await render({ anchorLeft: 640, anchorTop: 60 })
	{
		const a = anchor.getBounds(), p = pane().getBounds()
		const expected = expectedFor(a, p, 'bottom', 8, 'start')
		check('cross axis clamps to the viewport edge: ' + JSON.stringify({ actual: p, expected }), near(p.x, expected.left) && near(p.y, expected.top) && expected.left < a.x)
	}
	const oldPane = pane()
	await render({ anchorLeft: 200, anchorTop: 160, value: 'updated', placement: 'bottom', alignment: 'start', offset: '16px' })
	check('updates retain pane and content effect', pane() === oldPane && counts.mounts === 1 && counts.unmounts === 0)
	check('updated provider value reaches popup', node('popup-context')?.view!.get_text() === 'updated:md:0')
	{
		const a = anchor.getBounds(), positioned = pane().getBounds()
		check('px offset updates native clearance: ' + JSON.stringify({ a, positioned }), near(positioned.x, a.x) && near(positioned.y, a.y + a.height + 16))
	}
	refs.entry.focus()
	await pause()
	check('popup editor can receive focus', window.get_focus() !== initialFocus)
	let osInput = false
	if (GLib.getenv('GTK_POPOVER_OS') === '1') {
		osInput = true
		acknowledge(popup)
		await input(node('popup-action').view)
		check('inside click reaches popover action without dismissing: ' + JSON.stringify({ text: node('popup-context')?.view!.get_text(), counts: { ...counts }, mapped: popup.get_mapped() }), node('popup-context').view.get_text() === 'updated:md:1' && counts.dismiss === 0 && popup.get_mapped())
		await input(node('popup-entry').view)
		await input(node('popup-entry').view, { key: 'Escape' })
		check('controlled Escape requests dismiss and stays open: ' + JSON.stringify({ counts: { ...counts }, mapped: popup.get_mapped() }), counts.dismiss === 1 && popup.get_mapped())
		await render({ dismissOnEscape: false })
		await input(node('popup-entry').view, { key: 'Escape' })
		check('dismissOnEscape=false blocks Escape: ' + JSON.stringify({ counts: { ...counts }, mapped: popup.get_mapped() }), counts.dismiss === 1 && popup.get_mapped())
		await render({ dismissOnEscape: true, nested: true, nestedDismissOnEscape: true })
		await pause(400)
		let nested = popupFor(refs.inner)
		check('nested popover maps inside popover content: ' + JSON.stringify({ inner: !!refs.inner, mapped: nested?.get_mapped?.() }), !!nested?.get_mapped())
		check('chrome provider is shared by concurrent popovers: ' + container.popoverChromeUsers?.(), container.popoverChromeUsers?.() === 2)
		acknowledge(nested)
		await input(node('popup-outside').view)
		check('outside click closes only the top layer: ' + JSON.stringify({ counts: { ...counts }, nested: nested?.get_mapped?.(), outer: popup.get_mapped() }), counts.nestedDismiss === 1 && !nested.get_mapped() && counts.dismiss === 1 && popup.get_mapped())
		await render({ nested: false })
		await render({ nested: true, nestedDismissOnEscape: false })
		await pause(400)
		nested = popupFor(refs.inner)
		check('remounted nested popover maps: ' + JSON.stringify({ inner: !!refs.inner, mapped: nested?.get_mapped?.() }), !!nested?.get_mapped())
		acknowledge(nested)
		await input(node('popup-entry').view, { key: 'Escape' })
		check('blocked Escape on the top layer shields lower layers: ' + JSON.stringify({ counts: { ...counts }, nested: nested?.get_mapped?.(), outer: popup.get_mapped() }), counts.nestedDismiss === 1 && counts.dismiss === 1 && nested.get_mapped() && popup.get_mapped())
		await render({ nestedDismissOnEscape: true })
		await input(node('popup-entry').view, { key: 'Escape' })
		check('Escape closes only the top layer: ' + JSON.stringify({ counts: { ...counts }, nested: nested?.get_mapped?.(), outer: popup.get_mapped() }), counts.nestedDismiss === 2 && counts.dismiss === 1 && popup.get_mapped() && !nested.get_mapped())
		await render({ nested: false })
		const outsideBefore = counts.outside
		await input(node('popup-outside').view)
		check('outside click is consumed and requests dismiss: ' + JSON.stringify({ counts: { ...counts }, outsideBefore, mapped: popup.get_mapped() }), counts.dismiss === 2 && counts.outside === outsideBefore && popup.get_mapped())
		await render({ dismissOnOutsideTap: false })
		await input(node('popup-outside').view)
		check('dismissOnOutsideTap=false passes the click through: ' + JSON.stringify({ counts: { ...counts }, outsideBefore, mapped: popup.get_mapped() }), counts.outside === outsideBefore + 1 && counts.dismiss === 2 && popup.get_mapped())
		await render({ dismissOnOutsideTap: true })
		await render({ variant: 'uncontrolled' })
		await pause(400)
		const uAnchor = refs.uAnchor
		const uPopup = popupFor(uAnchor)
		check('uncontrolled defaultOpen maps on mount', !!uPopup?.get_mapped())
		acknowledge(uPopup)
		refs.uPeer.focus()
		await pause(150)
		const dismissBefore = counts.dismiss
		await input(refs.uPeer.native, { key: 'Escape' })
		check('uncontrolled Escape closes itself', counts.dismiss === dismissBefore + 1 && !uPopup.get_mapped())
		await render({ variant: 'controlled', open: false })
		await render({ variant: 'uncontrolled' })
		await pause(400)
		const uPopup2 = popupFor(refs.uAnchor)
		check('remounted uncontrolled maps again', !!uPopup2?.get_mapped())
		const outsideBefore2 = counts.outside
		await input(node('u-outside').view)
		check('uncontrolled outside tap closes itself', counts.dismiss === dismissBefore + 2 && counts.outside === outsideBefore2 && !uPopup2.get_mapped())
	}
	await render({ variant: 'controlled', open: false })
	await pause(400)
	refs.peer.focus()
	await pause(120)
	const restoredFocus = window.get_focus()
	await render({ open: true })
	await pause(400)
	const anchor2 = refs.anchor
	const popup2 = popupFor(anchor2)
	check('reopened controlled popover maps', !!popup2?.get_mapped())
	const dismissBeforeUnmount = counts.dismiss
	await render({ showAnchor: false })
	check('anchor unmount removes the native surface', popup2.get_parent() === null && !popup2.get_mapped())
	check('anchor unmount requests dismiss', counts.dismiss === dismissBeforeUnmount + 1)
	check('anchor unmount removes portal content: ' + JSON.stringify({ node: !!node('popup-context') }), !node('popup-context'))
	await render({ showAnchor: true })
	await pause(400)
	const anchor3 = refs.anchor
	const popup3 = anchor3 && popupFor(anchor3)
	check('anchor remount maps a fresh native popover', !!anchor3 && anchor3 !== anchor2 && !!popup3?.get_mapped())
	refs.entry.focus()
	await pause()
	await render({ open: false })
	check('closing restores captured live focus', window.get_focus() === restoredFocus)
	check('controlled close removes portal content', !node('popup-context'))
	check('controlled close unparents native popup', popup3.get_parent() === null)
	await render({ open: true, finalFocus: true })
	await pause(400)
	const popup4 = popupFor(refs.anchor)
	check('finalFocus reopen maps a popover', !!popup4?.get_mapped())
	refs.entry.focus()
	await pause()
	await render({ open: false })
	{
		const focus = window.get_focus()
		check('finalFocusRef wins over captured focus: ' + JSON.stringify({ focus: focus?.$gtype?.name ?? String(focus), wanted: focusTarget(refs.return?.native ?? refs.return)?.$gtype?.name }), focus === focusTarget(refs.return?.native ?? refs.return))
	}
	check('controlled close balances content effects', counts.mounts === counts.unmounts)
	await render({ open: true })
	await pause(400)
	const popup5 = popupFor(refs.anchor)
	check('teardown popover maps', !!popup5?.get_mapped())
	const popup5Controllers = controllerCount(popup5)
	const lastAnchor = refs.anchor
	root.unmount()
	await pause()
	check('unmount releases managed nodes', container.nodes.size === 0)
	check('unmount unparents an open native popup', popup5.get_parent() === null && !popup5.get_mapped())
	check('unmount releases shared window controllers', controllerCount(window) === windowBaseline)
	check('unmount releases popup controllers', controllerCount(popup5) === popup5Controllers - 2)
	check('shared chrome provider refcount returns to zero', container.popoverChromeUsers?.() === 0)
	check('stale anchor cannot create a new popup', lastAnchor.createPopover({}) === null)
	print('GTK_POPOVER ' + JSON.stringify({ checks, failures, osInput, gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.') }))
	if (failures.length) { throw new Error(failures.join('; ')) }
}
let failed = false
run().catch(error => { failed = true; printerr(String(error)); printerr(error.stack ?? '') })
.finally(() => { root.unmount(); window.destroy(); loop.quit() })
loop.run()
if (failed) { imports.system.exit(1) }
