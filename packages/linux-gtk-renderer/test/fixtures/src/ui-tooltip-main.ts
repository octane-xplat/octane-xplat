import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Tooltips, lifetime } from './ui-tooltip.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK tooltip test',
	default_width: 900,
	default_height: 350,
	decorated: false,
})
const scroll = new Gtk.ScrolledWindow()
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
scroll.set_child(host)
window.set_child(scroll)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 100) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const popup = (anchor: any) => {
	for (let child = anchor.get_first_child(); child; child = child.get_next_sibling())
		if (child instanceof Gtk.Popover) return child
	throw new Error('no native popover')
}
const emit = (anchor: any, type: string) => {
	const model = anchor.observe_controllers()
	for (let i = 0; i < model.get_n_items(); i++) {
		const controller = model.get_item(i)
		if (controller instanceof Gtk.EventControllerMotion) {
			if (type === 'enter') controller.emit('enter', 0, 0)
			else controller.emit('leave')
		}
	}
}
let props: Parameters<typeof Tooltips>[0] = { value: 'First' }
const render = () => root.render(Tooltips, props)
let ack = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_controller: any, key: number) => {
	if (key === 65481) {
		ack++
		return true
	}
	return false
})
window.add_controller(keys)
async function phase(name: string) {
	const bounds = node('tip-anchor').view!.getBounds()
	const next = ack + 1
	print(
		'GTK_TOOLTIP_READY ' +
			JSON.stringify({
				phase: name,
				x: bounds.x + bounds.width / 2,
				y: bounds.y + bounds.height / 2,
			}),
	)
	for (let i = 0; i < 250 && ack < next; i++) await pause(20)
	check('OS phase completed ' + name, ack >= next)
	await pause(140)
}
let osInput = false
async function run() {
	render()
	window.present()
	await pause(200)
	const anchor = node('tip-anchor').view!,
		field = node('tip-entry').view!,
		peer = node('tip-peer').view!
	peer.focus()
	await pause()
	const native = popup(anchor)
	check('native tooltip starts hidden', !native.get_visible())
	const initialMounts = lifetime.mounts,
		initialUnmounts = lifetime.unmounts
	check('initial automatic focus content has been cleaned', initialMounts === initialUnmounts)
	emit(anchor, 'enter')
	await pause(25)
	check('open delay is respected', !native.get_visible())
	emit(anchor, 'leave')
	await pause(130)
	check(
		'leaving before open cancels pending intent',
		!native.get_visible() && lifetime.mounts === initialMounts,
	)
	emit(anchor, 'enter')
	await pause(140)
	check(
		'hover intent opens mapped native popup',
		native.get_mapped() && native.get_width() > 0 && native.get_height() > 0,
	)
	check('portal content receives provider value', node('tip-content').view!.get_text() === 'First')
	const pane = [...container.nodes.values()].find((n) => n.cssClasses.has('tip-custom'))!
	check(
		'content style reaches the pane',
		['Top', 'Right', 'Bottom', 'Left'].every(
			(side) =>
				parseFloat(
					String(pane.computedStyle?.['padding' + side] ?? pane.computedStyle?.padding),
				) === 12,
		),
	)
	const [inside, rect] = node('tip-content').view!.compute_bounds(pane.view)
	const [paneOk, paneRect] = pane.view!.compute_bounds(pane.view)
	const padding = pane.view!.get_style_context().get_padding()
	// GTK widget coordinates start at the content origin; its border box
	// extends into negative padding coordinates.
	check(
		'content padding reaches native allocation',
		inside &&
			paneOk &&
			rect.origin.x - paneRect.origin.x >= 12 &&
			rect.origin.y - paneRect.origin.y >= 12 &&
			padding.left === 12 &&
			padding.right === 12 &&
			padding.top === 12 &&
			padding.bottom === 12,
	)

	check(
		'tooltip exposes the native tooltip role',
		native.get_child().get_accessible_role() === Gtk.AccessibleRole.TOOLTIP,
	)
	check(
		'trigger references the tooltip description',
		Gtk.test_accessible_has_relation(field, Gtk.AccessibleRelation.DESCRIBED_BY),
	)
	check('tooltip has a real nonempty native surface', native.get_surface().get_width() > 0)
	check('hover does not move keyboard focus', window.get_focus() === peer.get_delegate())
	check('tooltip content cannot receive pointer input', !native.get_can_target())
	const content = node('tip-content').view!
	props = { ...props, value: 'Updated', placement: 'right' }
	render()
	await pause()
	check(
		'open tooltip updates content in the same root',
		node('tip-content').view === content && content.get_text() === 'Updated',
	)
	check(
		'provider update does not remount content',
		lifetime.mounts === initialMounts + 1 && lifetime.unmounts === initialUnmounts,
	)
	for (const [placement, position] of [
		['top', Gtk.PositionType.TOP],
		['bottom', Gtk.PositionType.BOTTOM],
		['left', Gtk.PositionType.LEFT],
		['right', Gtk.PositionType.RIGHT],
	] as const) {
		props = { ...props, placement }
		render()
		await pause()
		check('placement updates native popover: ' + placement, native.get_position() === position)
	}
	const surface = native.get_surface()
	const beforeX = surface.get_position_x()
	const beforeWidth = anchor.get_width()
	anchor.style.width = 420
	await pause(160)
	check(
		'native popup follows an anchor allocation change: ' +
			JSON.stringify({
				beforeX,
				afterX: surface.get_position_x(),
				beforeWidth,
				afterWidth: anchor.get_width(),
			}),
		anchor.get_width() > beforeWidth + 100 && surface.get_position_x() > beforeX + 100,
	)
	delete anchor.style.width
	await pause(160)
	emit(anchor, 'leave')
	await pause(25)
	check('close delay retains open panel', native.get_visible())
	emit(anchor, 'enter')
	await pause(25)
	check('reenter cancels delayed close', native.get_visible())
	emit(anchor, 'leave')
	await pause(140)
	check(
		'close removes content and runs cleanup',
		!native.get_visible() && !node('tip-content') && lifetime.unmounts === initialUnmounts + 1,
	)
	emit(anchor, 'enter')
	props = { ...props, disabled: true }
	render()
	await pause(140)
	check('disabled update cancels pending opening', !native.get_visible())
	field.focus()
	await pause()
	check('disabled tooltip ignores focus intent', !native.get_visible())
	peer.focus()
	props = { ...props, disabled: false, openDelay: 1000 }
	render()
	await pause()
	field.focus()
	await pause()
	check('focus opens immediately despite hover delay', native.get_visible() && native.get_mapped())
	check('focus stays in trigger entry', window.get_focus() === field.get_delegate())
	props = { ...props, disabled: true }
	render()
	await pause()
	check(
		'disabling an open tooltip closes its content',
		!native.get_visible() && !node('tip-content'),
	)
	props = { ...props, disabled: false }
	render()
	peer.focus()
	await pause()
	field.focus()
	await pause()
	check('reenabled tooltip responds to fresh focus', native.get_visible())
	peer.focus()
	await pause()
	check('blur closes immediately', !native.get_visible())
	check(
		'closing removes the description reference',
		!Gtk.test_accessible_has_relation(field, Gtk.AccessibleRelation.DESCRIBED_BY),
	)
	const plain = node('plain-anchor').view!
	emit(plain, 'enter')
	await pause()
	check(
		'primitive tooltip content becomes a native label',
		[...container.nodes.values()].some(
			(n) => n.type === 'label' && n.view!.get_text() === 'Plain tooltip',
		),
	)
	emit(plain, 'leave')
	await pause(160)
	node('plain-button').view!.focus()
	await pause()
	check(
		'focusable button trigger opens tooltip immediately',
		popup(plain).get_visible() &&
			Gtk.test_accessible_has_relation(
				node('plain-button').view!,
				Gtk.AccessibleRelation.DESCRIBED_BY,
			),
	)
	peer.focus()
	await pause()
	const info = [...container.nodes.values()].find(
		(n) => n.props.accessibilityLabel === 'More about Email',
	)!
	const fieldAnchor = info.view!.get_parent()
	emit(fieldAnchor, 'enter')
	await pause(600)
	check('shared field labelTooltip resolves GTK leaf', popup(fieldAnchor).get_mapped())
	check(
		'field tooltip renders supplied text',
		[...container.nodes.values()].some(
			(n) => n.type === 'label' && n.view!.get_text() === 'Work account',
		),
	)
	emit(fieldAnchor, 'leave')
	await pause(160)
	props = { ...props, openDelay: 80 }
	render()
	await pause()
	if (GLib.getenv('GTK_TOOLTIP_OS') === '1') {
		await phase('hover')
		check('actual OS pointer opens tooltip', native.get_mapped())
		await phase('leave')
		check('actual OS pointer leave closes tooltip', !native.get_visible())
		peer.focus()
		await pause()
		await phase('focus')
		check(
			'actual Tab focuses trigger and opens tooltip',
			window.get_focus() === field.get_delegate() && native.get_mapped(),
		)
		await phase('escape')
		check(
			'actual Escape dismisses without moving focus',
			!native.get_visible() && window.get_focus() === field.get_delegate(),
		)
		osInput = true
	}
	peer.focus()
	await pause()
	field.focus()
	await pause()
	check('tooltip can reopen after dismissal', native.get_visible())
	scroll.vadjustment.set_value(120)
	await pause()
	check('ancestor scrolling dismisses tooltip', !native.get_visible())
	scroll.vadjustment.set_value(0)
	await pause()
	peer.focus()
	await pause()
	emit(anchor, 'enter')
	const controllers = anchor.observe_controllers().get_n_items()
	props = { ...props, show: false }
	render()
	await pause(160)
	check(
		'unmount cancels pending tooltip intent',
		!native.get_visible() && native.get_parent() === null,
	)
	check(
		'anchor disposal removes owned controllers',
		anchor.observe_controllers().get_n_items() < controllers,
	)
	check(
		'disposed anchor cannot create a tooltip',
		anchor.createTooltip({ onOpen() {}, onClose() {} }) === null,
	)
	root.unmount()
	await pause()
	check('all managed content is removed', container.nodes.size === 0)
	check('all tooltip content effects were cleaned', lifetime.mounts === lifetime.unmounts)
	print(
		'GTK_TOOLTIP ' +
			JSON.stringify({
				checks,
				osInput,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
		printerr(error.stack ?? String(error))
	})
	.finally(() => {
		root.unmount()
		window.destroy()
		loop.quit()
	})
loop.run()
if (failure) throw failure
