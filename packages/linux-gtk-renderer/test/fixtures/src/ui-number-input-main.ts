import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { NumberScene, NumberContextScene } from './ui-number-input.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK number input test',
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
const pause = (ms = 140) =>
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
const close = (a: number, b: number) => Math.abs(a - b) <= 2
let props: Parameters<typeof NumberScene>[0] = {
	defaultValue: 2,
	label: 'Quantity',
	description: 'Choose amount',
	width: 280,
	min: 0,
	max: 10,
	step: 0.5,
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(NumberScene, props)
	await pause()
}
const entry = () => [...container.nodes.values()].find((n) => n.type === 'textfield')!.view! as any
let native: any
const named = (view: any, name: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, name) === null
const state = (key: number, value: number) =>
	native.test_accessible_state(entry(), key, value) === null
const text = (name: string) =>
	nodes(name)
		.map((n) => (n.view as any).get_text?.() ?? '')
		.join('|')
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
const osInput = GLib.getenv('GTK_NUMBER_OS') === '1'
async function input(view: any, action: { type?: string; key?: string; click?: boolean }) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_NUMBER_READY ' +
			JSON.stringify({
				...action,
				x: bounds.x + bounds.width / 2,
				y: bounds.y + bounds.height / 2,
			}),
	)
	for (let i = 0; i < 200 && acknowledgments < ack; i++) {
		await pause(25)
	}
	check('OS phase completed', acknowledgments >= ack)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause(240)
	native = (globalThis as any).imports.gi.XplatMason
	const original = entry()
	check('native Entry', original instanceof Gtk.Entry)
	check('default value', original.text === '2')
	check('one field owner', nodes('vx-field').length === 1)
	check('field width', close(nodes('vx-field')[0].view!.getBounds().width, 280))
	check('native field label', named(original, 'Quantity'))
	check(
		'description reaches native hint',
		native.test_accessible_string_property(
			original,
			Gtk.AccessibleProperty.DESCRIPTION,
			'Choose amount',
		) === null,
	)
	check(
		'required form default',
		native.test_accessible_boolean_property(original, Gtk.AccessibleProperty.REQUIRED, true) ===
			null,
	)
	check(
		'control id belongs to editor',
		[...container.nodes.values()].find((n) => n.view === original)!.props.id === 'number-control',
	)
	check('default two steppers', nodes('vx-inputnumber-step').length === 2)
	check(
		'steppers have button semantics',
		nodes('vx-inputnumber-step').every(
			(n) => n.view!.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
		),
	)
	const bounds = original.getBounds()
	const minus = nodes('vx-inputnumber-step')[0].view!.getBounds()
	const plus = nodes('vx-inputnumber-step')[1].view!.getBounds()
	check(
		'steppers flank the editor horizontally',
		minus.x + minus.width <= bounds.x + 2 && bounds.x + bounds.width <= plus.x + 2,
	)
	check(
		'steppers share the editor row',
		Math.abs(minus.y - plus.y) <= 2 && bounds.y < minus.y + minus.height,
	)
	check(
		'numeric shell consumes field width',
		close(nodes('vx-inputnumber')[0].view!.getBounds().width, 280),
	)
	check(
		'stepper accessible names',
		named(nodes('vx-inputnumber-step')[0].view!, 'Decrement') &&
			named(nodes('vx-inputnumber-step')[1].view!, 'Increment'),
	)
	check(
		'steppers accept keyboard focus',
		nodes('vx-inputnumber-step').every((n) => n.view!.get_focusable()),
	)
	await render({ units: 'kg', hasNumberSteppers: false, hasClear: true })
	check('units shown', text('vx-inputnumber-units') === 'kg')
	check('steppers can hide', nodes('vx-inputnumber-step').length === 0)
	check('clear available', nodes('vx-inputnumber-clear').length === 1)
	check(
		'clear has named button semantics',
		nodes('vx-inputnumber-clear')[0]?.view?.get_accessible_role() === Gtk.AccessibleRole.BUTTON &&
			named(nodes('vx-inputnumber-clear')[0].view!, 'Clear value'),
	)
	check(
		'clear accepts keyboard focus',
		nodes('vx-inputnumber-clear')[0]?.view?.get_focusable() === true,
	)

	check('editor retained after chrome changes', entry() === original)
	await render({ value: 3.5, formatValue: (value) => value.toFixed(2) })
	check('formatted controlled number', original.text === '3.50')
	await render({ value: null })
	check('explicit null empty', original.text === '')
	check('empty clear hidden', nodes('vx-inputnumber-clear').length === 0)
	await render({
		value: 4,
		formatValue: undefined,
		hasNumberSteppers: true,
		isReadOnly: true,
		isLoading: true,
		status: { type: 'error', message: 'Invalid amount' },
	})
	check('readOnly editor', !original.get_editable())
	check(
		'readOnly metadata',
		native.test_accessible_boolean_property(original, Gtk.AccessibleProperty.READ_ONLY, true) ===
			null,
	)
	check('busy metadata', state(Gtk.AccessibleState.BUSY, 1))
	check('invalid metadata', state(Gtk.AccessibleState.INVALID, 1))
	check(
		'readOnly steppers disabled',
		nodes('vx-inputnumber-step').every((n) => !n.view!.is_sensitive()),
	)
	await render({ isReadOnly: false, isLoading: false, isDisabled: true })
	check('disabled native editor', !original.is_sensitive())
	check(
		'disabled steppers',
		nodes('vx-inputnumber-step').every((n) => !n.view!.is_sensitive()),
	)
	const changes: (number | null)[] = []
	const order: string[] = []
	await render({
		value: undefined,
		hasClear: true,
		isDisabled: false,
		isReadOnly: false,
		isLoading: false,
		status: undefined,
		onValueChange: (value) => {
			changes.push(value)
			order.push('change:' + value)
		},
		onClear: () => order.push('clear'),
	})
	check('controlled to local restores local number', original.text === '2')
	await render({
		defaultValue: 9,
		width: '75%',
		size: 'lg',
		isOptional: true,
		label: 'Changed quantity',
		description: undefined,
	})
	check('default updates do not reset local owner', original.text === '2')
	check(
		'percentage width consumed once',
		close(nodes('vx-field')[0].view!.getBounds().width, 240) &&
			close(nodes('vx-inputnumber')[0].view!.getBounds().width, 240),
	)
	check(
		'explicit size reaches number shell and editor',
		nodes('vx-inputnumber')[0].cssClasses?.has('vx-inputnumber--size-lg') === true &&
			[...container.nodes.values()]
				.find((n) => n.view === original)!
				.cssClasses?.has('vx-input--size-lg') === true,
	)
	check(
		'changed label names retained editor',
		named(original, 'Changed quantity') && entry() === original,
	)
	check(
		'optional overrides required form',
		native.test_accessible_boolean_property(original, Gtk.AccessibleProperty.REQUIRED, false) ===
			null,
	)
	check(
		'reset restores editor enabled and editable',
		original.is_sensitive() && original.get_editable(),
	)
	check(
		'reset clears busy and invalid states',
		state(Gtk.AccessibleState.BUSY, 0) && state(Gtk.AccessibleState.INVALID, 0),
	)
	await render({
		width: 280,
		size: undefined,
		isOptional: undefined,
		isLabelHidden: true,
		className: 'number-custom',
		style: { opacity: 0.6 },
	})
	check('custom class applies to numeric shell', nodes('number-custom').length === 1)
	check(
		'dynamic opacity applies',
		Math.abs(nodes('vx-inputnumber')[0].view!.get_opacity() - 0.6) < 0.02,
	)
	check(
		'size resets to inherited default',
		nodes('vx-inputnumber')[0].cssClasses?.has('vx-inputnumber--size-md') === true,
	)
	check('hidden label keeps accessible name', named(original, 'Changed quantity'))
	await render({ className: undefined, style: undefined })
	check(
		'class and opacity reset without replacing editor',
		nodes('number-custom').length === 0 &&
			nodes('vx-inputnumber')[0].view!.get_opacity() === 1 &&
			entry() === original,
	)

	if (osInput) {
		await input(nodes('vx-inputnumber-step')[1].view!, { click: true })
		check('OS increment uses fractional step', original.text === '2.5' && changes.at(-1) === 2.5)
		original.grab_focus()
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '3.5' })
		check(
			'OS decimal typing preserves decimal point',
			original.text === '3.5' && changes.at(-1) === 3.5,
		)
		order.length = 0
		const clear = nodes('vx-inputnumber-clear')[0]?.view
		if (clear) {
			await input(clear, { click: true })
		}
		check(
			'OS clear reports null before clear callback',
			order.join('|') === 'change:null|clear' && original.text === '',
		)
		check(
			'clear focuses retained editor',
			window.get_focus() === original || window.get_focus()?.is_ancestor(original),
		)
		const plus = nodes('vx-inputnumber-step')[1].view!
		plus.grab_focus()
		await input(plus, { key: 'space' })
		check(
			'keyboard step starts empty number from zero',
			original.text === '0.5' && changes.at(-1) === 0.5,
		)
		await render({ min: -10 })
		original.grab_focus()
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '-2.5' })
		check('OS signed decimal typing', original.text === '-2.5' && changes.at(-1) === -2.5)
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '.75' })
		check('OS leading decimal typing', original.text === '.75' && changes.at(-1) === 0.75)
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '1e1' })
		check('OS exponent typing', original.text === '1e1' && changes.at(-1) === 10)
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '99' })
		check('OS numeric edits clamp to bounds', original.text === '10' && changes.at(-1) === 10)
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '3.5' })
		await render({ formatValue: (value) => value.toFixed(2) })
		nodes('vx-inputnumber-step')[1].view!.grab_focus()
		await pause()
		check('blur formats committed numeric value', original.text === '3.50')
		await render({ formatValue: (value) => 'USD ' + value.toFixed(2) })
		original.grab_focus()
		await pause()
		check('formatted values expose raw number while editing', original.text === '3.5')
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '-1.25' })
		check(
			'formatted numeric input accepts signed edits',
			original.text === '-1.25' && changes.at(-1) === -1.25,
		)
		nodes('vx-inputnumber-step')[1].view!.grab_focus()
		await pause()
		check('formatted numeric input commits display on blur', original.text === 'USD -1.25')
		await render({ formatValue: undefined })
		await render({
			value: 4,
			onValueChange: (value) => {
				changes.push(value)
				props = { ...props, value }
				root.render(NumberScene, props)
			},
		})
		original.grab_focus()
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '8' })
		check('controlled owner accepts OS number', original.text === '8' && props.value === 8)
		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '6.25' })
		check(
			'controlled decimal owner accepts numeric draft',
			original.text === '6.25' && props.value === 6.25,
		)
		await render({ value: 8, onValueChange: (value) => changes.push(value) })

		await input(original, { key: 'ctrl+a' })
		await input(original, { type: '9' })
		check('controlled rejected edit restores number', original.text === '8' && changes.at(-1) === 9)
		await input(original, { key: 'ctrl+a' })
		await input(original, { key: 'BackSpace' })
		check(
			'controlled rejected clear reports null',
			original.text === '8' && changes.at(-1) === null,
		)
		await render({ value: null })
		await input(nodes('vx-inputnumber-step')[1].view!, { click: true })
		check(
			'explicit controlled null steps from zero',
			original.text === '' && changes.at(-1) === 0.5,
		)
	}
	if (osInput) {
		await render({ value: 4, isReadOnly: true })
		const count = changes.length
		original.grab_focus()
		await input(original, { type: '2' })
		check('readOnly native input does not edit', original.text === '4' && changes.length === count)
		await render({ isReadOnly: false, isDisabled: true })
		await input(nodes('vx-inputnumber-step')[1].view!, { click: true })
		check(
			'disabled pointer action does not edit',
			original.text === '4' && changes.length === count,
		)
	}
	const oldChangeCount = changes.length
	root.render(NumberContextScene, { defaultValue: 6 })
	await pause()
	check('external Field has one owner', nodes('vx-field').length === 1)
	check('external label names editor', named(entry(), 'Parent amount'))
	check('external readOnly applies', !entry().get_editable())
	check(
		'external size applies',
		nodes('vx-inputnumber')[0].cssClasses?.has('vx-inputnumber--size-sm') === true,
	)
	check(
		'external state blocks steppers',
		nodes('vx-inputnumber-step').every((n) => !n.view!.is_sensitive()),
	)
	root.render(NumberContextScene, { defaultValue: 9, label: 'Child amount', size: 'lg' })
	await pause()
	check('external owner preserves numeric local value', entry().text === '6')
	check('child label can override group field name', named(entry(), 'Child amount'))
	check(
		'explicit child size overrides field size',
		nodes('vx-inputnumber')[0].cssClasses?.has('vx-inputnumber--size-lg') === true,
	)
	original.set_text('99')
	await pause()
	check('replaced editor cannot report retired numeric edits', changes.length === oldChangeCount)
	const last = entry()
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0 && last.get_parent() === null)

	print(
		'GTK_NUMBER ' +
			JSON.stringify({
				checks,
				osInput,
				failures,
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
	printerr(error.stack ?? error)
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
