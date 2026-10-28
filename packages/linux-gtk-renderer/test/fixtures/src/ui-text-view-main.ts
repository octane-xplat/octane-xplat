import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Multiline, changes, submits, focusEvents } from './ui-text-view.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK multiline test',
	default_width: 280,
	default_height: 260,
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
let props: Parameters<typeof Multiline>[0] = { value: 'A😀B\nCD', version: 1, keyboard: 'email' }
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(Multiline, props)
	await pause()
}
let acknowledgments = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: unknown, key: number) => {
	if (key !== 65481) return false
	acknowledgments++
	return true
})
window.add_controller(keys)
async function input(text?: string, key?: string) {
	const ack = acknowledgments + 1
	print('GTK_TEXT_VIEW_READY ' + JSON.stringify({ text, key }))
	for (let i = 0; i < 200 && acknowledgments < ack; i++) await pause(25)
	check('OS input acknowledgment', acknowledgments >= ack)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause(200)
	const view = node('multiline').view!
	const buffer = view.get_buffer()
	const native = (globalThis as any).imports.gi.XplatMason
	const readOnlyProperty = (expected: boolean) =>
		native.test_accessible_boolean_property(view, Gtk.AccessibleProperty.READ_ONLY, expected) ===
		null
	check('real Gtk.TextView with native buffer', view instanceof Gtk.TextView)
	check('initial multiline Unicode text', view.text === 'A😀B\nCD')
	check('no controlled initial echo', changes.length === 0)
	check('word/character wrapping', view.wrap_mode === Gtk.WrapMode.WORD_CHAR)
	check('Tab is available for focus navigation', !view.accepts_tab)
	check('email purpose', view.input_purpose === Gtk.InputPurpose.EMAIL)
	view.select_region(5, 1)
	view.text = 'Q😀R\nST!'
	await pause()
	const [selected, start, end] = view.get_selection_bounds()
	check('Unicode selection bounds preserved', selected && start === 1 && end === 5)
	check('backward selection retains active edge', view.get_position() === 1)
	check('imperative writes suppress change echoes', changes.length === 0)
	view.text = 'X'
	await pause()
	check(
		'selection clamps after shorter write',
		view.get_position() === 1 && !view.get_selection_bounds()[0],
	)
	view.set_position(1)
	view.text = 'XYZ'
	await pause()
	check('collapsed cursor stays at character offset', view.get_position() === 1)
	await render({ value: 'Reset\nvalue', version: 2 })
	check('declarative text update', view.text === 'Reset\nvalue')
	check('declarative write suppresses echoes', changes.length === 0)
	buffer.insert_at_cursor('!', -1)
	check('native buffer edit sends current value', changes.at(-1) === view.text)
	check('native edit sends one event', changes.length === 1)
	await render({ editable: false, keyboard: undefined, autocorrect: false })
	check('readOnly keeps native widget sensitive', view.is_sensitive() && !view.get_editable())
	check('native readOnly accessibility property', readOnlyProperty(true))
	check('purpose resets on removal', view.input_purpose === Gtk.InputPurpose.FREE_FORM)
	check('spellcheck hint disabled', !!(view.input_hints & Gtk.InputHints.NO_SPELLCHECK))
	view.focus()
	await pause()
	check('readOnly editor can receive focus', window.get_focus() === view)
	check('focus event observed', focusEvents.includes('focus'))
	const peer = node('peer').view!
	peer.focus()
	await pause()
	view.blur()
	check(
		'stale blur preserves sibling focus',
		window.get_focus() === peer || window.get_focus()?.is_ancestor(peer),
	)
	check('blur event observed', focusEvents.includes('blur'))
	await render({ enabled: false, editable: true, autocorrect: undefined })
	check('disabled independently controls sensitivity', !view.is_sensitive() && view.get_editable())
	check('readOnly accessibility resets when editable', readOnlyProperty(false))
	check('spellcheck resets on removal', !(view.input_hints & Gtk.InputHints.NO_SPELLCHECK))
	await render({ enabled: true, value: 'abc' })
	view.focus()
	await pause()
	check('native editor focus method', window.get_focus() === view)
	const osKeyboard = GLib.getenv('GTK_TEXT_OS') === '1'
	if (osKeyboard) {
		view.select_region(1, 2)
		const before = changes.length
		await input('X')
		check('OS keyboard replaces selected middle range', view.text === 'aXc')
		check('OS selection replacement caret', view.get_position() === 2)
		check('OS replacement emits change', changes.length > before && changes.at(-1) === 'aXc')
		for (const mode of [undefined, 'next', 'go', 'search', 'done', 'send'] as const) {
			await render({ value: 'line', returnKey: mode, version: props.version + 1 })
			view.set_position(4)
			const count = submits.length
			await input(undefined, 'Return')
			const submit = mode === 'done' || mode === 'send'
			check('Return behavior for ' + mode, view.text === (submit ? 'line' : 'line\n'))
			check('submit behavior for ' + mode, submits.length === count + (submit ? 1 : 0))
			if (submit) check('submit uses current handler', submits.at(-1) === props.version)
		}
		await render({ value: 'Shift', returnKey: 'done' })
		view.set_position(5)
		const beforeShift = submits.length
		await input(undefined, 'shift+Return')
		check(
			'Shift Return retains newline editing',
			view.text === 'Shift\n' && submits.length === beforeShift,
		)
		await render({ editable: false, value: 'Read only' })
		await input('blocked', 'Return')
		check('OS edits cannot change readOnly buffer', view.text === 'Read only')
		await render({ editable: true, returnKey: 'done', value: 'Tab focus' })
		view.focus()
		await input(undefined, 'Tab')
		check(
			'OS Tab moves focus to peer',
			window.get_focus() === peer || window.get_focus()?.is_ancestor(peer),
		)
	}
	const oldChanges = changes.length
	await render({ mounted: false })
	buffer.insert_at_cursor('retired', -1)
	check('retired buffer listener disconnected', changes.length === oldChanges)
	const retiredText = view.text
	view.text = 'late'
	view.focus()
	view.blur()
	check('disposed imperative setter is inert', view.text === retiredText)
	root.unmount()
	window.destroy()
	print(
		'GTK_TEXT_VIEW ' +
			JSON.stringify({
				checks,
				osKeyboard,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
		console.error(error)
	})
	.finally(() => loop.quit())
loop.run()
if (failure) throw failure
