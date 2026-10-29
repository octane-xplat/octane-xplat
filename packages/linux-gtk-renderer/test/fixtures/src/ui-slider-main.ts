import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { SliderScene, SliderContextScene } from './ui-slider.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK slider test',
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
	if (!ok) failures.push(name)
}
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const slider = () => nodes('vx-slider')[0].view! as any
const bounds = (name: string) => nodes(name)[0]?.view?.getBounds()
const labels = () =>
	nodes('vx-slider-value')
		.map((n) => (n.view as any)?.get_text?.() ?? '')
		.join('')
let native: any
const named = (view: any, text: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, text) === null
const bool = (view: any, key: number, value: boolean) =>
	native.test_accessible_boolean_property(view, key, value) === null
const state = (view: any, key: number, value: number) =>
	native.test_accessible_state(view, key, value) === null
const changes: (number | [number, number])[] = []
let props: Parameters<typeof SliderScene>[0] = {
	label: 'Volume',
	width: 280,
	value: 25,
	min: 0,
	max: 100,
	step: 5,
	onValueChange: (value) => changes.push(value),
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(SliderScene, props)
	await pause()
}
const close = (a: number | undefined, b: number) => Math.abs((a ?? NaN) - b) <= 2
let acknowledgments = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: unknown, key: number) => {
	if (key !== 65481) return false
	acknowledgments++
	return true
})
window.add_controller(keys)
const osInput = GLib.getenv('GTK_SLIDER_OS') === '1'
async function input(action: {
	key?: string
	click?: boolean
	hover?: boolean
	drag?: { dx: number; dy?: number }
	fraction?: number
}) {
	const b = slider().getBounds(),
		ack = acknowledgments + 1
	print(
		'GTK_SLIDER_READY ' +
			JSON.stringify({ ...action, x: b.x + b.width * (action.fraction ?? 0.5), y: b.y + 14 }),
	)
	for (let i = 0; i < 200 && acknowledgments < ack; i++) await pause(25)
	check('OS phase completed', acknowledgments >= ack)
	await pause()
}
const numeric = (key: number, value: number) =>
	native.test_accessible_double_property(slider(), key, value) === null
