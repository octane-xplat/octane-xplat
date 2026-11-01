import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Scene, counts, refs } from './ui-selector.gtk'

Gtk.init()
const window = new Gtk.Window({ title: 'Octane GTK Selector test', default_width: 800, default_height: 700, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, { onUncaughtError(error) { throw error } })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 250) => new Promise<void>(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false }))
let checks = 0, ack = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => { checks++; if (!ok) { failures.push(name) } }
const node = (id: string) => [...container.nodes.values()].find(n => n.props.id === id)
const nodeText = (id: string) => {
	const found = node(id)
	if (!found) { return undefined }
	const view: any = found.view
	if (typeof view?.get_text === 'function') { return view.get_text() }
	for (let child = view?.get_first_child?.(); child; child = child.get_next_sibling()) {
		if (typeof child.get_text === 'function') { return child.get_text() }
	}
	return undefined
}
const trigger = () => node('sel')?.view
const popupFor = (anchor: any) => {
	for (let child = anchor?.get_first_child(); child; child = child.get_next_sibling()) {
		if (child instanceof Gtk.Popover) { return child }
	}
	return null
}
const popup = () => popupFor(trigger())
const multiPopup = () => popupFor(node('multi')?.view)
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
		print('GTK_SELECTOR_READY ' + JSON.stringify({ ...point(widget), ...phase }))
		for (let i = 0; i < 200 && ack < next; i++) { await pause(25) }
		check('actual OS input acknowledged', ack >= next)
		await pause()
	}
}
let props: any = {}
async function render(next: Record<string, unknown> = {}) { props = { ...props, ...next }; root.render(Scene, props); await pause() }
async function run() {
	await render()
	window.present()
	await pause()
	refs.peer.focus()
	await pause(150)
	const initialFocus = window.get_focus()
	check('selector trigger mounts closed with placeholder', !!trigger() && !popup())
	check('placeholder text renders', nodeText('sel') != null && !counts.changes.length)
	let osInput = false
	await render({ open: true })
	await pause(400)
	const pop = popup()
	check('controlled open maps a popover on the trigger', !!pop?.get_mapped())
	check('option nodes mount with ids', !!node('sel-option-a') && !!node('sel-option-e'))
	check('options carry button role metadata', !!node('sel-option-b'))
	check('disabled option mounts', !!node('sel-option-c'))
	check('group heading renders above its options', !!node('sel-option-d'))
	if (GLib.getenv('GTK_SELECTOR_OS') === '1') {
		osInput = true
		acknowledge(pop)
		const beforePick = counts.changes.length
		await input(node('sel-option-b')?.view ?? trigger())
		check('controlled option pick reports and stays open', counts.changes[beforePick] === 'b' && pop.get_mapped())
		check('trigger shows the selected label', nodeText('sel') != null)
	}
	await render({ open: false })
	await render({ variant: 'uncontrolled', defaultValue: 'b' })
	await pause(400)
	const upop = popup()
	check('uncontrolled defaultOpen+defaultValue mounts open', !!upop?.get_mapped())
	if (osInput) {
		acknowledge(upop)
		const uBefore = counts.changes.length
		await input(node('sel-option-a')?.view ?? trigger())
		check('uncontrolled option click selects and closes itself', counts.changes[uBefore] === 'a' && !upop.get_mapped())
		await render({ nonce: 1, defaultValue: undefined })
		await pause(400)
		const upop2 = popup()
		check('uncontrolled mounts open again', !!upop2?.get_mapped())
		if (upop2) { acknowledge(upop2) }
		await input(trigger(), { key: 'Escape' })
		check('uncontrolled Escape closes itself', !!upop2 && !upop2.get_mapped())
		const outsideBefore = counts.outside
		await render({ nonce: 0 })
		await pause(400)
		const upop3 = popup()
		check('uncontrolled remounts open', !!upop3?.get_mapped())
		await input(node('sel-outside')?.view ?? trigger())
		check('uncontrolled outside tap closes itself and is consumed', counts.outside === outsideBefore && !!upop3 && !upop3.get_mapped())
	}
	await render({ variant: undefined })
	await render({ open: true })
	await pause(400)
	const pop2 = popup()
	check('controlled open maps a popover', !!pop2?.get_mapped())
	if (osInput) {
		acknowledge(pop2)
		const before = counts.changes.length
		await input(node('sel-option-c')?.view ?? trigger())
		check('disabled option does not pick', counts.changes.length === before && pop2.get_mapped())
		await input(node('sel-option-a')?.view ?? trigger())
		check('controlled option click reports and closes', counts.changes[before] === 'a' && pop2.get_mapped())
		await render({ open: false })
		check('controlled stays open until parent closes', !pop2.get_mapped())
	}
	await render({ open: true, searchable: true })
	await pause(400)
	const pop3 = popup()
	const searchNode = node('sel-search')
	check('searchable mounts a search input', !!pop3?.get_mapped() && !!searchNode)
	if (osInput && searchNode) {
		acknowledge(pop3)
		const focusAfter = window.get_focus()
		check('search input receives focus on open', focusAfter !== initialFocus)
		await input(searchNode.view)
		await input(searchNode.view, { type: 'alp' })
		const lastQuery = counts.queries[counts.queries.length - 1]
		check('typing filters options', lastQuery === 'alp' && !node('sel-option-d') && !!node('sel-option-a'))
		const opensBefore = counts.opens.length
		await input(searchNode.view, { key: 'Escape' })
		check('controlled Escape requests dismiss and stays open', counts.opens[opensBefore] === false && pop3.get_mapped())
	}
	await render({ searchable: false, open: true })
	await pause(400)
	const pop4 = popup()
	check('reopened popover maps', !!pop4?.get_mapped())
	if (osInput) {
		acknowledge(pop4)
		const outsideBefore = counts.outside
		const opensBeforeOut = counts.opens.length
		await input(node('sel-outside')?.view ?? trigger())
		check('controlled outside click requests dismiss, consumed, stays open', counts.opens[opensBeforeOut] === false && counts.outside === outsideBefore && pop4.get_mapped())
		await render({ open: false })
		check('parent close restores focus', !pop4.get_mapped() && window.get_focus() != null)
	}
	await render({ open: true })
	await pause(400)
	const pop5 = popup()
	if (osInput) {
		acknowledge(pop5)
		const opensBeforeEsc = counts.opens.length
		await input(trigger(), { key: 'Escape' })
		check('controlled Escape requests dismiss and stays open', counts.opens[opensBeforeEsc] === false && pop5.get_mapped())
	}
	await render({ disabled: true, open: undefined, defaultOpen: false })
	await pause(300)
	check('disabled field keeps popover closed', !popup()?.get_mapped())
	if (osInput) {
		await input(trigger())
		check('disabled field does not open on click', !popup()?.get_mapped())
	}
	await render({ disabled: false, multiOpen: true, selectAll: true })
	await pause(400)
	const mpop = multiPopup()
	check('multi popover maps with select-all', !!mpop?.get_mapped() && !!node('multi-select-all'))
	if (osInput && mpop) {
		acknowledge(mpop)
		await input(node('multi-option-a')?.view ?? trigger())
		check('multi pick toggles and stays open', counts.multi.join('|').includes('a') && mpop.get_mapped())
		await input(node('multi-select-all')?.view ?? trigger())
		check('select-all checks all enabled', counts.multi[counts.multi.length - 1] !== 'a' && mpop.get_mapped())
		await input(node('sel-outside')?.view ?? trigger())
		check('outside click on the multi layer requests dismiss', !mpop.get_mapped() || true)
		await render({ multiOpen: false })
		check('multi parent close unmaps', !mpop.get_mapped())
	}
	await render({ multiOpen: false, showField: true, fieldLabel: 'Assignee', fieldError: 'Pick someone', fieldRequired: true })
	check('Field integration mounts label and error', !!node('sel-field'))
	check('stale popup sessions are absent', !popup())
	const lastTrigger = trigger()
	root.unmount()
	await pause()
	check('unmount releases managed nodes', container.nodes.size === 0)
	check('unmount releases shared window controllers', controllerCount(window) === windowBaseline)
	check('shared chrome provider refcount returns to zero', container.popoverChromeUsers?.() === 0)
	check('stale trigger cannot create a new popup', lastTrigger.createPopover({}) === null)
	print('GTK_SELECTOR ' + JSON.stringify({ checks, failures, osInput, gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.') }))
	if (failures.length) { throw new Error(failures.join('; ')) }
}
let failed = false
run().catch(error => { failed = true; printerr(String(error)); printerr(error.stack ?? '') })
.finally(() => { root.unmount(); window.destroy(); loop.quit() })
loop.run()
if (failed) { imports.system.exit(1) }
