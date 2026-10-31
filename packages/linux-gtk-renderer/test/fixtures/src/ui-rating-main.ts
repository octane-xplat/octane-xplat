import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { RatingScene, RatingContextScene } from './ui-rating.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK rating test',
	default_width: 360,
	default_height: 440,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 160) =>
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
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const group = () => nodes('vx-rating')[0].view! as any
const cells = () => nodes('vx-rating-cell')
let native: any
const named = (view: any, text: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, text) === null
const bool = (view: any, key: number, value: boolean) =>
	native.test_accessible_boolean_property(view, key, value) === null
const state = (view: any, key: number, value: number) =>
	native.test_accessible_state(view, key, value) === null
const changes: number[] = []
let props: Parameters<typeof RatingScene>[0] = {
	label: 'Trip rating',
	width: 280,
	value: 3,
	defaultValue: 1,
	max: 5,
	onValueChange: (value) => changes.push(value),
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(RatingScene, props)
	await pause()
}
const close = (a: number | undefined, b: number) => Math.abs((a ?? NaN) - b) <= 2
let acknowledgments = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: unknown, key: number) => {
	if (key !== 65481) {
		return false
	}
	acknowledgments++
	return true
})
window.add_controller(keys)
const osInput = GLib.getenv('GTK_RATING_OS') === '1'
async function input(view: any, action: { key?: string; click?: boolean }) {
	const b = view.getBounds(),
		ack = acknowledgments + 1
	print(
		'GTK_RATING_READY ' +
			JSON.stringify({ ...action, x: b.x + b.width / 2, y: b.y + b.height / 2 }),
	)
	for (let i = 0; i < 200 && acknowledgments < ack; i++) {
		await pause(25)
	}
	check('OS phase completed', acknowledgments >= ack)
	await pause()
}
const checked = (score: number) =>
	cells().every((node, i) => state(node.view, Gtk.AccessibleState.CHECKED, i + 1 === score ? 1 : 0))