async function run() {
	await render()
	window.present()
	await pause(260)
	native = (globalThis as any).imports.gi.XplatMason
	if (!native.test_accessible_double_property)
		throw new Error('Rebuild XplatMason for typed range checks')
	check('minimum metadata', numeric(Gtk.AccessibleProperty.VALUE_MIN, 0))
	check('maximum metadata', numeric(Gtk.AccessibleProperty.VALUE_MAX, 100))
	check('current value metadata', numeric(Gtk.AccessibleProperty.VALUE_NOW, 25))
	const original = slider()
	const thumb = nodes('vx-slider-thumb')[0]?.view
	check('one field owner', nodes('vx-field').length === 1)
	check('one visible field label', nodes('vx-field-label').length === 1)
	check('field width', close(bounds('vx-field')?.width, 280))
	check('slider width', close(slider().getBounds().width, 280))
	check('slider role', slider().get_accessible_role() === Gtk.AccessibleRole.SLIDER)
	check('slider name', named(slider(), 'Volume'))
	check('slider is a native focus stop', slider().get_focusable())
	check('required metadata', bool(slider(), Gtk.AccessibleProperty.REQUIRED, true))
	check('one scalar thumb', nodes('vx-slider-thumb').length === 1)
	check(
		'track spans the slider',
		close(bounds('vx-slider-track')?.width, slider().getBounds().width),
	)
	check(
		'quarter fill for scalar 25',
		close(bounds('vx-slider-fill')?.width, slider().getBounds().width / 4),
	)
	const initialThumb = bounds('vx-slider-thumb')
	check(
		'thumb stays inside the control',
		!!initialThumb &&
			initialThumb.x >= slider().getBounds().x - 1 &&
			initialThumb.x + initialThumb.width <=
				slider().getBounds().x + slider().getBounds().width + 1,
	)
	check(
		'authored id is unique',
		[...container.nodes.values()].filter((n) => n.props.id === 'slider-control').length === 1,
	)
	await render({ value: 75 })
	check(
		'programmatic value updates fill',
		close(bounds('vx-slider-fill')?.width, slider().getBounds().width * 0.75),
	)
	check('programmatic value retains host', slider() === original)
	check('programmatic value retains thumb', nodes('vx-slider-thumb')[0]?.view === thumb)
	check('programmatic value stays silent', changes.length === 0)
	await render({ isLoading: true, status: { type: 'error', message: 'Choose a level' } })
	check('busy slider metadata', state(slider(), Gtk.AccessibleState.BUSY, 1))
	check('invalid slider metadata', state(slider(), Gtk.AccessibleState.INVALID, 1))
	await render({ isReadOnly: true })
	check('readOnly slider metadata', bool(slider(), Gtk.AccessibleProperty.READ_ONLY, true))
	await render({ isReadOnly: false, isDisabled: true })
	check('disabled native sensitivity', !slider().is_sensitive())
	await render({ isDisabled: false, disabled: true })
	check('legacy disabled native sensitivity', !slider().is_sensitive())
	await render({ disabled: false, isLoading: false, status: undefined, value: [20, 80] })
	check('range renders two thumbs', nodes('vx-slider-thumb').length === 2)
	check('range class', nodes('vx-slider--range').length === 1)
	check(
		'range fill spans low to high',
		close(bounds('vx-slider-fill')?.width, slider().getBounds().width * 0.6),
	)
	check(
		'range fill starts at low value',
		close(bounds('vx-slider-fill')?.x, slider().getBounds().x + slider().getBounds().width * 0.2),
	)
	await render({
		value: 25,
		marks: [
			{ value: 0, label: 'Quiet' },
			{ value: 100, label: 'Loud' },
		],
		valueDisplay: 'text',
		formatValue: (value) => value + '%',
	})
	check('marks render labeled stops', nodes('vx-slider-mark').length === 2)
	check('formatted value text', labels() === '25%')
	check('single-value transition removes range thumb', nodes('vx-slider-thumb').length === 1)
	await render({ marks: undefined, valueDisplay: 'none' })
	check('marks can be removed', nodes('vx-slider-mark').length === 0)
	check('readout can be removed', nodes('vx-slider-value').length === 0)
	root.render(SliderContextScene, { value: 50 })
	await pause()
	check('external field is not duplicated', nodes('vx-field').length === 1)
	check('external field name', named(slider(), 'Parent level'))
	check('external readOnly state', bool(slider(), Gtk.AccessibleProperty.READ_ONLY, true))
	check(
		'external size cascade',
		nodes('vx-slider')[0].cssClasses?.has('vx-slider--size-sm') === true,
	)
	await render({ value: undefined, defaultValue: 40 })
	check(
		'uncontrolled default value seeds fill',
		close(bounds('vx-slider-fill')?.width, slider().getBounds().width * 0.4),
	)
	await render({ defaultValue: 90 })
	check(
		'default changes do not replace local state',
		close(bounds('vx-slider-fill')?.width, slider().getBounds().width * 0.4),
	)
	let accept = false
	await render({
		value: 40,
		defaultValue: undefined,
		step: 5,
		min: 0,
		max: 100,
		onValueChange(value) {
			changes.push(value)
			if (accept) {
				props = { ...props, value }
				root.render(SliderScene, props)
			}
		},
	})
	const inputOwner = slider()
	let retiringPopup: any
	if (osInput) {
		await input({ click: true })
		check('pointer focuses the slider', window.get_focus() === slider())
		await input({ key: 'Right' })
		check('rejected key reports candidate once', changes.length === 1 && changes[0] === 45)
		check('rejected key preserves geometry', close(bounds('vx-slider-fill')?.width, 112))
		check('rejected key preserves metadata', numeric(Gtk.AccessibleProperty.VALUE_NOW, 40))
		await input({ key: 'Right' })
		check('repeated key still uses the owner value', changes.length === 2 && changes[1] === 45)
		accept = true
		await input({ key: 'Right' })
		check(
			'accepted key updates the owner',
			props.value === 45 && numeric(Gtk.AccessibleProperty.VALUE_NOW, 45),
		)
		await input({ key: 'Up' })
		check('up increments', props.value === 50)
		await input({ key: 'Down' })
		check('down decrements', props.value === 45)
		await input({ key: 'Left' })
		check('left decrements', props.value === 40)
		await input({ key: 'Home' })
		check('Home selects the minimum', props.value === 0)
		const atMin = changes.length
		await input({ key: 'Left' })
		check('minimum suppresses duplicate change', changes.length === atMin)
		await input({ key: 'End' })
		check('End selects the maximum', props.value === 100)
		const atMax = changes.length
		await input({ key: 'Right' })
		check('maximum suppresses duplicate change', changes.length === atMax)
		await input({ key: 'Return' })
		await input({ key: 'space' })
		await input({ key: 'ctrl+Left' })
		check('activation and modified keys do not edit', changes.length === atMax)
		await render({ isReadOnly: true })
		await input({ key: 'Home' })
		check('readOnly blocks keyboard changes', changes.length === atMax && props.value === 100)
		await render({ isReadOnly: false, isDisabled: true })
		await input({ key: 'Home' })
		check('disabled blocks keyboard changes', changes.length === atMax && props.value === 100)
		await render({ isDisabled: false, value: 40 })
		await input({ drag: { dx: 56 }, fraction: 0.4 })
		check('scalar drag increments by distance and snaps', props.value === 60)
		check('scalar drag persists after release', numeric(Gtk.AccessibleProperty.VALUE_NOW, 60))
		await render({ value: [20, 80] })
		await input({ drag: { dx: 28 }, fraction: 0.8 })
		check('drag selects the nearest high thumb', JSON.stringify(props.value) === '[20,90]')
		await input({ key: 'Left' })
		check(
			'range keyboard input adjusts the upper endpoint',
			JSON.stringify(props.value) === '[20,85]' && numeric(Gtk.AccessibleProperty.VALUE_NOW, 85),
		)
		await input({ key: 'Right' })
		check(
			'range keyboard input restores the upper endpoint',
			JSON.stringify(props.value) === '[20,90]',
		)
		await input({ drag: { dx: 56 }, fraction: 0.2 })
		check('drag selects the nearest low thumb', JSON.stringify(props.value) === '[40,90]')
		await input({ drag: { dx: 196 }, fraction: 0.4 })
		check('low thumb cannot cross high thumb', JSON.stringify(props.value) === '[90,90]')
		await render({ value: 40 })
		accept = false
		await input({ drag: { dx: 56 }, fraction: 0.4 })
		check(
			'controlled rejected drag preserves the owner',
			props.value === 40 && numeric(Gtk.AccessibleProperty.VALUE_NOW, 40),
		)
		check(
			'controlled rejected drag keeps fill geometry',
			close(bounds('vx-slider-fill')?.width, 112),
		)
		await render({ value: undefined, defaultValue: 10 })
		await input({ key: 'Right' })
		check('uncontrolled keyboard edits persist', numeric(Gtk.AccessibleProperty.VALUE_NOW, 45))
		await input({ drag: { dx: 28 }, fraction: 0.45 })
		check('uncontrolled drag edits persist', numeric(Gtk.AccessibleProperty.VALUE_NOW, 55))
	}
	accept = true
	const beforeBounds = changes.length
	await render({ value: 3, min: 3, max: 28, step: 5, formatValue: (value) => 'Level ' + value })
	check('bounds updates stay silent', changes.length === beforeBounds)
	check('minimum metadata updates', numeric(Gtk.AccessibleProperty.VALUE_MIN, 3))
	check('maximum metadata updates', numeric(Gtk.AccessibleProperty.VALUE_MAX, 28))
	check(
		'formatted value metadata updates',
		native.test_accessible_string_property(
			slider(),
			Gtk.AccessibleProperty.VALUE_TEXT,
			'Level 3',
		) === null,
	)
	if (osInput) {
		await input({ key: 'Right' })
		check(
			'step is anchored to the minimum',
			props.value === 8 && numeric(Gtk.AccessibleProperty.VALUE_NOW, 8),
		)
		await input({ key: 'End' })
		check('End respects changed maximum', props.value === 28)
		await input({ key: 'Home' })
		check('Home respects changed minimum', props.value === 3)
	}
	if (osInput) {
		await render({ value: 21, min: 3, max: 28, step: 6 })
		await input({ key: 'End' })
		check(
			'End reaches maximum beyond the last step',
			props.value === 28 && numeric(Gtk.AccessibleProperty.VALUE_NOW, 28),
		)
	}
	await render({ value: 50, min: 50, max: 50, step: undefined, formatValue: undefined })
	check('equal bounds produce an empty finite fill', close(bounds('vx-slider-fill')?.width, 0))
	check('equal bounds keep the thumb finite', Number.isFinite(bounds('vx-slider-thumb')?.x))
	check('equal bounds metadata is valid', numeric(Gtk.AccessibleProperty.VALUE_NOW, 50))
	if (osInput) {
		const count = changes.length
		await input({ key: 'Right' })
		check('equal bounds do not emit changes', changes.length === count)
	}
	await render({ value: 150, min: 0, max: 100, step: 5 })
	check(
		'programmatic values clamp to the visual bounds',
		close(bounds('vx-slider-fill')?.width, 280),
	)
	check(
		'programmatic values clamp to semantic bounds',
		numeric(Gtk.AccessibleProperty.VALUE_NOW, 100),
	)
	check('input and metadata updates retain the native host', slider() === inputOwner)
	if (osInput) {
		await render({ value: 30, valueDisplay: 'tooltip', formatValue: (value) => value + '%' })
		await input({ key: 'Tab' })
		check(
			'Tab leaves the slider for the next control',
			window.get_focus() === nodes('slider-after')[0].view,
		)
		await pause(220)
		check('blur closes the value tooltip', nodes('vx-tooltip').length === 0)
		await input({ hover: true, fraction: 1.1 })
		await input({ hover: true, fraction: 0.3 })
		await pause(220)
		check('hover opens the value tooltip', nodes('vx-tooltip').length === 1)
		const hintText = () =>
			[...container.nodes.values()]
				.filter((n) => n.view instanceof Gtk.Label)
				.map((n) => (n.view as any).get_text())
		check('tooltip contains the formatted value', hintText().includes('30%'))
		check(
			'tooltip describes the interaction owner',
			Gtk.test_accessible_has_relation(slider(), Gtk.AccessibleRelation.DESCRIBED_BY),
		)
		const high = nodes('vx-slider-thumb')[0].view as any
		const popup = high.get_first_child()
		check(
			'value tooltip is anchored on the high thumb',
			popup instanceof Gtk.Popover && popup.get_parent() === high && popup.get_visible(),
		)
		await input({ hover: true, fraction: 1.1 })
		await pause(220)
		check('pointer exit closes the value tooltip', nodes('vx-tooltip').length === 0)
		await input({ key: 'shift+Tab' })
		await pause(220)
		check('keyboard focus opens the value tooltip', nodes('vx-tooltip').length === 1)
		await input({ key: 'Right' })
		check('open tooltip updates with the value', props.value === 35 && hintText().includes('35%'))
		check('value updates retain the tooltip surface', high.get_first_child() === popup)
		await input({ key: 'Escape' })
		check('Escape closes the tooltip', nodes('vx-tooltip').length === 0)
		check(
			'dismissal clears the description relation',
			!Gtk.test_accessible_has_relation(slider(), Gtk.AccessibleRelation.DESCRIBED_BY),
		)
		await render({ valueDisplay: 'text' })
		check(
			'readout mode change removes tooltip content',
			nodes('vx-tooltip').length === 0 && labels() === '35%',
		)
		check('readout mode change retains the input owner', slider() === inputOwner)
		check('text mode disposes the unused native tooltip', high.get_first_child() === null)
		await render({ valueDisplay: 'tooltip' })
		await input({ hover: true, fraction: 1.1 })
		await input({ hover: true, fraction: 0.35 })
		await pause(220)
		retiringPopup = high.get_first_child()
		check(
			'tooltip mode can reopen with a fresh native surface',
			retiringPopup instanceof Gtk.Popover &&
				retiringPopup !== popup &&
				retiringPopup.get_visible(),
		)
		check('retired tooltip remains detached', popup.get_parent() === null)
		check('reopened tooltip keeps the correct anchor', retiringPopup?.get_parent() === high)
	}
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	if (osInput)
		check('unmount while open detaches the tooltip surface', retiringPopup?.get_parent() === null)
	print(
		'GTK_SLIDER ' +
			JSON.stringify({
				checks,
				failures,
				osInput,
				gtk:
					Gtk.get_major_version() + '.' + Gtk.get_minor_version() + '.' + Gtk.get_micro_version(),
			}),
	)
	if (failures.length) throw new Error(failures.join('; '))
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
if (failed) (globalThis as any).imports.system.exit(1)
