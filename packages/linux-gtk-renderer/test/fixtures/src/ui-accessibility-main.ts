import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Accessibility, inputRef } from './ui-accessibility.gtk'
Gtk.init()
const window = new Gtk.Window({ default_width: 340, default_height: 420 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 80, () => {
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
let props: Parameters<typeof Accessibility>[0] = {}
const render = () => root.render(Accessibility, props)
let native: any
const state = (view: any, key: string, expected: number | boolean) => {
	const message = native.test_accessible_state(view, Gtk.AccessibleState[key], Number(expected))
	check('stored state ' + key + '=' + expected + ': ' + message, message === null)
}
const property = (view: any, key: string, expected: boolean) => {
	const message = native.test_accessible_boolean_property(
		view,
		Gtk.AccessibleProperty[key],
		expected,
	)
	check('stored property ' + key + '=' + expected + ': ' + message, message === null)
}
const textProperty = (view: any, key: string, expected: string) => {
	const message = native.test_accessible_string_property(
		view,
		Gtk.AccessibleProperty[key],
		expected,
	)
	check('stored text ' + key + ': ' + message, message === null)
}
async function run() {
	render()
	window.present()
	await pause()
	native = (globalThis as any).imports.gi.XplatMason
	if (!native.test_accessible_state)
		throw new Error('Rebuild XplatMason for native accessibility assertions')
	const box = node('a11y-state').view!,
		entry = node('a11y-entry').view!,
		toggle = node('a11y-switch').view!
	props = {
		state: {
			disabled: true,
			selected: true,
			checked: true,
			pressed: false,
			busy: true,
			expanded: false,
			invalid: true,
			required: true,
			readOnly: true,
		},
	}
	render()
	await pause()
	for (const [key, value] of Object.entries({
		DISABLED: true,
		SELECTED: true,
		CHECKED: Gtk.AccessibleTristate.TRUE,
		PRESSED: Gtk.AccessibleTristate.FALSE,
		BUSY: true,
		EXPANDED: false,
		INVALID: Gtk.AccessibleInvalidState.TRUE,
	}))
		state(box, key, value)
	property(box, 'REQUIRED', true)
	property(box, 'READ_ONLY', true)
	check('accessibility-only disabled does not change interaction', box.get_sensitive())
	props = {
		state: {
			disabled: false,
			selected: false,
			checked: 'mixed',
			pressed: 'mixed',
			busy: false,
			expanded: true,
			invalid: 'grammar',
			required: false,
			readOnly: false,
		},
	}
	render()
	await pause()
	for (const [key, value] of Object.entries({
		DISABLED: false,
		SELECTED: false,
		CHECKED: Gtk.AccessibleTristate.MIXED,
		PRESSED: Gtk.AccessibleTristate.MIXED,
		BUSY: false,
		EXPANDED: true,
		INVALID: Gtk.AccessibleInvalidState.GRAMMAR,
	}))
		state(box, key, value)
	property(box, 'REQUIRED', false)
	property(box, 'READ_ONLY', false)
	props = {}
	render()
	await pause()
	for (const key of ['SELECTED', 'CHECKED', 'PRESSED', 'BUSY', 'EXPANDED', 'INVALID'])
		check(
			'removed state resets ' + key,
			!Gtk.test_accessible_has_state(box, Gtk.AccessibleState[key]),
		)
	check(
		'removed required property resets',
		!Gtk.test_accessible_has_property(box, Gtk.AccessibleProperty.REQUIRED),
	)
	check(
		'removed readonly metadata resets on generic view',
		!Gtk.test_accessible_has_property(box, Gtk.AccessibleProperty.READ_ONLY),
	)
	for (const [value, key, expected] of [
		['disabled', 'DISABLED', 1],
		['selected', 'SELECTED', 1],
		['checked', 'CHECKED', Gtk.AccessibleTristate.TRUE],
		['unchecked', 'CHECKED', Gtk.AccessibleTristate.FALSE],
	] as const) {
		props = { state: value }
		render()
		await pause()
		state(box, key, expected)
	}
	props = { enabled: false, state: { disabled: false } }
	render()
	await pause()
	state(box, 'DISABLED', true)
	check('metadata cannot erase real disabled sensitivity', !box.get_sensitive())
	props = { enabled: true }
	render()
	await pause()
	state(box, 'DISABLED', false)
	props = { hidden: true, state: { hidden: false } }
	render()
	await pause()
	state(box, 'HIDDEN', true)
	props = { hidden: false }
	render()
	await pause()
	state(box, 'HIDDEN', false)
	props = { editBlocked: true, entryState: { readOnly: false } }
	render()
	await pause()
	property(entry, 'READ_ONLY', true)
	check(
		'readonly metadata follows actual GtkEditable',
		!entry.get_editable() && entry.get_sensitive(),
	)
	props = {}
	render()
	await pause()
	property(entry, 'READ_ONLY', false)
	props = { active: true, switchState: { checked: false } }
	render()
	await pause()
	state(toggle, 'CHECKED', Gtk.AccessibleTristate.FALSE)
	props = { active: true }
	render()
	await pause()
	state(toggle, 'CHECKED', Gtk.AccessibleTristate.TRUE)
	check('removing explicit checked restores native switch value', toggle.get_active())
	props = {
		input: {
			label: 'Account',
			description: 'Work address',
			status: { type: 'error', message: 'Required address' },
			isRequired: true,
			isReadOnly: true,
			isLoading: true,
			isDisabled: true,
			disabledMessage: 'Waiting for verification',
			defaultValue: 'Stored',
		},
	}
	render()
	await pause()
	const shared = inputRef.current!.native as any
	check('shared TextInput still uses a real GtkEntry', shared instanceof Gtk.Entry)
	property(shared, 'REQUIRED', true)
	property(shared, 'READ_ONLY', true)
	state(shared, 'DISABLED', true)
	state(shared, 'BUSY', true)
	state(shared, 'INVALID', Gtk.AccessibleInvalidState.TRUE)
	textProperty(shared, 'LABEL', 'Account')
	textProperty(shared, 'DESCRIPTION', 'Work address. Required address. Waiting for verification')
	check(
		'shared readonly/disabled state also changes actual editing',
		!shared.get_editable() && !shared.get_sensitive(),
	)
	props = {
		input: {
			label: 'Account',
			isOptional: true,
			isRequired: true,
			isReadOnly: false,
			isLoading: false,
			isDisabled: false,
			status: { type: 'success', message: 'Ready' },
		},
	}
	render()
	await pause()
	property(inputRef.current!.native, 'REQUIRED', false)
	property(inputRef.current!.native, 'READ_ONLY', false)
	state(inputRef.current!.native, 'DISABLED', false)
	state(inputRef.current!.native, 'BUSY', false)
	state(inputRef.current!.native, 'INVALID', Gtk.AccessibleInvalidState.FALSE)
	check(
		'optional wins over required',
		!(node('a11y-shared').props.accessibilityState as any).required,
	)
	root.unmount()
	await pause()
	check('all state-bearing nodes disposed', container.nodes.size === 0 && inputRef.current === null)
	print(
		'GTK_ACCESSIBILITY ' +
			JSON.stringify({
				checks,
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