async function run() {
	await render()
	window.present()
	await pause(260)
	native = (globalThis as any).imports.gi.XplatMason
	const original = cells().map((n) => n.view)
	check('five native score cells', cells().length === 5)
	check('one field owner', nodes('vx-field').length === 1)
	check('one visible group label', nodes('vx-field-label').length === 1)
	check('field width', close(nodes('vx-field')[0]?.view?.getBounds().width, 280))
	check('group width', close(group().getBounds().width, 280))
	check('group radio role', group().get_accessible_role() === Gtk.AccessibleRole.RADIO_GROUP)
	check('group name', named(group(), 'Trip rating'))
	check('required group metadata', bool(group(), Gtk.AccessibleProperty.REQUIRED, true))
	check(
		'score radio roles',
		cells().every((n) => n.view!.get_accessible_role() === Gtk.AccessibleRole.RADIO),
	)
	check(
		'score cells are focusable',
		cells().every((n) => n.view!.get_focusable()),
	)
	check(
		'numbered score names',
		cells().every((n, i) => named(n.view, String(i + 1) + ' of 5')),
	)
	check(
		'only the chosen score is checked',
		cells().every((n, i) => state(n.view, Gtk.AccessibleState.CHECKED, i === 2 ? 1 : 0)),
	)
	check('filled prefix follows the controlled score', nodes('vx-rating-cell--on').length === 3)
	check('one star glyph per score', nodes('vx-rating-glyph').length === 5)
	const b = cells().map((n) => n.view!.getBounds())
	check('cells form one row', b.every((v) => Math.abs(v.y - b[0].y) <= 2) && b[0].x < b[4].x)
	check(
		'cells fit inside the group',
		b.every(
			(v) =>
				v.x >= group().getBounds().x - 1 &&
				v.x + v.width <= group().getBounds().x + group().getBounds().width + 1,
		),
	)
	check(
		'authored id is unique',
		[...container.nodes.values()].filter((n) => n.props.id === 'rating-control').length === 1,
	)
	await render({ value: 4 })
	check('programmatic score updates fill', nodes('vx-rating-cell--on').length === 4)
	check(
		'programmatic score updates checked state',
		cells().every((n, i) => state(n.view, Gtk.AccessibleState.CHECKED, i === 3 ? 1 : 0)),
	)
	check(
		'programmatic score changes retain cells',
		cells().every((n, i) => n.view === original[i]),
	)
	check('programmatic score changes stay silent', changes.length === 0)
	await render({ isLoading: true, status: { type: 'error', message: 'Rate the trip' } })
	check('busy group metadata', state(group(), Gtk.AccessibleState.BUSY, 1))
	check('invalid group metadata', state(group(), Gtk.AccessibleState.INVALID, 1))
	await render({ isReadOnly: true })
	check('readOnly group metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	check(
		'readOnly cell metadata',
		cells().every((n) => bool(n.view, Gtk.AccessibleProperty.READ_ONLY, true)),
	)
	await render({ isReadOnly: false, isDisabled: true })
	check('disabled group sensitivity', !group().is_sensitive())
	check(
		'disabled cell sensitivity',
		cells().every((n) => !n.view!.is_sensitive()),
	)
	root.render(RatingContextScene, { value: 2, max: 5 })
	await pause()
	check('external field owner is not duplicated', nodes('vx-field').length === 1)
	check('external group name', named(group(), 'Parent rating'))
	check('external readOnly metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	check(
		'external size cascade',
		nodes('vx-rating')[0].cssClasses?.has('vx-rating--size-sm') === true,
	)
	await render({
		value: undefined,
		defaultValue: 2,
		isDisabled: false,
		isLoading: false,
		status: undefined,
	})
	check('uncontrolled default seeds the score', nodes('vx-rating-cell--on').length === 2)
	await render({ defaultValue: 4 })
	check('changing default does not replace local state', nodes('vx-rating-cell--on').length === 2)
	await render({ max: 7 })
	check('growing max adds cells', cells().length === 7)
	await render({ max: 0 })
	check('empty max removes cells', cells().length === 0)
	let accept = true
	await render({
		max: 5,
		value: 2,
		isDisabled: false,
		isReadOnly: false,
		onValueChange(value) {
			changes.push(value)
			if (accept && props.value !== undefined) {
				props = { ...props, value }
				root.render(RatingScene, props)
			}
		},
	})
	const inputCells = cells().map((n) => n.view)
	if (osInput) {
		nodes('rating-after')[0].view!.grab_focus()
		await input(group(), { key: 'shift+Tab' })
		check('Tab enters on the selected score', window.get_focus() === cells()[1].view)
		await input(group(), { key: 'Tab' })
		check('Tab exits the rating as one group', window.get_focus() === nodes('rating-after')[0].view)
		await input(group(), { key: 'shift+Tab' })
		await input(group(), { key: 'Right' })
		check('right arrow selects the next score', props.value === 3 && checked(3))
		await input(group(), { key: 'Up' })
		check('up arrow selects the previous score', props.value === 2 && checked(2))
		await input(cells()[0].view, { click: true })
		check(
			'pointer selects and focuses a score',
			props.value === 1 && window.get_focus() === cells()[0].view,
		)
		await input(group(), { key: 'Left' })
		check('arrows wrap between endpoint scores', props.value === 5 && checked(5))
		const count = changes.length
		await input(group(), { key: 'space' })
		await input(group(), { key: 'Return' })
		await input(group(), { key: 'ctrl+Right' })
		check('selected Space, Return and shortcuts do not emit changes', changes.length === count)
		await input(cells()[3].view, { click: true })
		check(
			'pointer selection updates the filled prefix',
			props.value === 4 && nodes('vx-rating-cell--on').length === 4 && checked(4),
		)
		const selectedCount = changes.length
		await input(cells()[3].view, { click: true })
		check('duplicate pointer selection is suppressed', changes.length === selectedCount)
		await render({ isReadOnly: true })
		await input(group(), { key: 'Right' })
		check(
			'readOnly arrows move focus without changing score',
			window.get_focus() === cells()[4].view && props.value === 4,
		)
		await input(group(), { key: 'space' })
		await input(cells()[0].view, { click: true })
		check('readOnly pointer focus remains available', window.get_focus() === cells()[0].view)
		check('readOnly input stays silent', changes.length === selectedCount && checked(4))
		await render({ isReadOnly: false, isDisabled: true })
		await input(cells()[2].view, { click: true })
		await input(group(), { key: 'Right' })
		check('disabled OS input stays silent', changes.length === selectedCount && props.value === 4)
		accept = false
		await render({ isDisabled: false, value: 2 })
		await input(cells()[4].view, { click: true })
		check('rejected pointer edit reports a candidate', changes.at(-1) === 5 && props.value === 2)
		check(
			'rejected pointer edit retains owner state',
			checked(2) && nodes('vx-rating-cell--on').length === 2,
		)
		const rejectCount = changes.length
		await input(cells()[4].view, { click: true })
		check(
			'repeated rejected pointer edits still report',
			changes.length === rejectCount + 1 && changes.at(-1) === 5,
		)
		await input(group(), { key: 'space' })
		check('rejected Space retains owner state', props.value === 2 && checked(2))
		accept = true
		await input(group(), { key: 'space' })
		check('accepted Space commits the focused score', props.value === 5 && checked(5))
		await input(group(), { key: 'Tab' })
		await input(group(), { key: 'shift+Tab' })
		check('Tab reentry uses the accepted score', window.get_focus() === cells()[4].view)
		await render({ style: { direction: 'rtl' } })
		check(
			'framework RTL style reaches every score',
			cells().every((n) => n.view!.get_direction() === Gtk.TextDirection.RTL),
		)
		check(
			'RTL reverses physical score order',
			cells()[0].view!.getBounds().x > cells()[4].view!.getBounds().x,
		)
		await input(group(), { key: 'Right' })
		check('RTL reverses horizontal radio navigation', props.value === 4 && checked(4))
		await render({ style: undefined })
		await render({ value: undefined, defaultValue: 1 })
		check('returning to local ownership restores its existing state', checked(2))
		await input(cells()[2].view, { click: true })
		check('uncontrolled pointer selection persists', props.value === undefined && checked(3))
		await render({ defaultValue: 5 })
		check('changed defaults do not replace user edits', checked(3))
	}
	await render({ icon: '☆' })
	check(
		'custom text character renders in every score',
		nodes('vx-rating-glyph').length === 5 &&
			nodes('vx-rating-glyph').every((n) => (n.view as any).get_text?.() === '☆'),
	)
	await render({ icon: 'rating-local', iconVersion: 1 })
	check(
		'scoped text icons render',
		nodes('vx-rating-glyph').every((n) => (n.view as any).get_text?.() === '+'),
	)
	await render({ iconVersion: 2 })
	await pause(220)
	check(
		'scoped registry changes update icon content',
		nodes('vx-rating-glyph').length === 5 &&
			nodes('vx-rating-glyph').every(
				(n) => n.view instanceof Gtk.Picture && (n.view as any).get_paintable() !== null,
			),
	)
	check(
		'registered icon size matches the rating glyph',
		nodes('vx-rating-glyph').every((n) => close(n.view?.getBounds().width, 20)),
	)
	await render({ icon: '☆' })
	check(
		'registered names take priority over text fallback',
		nodes('vx-rating-glyph').every((n) => (n.view as any).get_text?.() === 'R'),
	)
	await render({ icon: undefined })
	check(
		'dropping icon restores default stars',
		nodes('vx-rating-glyph').every((n) => (n.view as any).get_text?.() === '★'),
	)
	check(
		'glyph changes retain score identities',
		cells().every((n, i) => n.view === inputCells[i]),
	)
	await render({
		label: 'Score',
		accessibilityLabel: 'Trip score',
		isLabelHidden: true,
		size: 'sm',
		className: 'rating-custom',
		style: { height: 40 },
	})
	check('hidden label does not duplicate visible chrome', nodes('vx-field-label').length === 0)
	check('accessible name override reaches the group', named(group(), 'Trip score'))
	check('custom class reaches the group', nodes('rating-custom').length === 1)
	check('authored group height applies', close(group().getBounds().height, 40))
	check(
		'size update reaches the group',
		nodes('vx-rating')[0].cssClasses?.has('vx-rating--size-sm') === true,
	)
	await render({
		label: 'Trip rating',
		accessibilityLabel: undefined,
		isLabelHidden: false,
		size: undefined,
		className: undefined,
		style: undefined,
		isOptional: true,
		isRequired: true,
		width: '50%',
	})
	check('custom class resets', nodes('rating-custom').length === 0)
	check('authored height resets', group().getBounds().height < 40)
	check('name override resets', named(group(), 'Trip rating'))
	check('optional wins over required', bool(group(), Gtk.AccessibleProperty.REQUIRED, false))
	check('percentage field width applies', close(group().getBounds().width, 160))
	const current = cells().map((n) => n.view)
	await render({ max: 7, width: 280 })
	check(
		'growing the score range retains prefix cells',
		cells()
			.slice(0, 5)
			.every((n, i) => n.view === current[i]),
	)
	check(
		'score names track the maximum',
		cells().every((n, i) => named(n.view, String(i + 1) + ' of 7')),
	)
	check('score ids remain unique', new Set(cells().map((n) => n.props.id)).size === 7)
	await render({ max: 0 })
	check('empty range can be restored after input', cells().length === 0)
	await render({ max: 3, value: 2 })
	check('repopulating creates a valid checked group', cells().length === 3 && checked(2))
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	print(
		'GTK_RATING ' +
			JSON.stringify({
				checks,
				failures,
				osInput,
				gtk:
					Gtk.get_major_version() + '.' + Gtk.get_minor_version() + '.' + Gtk.get_micro_version(),
			}),
	)
	if (failures.length) {
		throw new Error(failures.join('; '))
	}
	window.destroy()
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	printerr(String(error))
	printerr(error.stack ?? '')
	try {
		root.unmount()
	} catch {}
	window.destroy()
	loop.quit()
})
loop.run()
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
