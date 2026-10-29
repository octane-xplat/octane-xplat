import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot, gtkDriver } from '@octane-xplat/linux-gtk'
import {
	TextEntry,
	inputRef,
	changes,
	submits,
	focusEvents,
	controlledRef,
	controlledChanges,
	controlledValue,
} from './ui-text-entry.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK text entry test',
	default_width: 300,
	default_height: 320,
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
	if (!ok) {
		throw new Error(name)
	}
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const entry = () => inputRef.current!.native as any
const focusedWithin = (view: any) => {
	const focused = window.get_focus()
	return focused === view || !!focused?.is_ancestor(view)
}
const placeholder = (view: any): any => {
	if (view.get_css_name() === 'placeholder') {
		return view
	}
	for (let child = view.get_first_child(); child; child = child.get_next_sibling()) {
		const found = placeholder(child)
		if (found) {
			return found
		}
	}
	return null
}
const rgb = (widget: any) => {
	const color = widget.get_style_context().get_color()
	return [color.red, color.green, color.blue]
		.map((channel: number) => Math.round(channel * 255))
		.join(',')
}

let props: Parameters<typeof TextEntry>[0] = {
	version: 1,
	value: 'A😀BC',
	name: 'Editable name',
	placeholder: 'Type here',
	keyboard: 'email',
	secure: true,
}
const render = () => root.render(TextEntry, props)
let osAck = 0
let writeOnLeft = false
let keyWrites = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_controller: any, key: number) => {
	if (key === 65361 && writeOnLeft) {
		entry().text = 'ABCDE!'
		keyWrites++
	}
	if (key === 65481) {
		osAck++
		return true
	}
	return false
})
window.add_controller(keys)
let osKeyboard = false
async function inputPhase(phase: string, target = entry()) {
	const bounds = target.getBounds()
	const next = osAck + 1
	print(
		'GTK_TEXT_ENTRY_READY ' +
			JSON.stringify({ phase, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }),
	)
	for (let i = 0; i < 240 && osAck < next; i++) {
		await pause(30)
	}
	check('OS phase completed: ' + phase, osAck >= next)
}
async function run() {
	render()
	window.present()
	await pause(200)
	const view = entry()
	check('handle retains a real Gtk.Entry', view instanceof Gtk.Entry)
	check('initial controlled Unicode text', view.text === 'A😀BC')
	check('initial programmatic write has no onChange echo', changes.length === 0)
	check('secure entry uses native masking', view.get_visibility() === false)
	check('keyboard purpose is email', view.input_purpose === Gtk.InputPurpose.EMAIL)
	check('placeholder is applied', view.placeholder_text === 'Type here')
	check(
		'stored accessible name exists',
		Gtk.test_accessible_has_property(view, Gtk.AccessibleProperty.LABEL),
	)
	check(
		'registered leading icon has a native picture',
		[...container.nodes.values()].some((n) => n.picture && n.view?.get_paintable()),
	)
	props = { ...props, leading: 'node' }
	render()
	await pause()
	check(
		'custom leading content replaces the registered icon',
		node('entry-leading').view!.get_text() === 'Leading' &&
			node('entry').view === view &&
			entry() === view,
	)
	props = { ...props, leading: 'none' }
	render()
	await pause()
	check(
		'removing leading content retains the editor',
		![...container.nodes.values()].some((n) => n.cssClasses.has('vx-input-icon')) &&
			node('entry').view === view &&
			entry() === view,
	)
	check(
		'leading content changes retain the actual mounted editor',
		node('entry').view === view && inputRef.current!.native === node('entry').view,
	)
	const hint = placeholder(view)
	check('placeholder uses a real native label node', hint instanceof Gtk.Label)
	const defaultColor = rgb(hint)
	props = {
		...props,
		placeholderColor: '#12ab34',
		testID: 'account-entry',
		className: 'account-custom',
	}
	render()
	await pause()
	check('placeholder color reaches native computed style: ' + rgb(hint), rgb(hint) === '18,171,52')
	check('custom class is retained on the GTK input', node('entry').cssClasses.has('account-custom'))
	check('testID reaches native automation name', view.get_name() === 'account-entry')
	props = { ...props, placeholderColor: '#ab1234', placeholder: 'Updated hint' }
	render()
	await pause()
	check(
		'placeholder updates retain its native node',
		placeholder(view) === hint && hint.get_text() === 'Updated hint',
	)
	check('placeholder color updates native computed style', rgb(hint) === '171,18,52')
	props = { ...props, placeholderColor: undefined, testID: undefined, className: undefined }
	render()
	await pause()
	check('removing custom placeholder color restores themed color', rgb(hint) === defaultColor)
	check(
		'removing custom class restores input classes',
		!node('entry').cssClasses.has('account-custom') && node('entry').cssClasses.has('vx-input'),
	)
	check('removing testID restores native id name', view.get_name() === 'entry')
	for (const [keyboard, purpose] of [
		['default', Gtk.InputPurpose.FREE_FORM],
		['email', Gtk.InputPurpose.EMAIL],
		['number', Gtk.InputPurpose.NUMBER],
		['decimal', Gtk.InputPurpose.NUMBER],
		['phone', Gtk.InputPurpose.PHONE],
		['url', Gtk.InputPurpose.URL],
	] as const) {
		props = { ...props, keyboard }
		render()
		await pause(35)
		check(
			'input purpose reaches GTK: ' + keyboard,
			view.input_purpose === purpose && node('entry').view === view && entry() === view,
		)
	}
	props = { ...props, keyboard: undefined }
	render()
	await pause()
	check(
		'removing input purpose restores free form',
		view.input_purpose === Gtk.InputPurpose.FREE_FORM,
	)
	inputRef.current!.focus()
	await pause()
	check('shared handle focus reaches internal GtkText', focusedWithin(view))
	for (const returnKey of ['done', 'next', 'go', 'search', 'send'] as const) {
		props = { ...props, returnKey }
		render()
		await pause(35)
		const count = submits.length
		view.emit('activate')
		check(
			'caption hint preserves one submission: ' + returnKey,
			submits.length === count + 1 && submits.at(-1) === props.version,
		)
		check(
			'caption hint does not change focus or editor: ' + returnKey,
			focusedWithin(view) && node('entry').view === view && entry() === view,
		)
	}
	props = { ...props, returnKey: undefined }
	render()
	await pause()
	check(
		'removing caption hint retains the editor',
		node('entry').view === view && entry() === view && focusedWithin(view),
	)
	view.select_region(1, 4)
	props = { ...props, value: 'A😀BC!' }
	render()
	await pause(130)
	const [selected, start, end] = view.get_selection_bounds()
	check('imperative controlled writes preserve selection', selected && start === 1 && end === 4)
	check('controlled writes suppress callback echo', changes.length === 0)
	check('native widget identity is retained', node('entry').view === view && entry() === view)
	props = { ...props, value: 'A😀' }
	render()
	await pause(130)
	const [shortSelected, shortStart, shortEnd] = view.get_selection_bounds()
	check(
		'shrinking Unicode value clamps a partial selection by code point',
		shortSelected && shortStart === 1 && shortEnd === 2 && view.get_position() === 2,
	)
	props = { ...props, value: 'A😀BC' }
	render()
	await pause()
	view.select_region(4, 1)
	props = { ...props, value: 'A😀BC!' }
	render()
	await pause(130)
	const [backward, backStart, backEnd] = view.get_selection_bounds()
	check(
		'backward selection keeps its active edge',
		backward && backStart === 1 && backEnd === 4 && view.get_delegate().cursor_position === 1,
	)
	view.set_position(3)
	props = { ...props, value: '😀' }
	render()
	await pause(130)
	check('collapsed cursor clamps to GTK character count', view.get_position() === 1)
	let nativeWrites = 0
	const changed = view.connect('changed', () => {
		nativeWrites++
	})
	view.text = view.text
	check('identical imperative writes do not touch GtkEditable', nativeWrites === 0)
	view.disconnect(changed)
	props = { ...props, value: 'Repair' }
	render()
	view.set_text('Edit')
	view.set_text('Repair')
	view.set_position(2)
	await pause(130)
	check('selection repair does not override a newer native edit', view.get_position() === 2)
	check('native edits report actual text', changes.at(-1) === 'Repair')
	props = {
		...props,
		secure: undefined,
		keyboard: 'default',
		placeholder: undefined,
		name: undefined,
		readOnly: true,
	}
	render()
	await pause()
	check(
		'read-only editing is separate from sensitivity',
		!view.get_editable() && view.get_sensitive(),
	)
	check('secure removal restores visible text', view.get_visibility() === true)
	check(
		'default keyboard purpose resets prior email purpose',
		view.input_purpose === Gtk.InputPurpose.FREE_FORM,
	)
	check('undefined placeholder clears prior text', view.placeholder_text === '')
	check(
		'undefined accessible name clears prior state',
		!Gtk.test_accessible_has_property(view, Gtk.AccessibleProperty.LABEL),
	)
	inputRef.current!.focus()
	await pause()
	check('read-only entry can retain focus', focusedWithin(view))
	props = { ...props, readOnly: false, disabled: true, aliasDisabled: true }
	render()
	await pause()
	check('disabled state prevents interaction', !view.get_sensitive())
	// disabled/enabled aliases are renderer transport props, not shared JSX props.
	const aliases = node('entry-aliases')
	gtkDriver
		.prepareBatch(container, {
			renderer: 'gtk',
			commands: [
				{
					op: 'update',
					id: aliases.id,
					props: { ...aliases.props, disabled: true, enabled: true, isEnabled: true },
				},
			],
		} as any)
		.apply()
	check('enabled aliases cannot override disabled', !aliases.view!.get_sensitive())
	props = { ...props, disabled: false, aliasDisabled: undefined }
	render()
	await pause()
	check(
		'disabled removal restores sensitivity',
		view.get_sensitive() && node('entry-aliases').view!.get_sensitive(),
	)
	const peer = node('entry-peer').view!
	peer.focus()
	await pause()
	view.blur()
	await pause()
	check('blur does not clear a sibling focus', focusedWithin(peer))
	inputRef.current!.focus()
	await pause()
	inputRef.current!.blur()
	await pause()
	check('shared blur releases delegated entry focus', !focusedWithin(view))
	check(
		'native focus and blur callbacks ran',
		focusEvents.includes('focus') && focusEvents.includes('blur'),
	)
	props = { version: 2, value: 'Field', label: 'Email', description: 'Work address' }
	render()
	await pause()
	check(
		'field chrome renders the visible label',
		[...container.nodes.values()].some((n) => n.type === 'label' && n.props.text === 'Email'),
	)
	check(
		'field chrome renders the description',
		[...container.nodes.values()].some(
			(n) => n.type === 'label' && n.props.text === 'Work address',
		),
	)
	check(
		'field hint reaches GTK description storage',
		Gtk.test_accessible_has_property(entry(), Gtk.AccessibleProperty.DESCRIPTION),
	)
	// Clear is an actual public UI action, dispatched here through GTK's controller.
	props = { version: 3, generation: 1, defaultValue: 'Seed', clear: true }
	render()
	await pause(180)
	node('entry-peer').view!.focus()
	await pause()
	const clear = [...container.nodes.values()].find(
		(n) => n.props.accessibilityLabel === 'Clear input',
	)!.view!
	const controllers = clear.observe_controllers()
	for (let i = 0; i < controllers.get_n_items(); i++) {
		const controller = controllers.get_item(i)
		if (controller instanceof Gtk.GestureClick) {
			controller.emit('released', 1, 1, 1)
		}
	}
	await pause()
	check(
		'clear action reports the empty value',
		changes.at(-1) === '' && focusEvents.includes('clear'),
	)
	check('clear action updates uncontrolled text', entry().text === '')
	check(
		'clear action returns focus to input and dispatches nested current onFocus',
		focusedWithin(entry()) && focusEvents.includes('focus:3'),
	)
	if (GLib.getenv('GTK_TEXT_OS') === '1') {
		await inputPhase('edit')
		check(
			'real keyboard input updates uncontrolled component state',
			entry().text === 'Typed' && changes.at(-1) === 'Typed',
		)
		check('real Return dispatches the current callback', submits.at(-1) === 3)
		const changeCount = changes.length
		props = { ...props, readOnly: true }
		render()
		await pause()
		await inputPhase('readonly')
		check(
			'real keyboard cannot edit a read-only entry',
			entry().text === 'Typed' && changes.length === changeCount,
		)
		check('read-only input keeps OS focus', focusedWithin(entry()))
		const submitCount = submits.length
		props = { ...props, disabled: true }
		render()
		await pause()
		await inputPhase('disabled')
		check(
			'disabled entry ignores real typing and Return',
			entry().text === 'Typed' && changes.length === changeCount && submits.length === submitCount,
		)
		props = { version: 4, value: 'ABCDE' }
		render()
		await pause()
		entry().focus()
		entry().set_position(4)
		writeOnLeft = true
		await inputPhase('cursor')
		writeOnLeft = false
		await pause(130)
		check(
			'real navigation follows a controlled write',
			keyWrites === 1 && entry().get_delegate().cursor_position === 3,
		)
		check(
			'selection repair cannot override real key navigation',
			node('entry').selSettleSource === null,
		)
		osKeyboard = true
	}
	props = { ...props, controlledMode: 'reject' }
	render()
	await pause(180)
	const controlled = controlledRef.current!.native as any
	controlled.focus()
	await pause()
	controlled.insert_text('x', -1, 2)
	await pause()
	check(
		'controlled field rejects a native edit',
		controlled.get_text() === '12' &&
			controlledValue.current === '12' &&
			controlledChanges.at(-1) === '12x',
	)
	controlled.insert_text('x', -1, 2)
	await pause()
	check(
		'controlled field rejects the same native edit again',
		controlled.get_text() === '12' && controlledChanges.at(-1) === '12x',
	)
	if (osKeyboard) {
		await inputPhase('controlled-reject', controlled)
		check(
			'actual controlled typing restores rejected text',
			controlled.get_text() === '12' &&
				controlledValue.current === '12' &&
				focusedWithin(controlled) &&
				controlled.get_delegate().cursor_position === 2,
		)
	}
	props = { ...props, controlledMode: 'accept' }
	render()
	await pause()
	if (osKeyboard) {
		await inputPhase('controlled-accept', controlled)
	} else {
		controlled.set_text('Accepted')
		await pause()
	}
	check(
		'controlled parent can accept native edits',
		controlled.get_text() === 'Accepted' &&
			controlledValue.current === 'Accepted' &&
			(!osKeyboard ||
				(focusedWithin(controlled) && controlled.get_delegate().cursor_position === 8)),
	)
	if (osKeyboard) {
		controlled.select_region(2, 5)
		const count = controlledChanges.length
		await inputPhase('controlled-middle', controlled)
		check(
			'actual middle selection replacement keeps controlled text and cursor',
			controlled.get_text() === 'AcXted' &&
				controlledValue.current === 'AcXted' &&
				controlled.get_delegate().cursor_position === 3 &&
				focusedWithin(controlled),
		)
		check(
			'one native middle edit reports onChange once',
			controlledChanges.length === count + 1 && controlledChanges.at(-1) === 'AcXted',
		)
	}
	check(
		'acceptance and rejection retain native editor identity',
		controlledRef.current!.native === controlled && node('entry-controlled').view === controlled,
	)
	const stale = entry()
	const staleNode = node('entry')
	root.unmount()
	await pause()
	const lastText = stale.text
	stale.text = 'Late write'
	check('disposed text ref setter is inert', stale.text === lastText)
	check('disposed focus and blur are inert', stale.focus() === false && (stale.blur(), true))
	check('dispose cancels pending selection repair', staleNode.selSettleSource === null)
	check('unmount clears the shared imperative handle', inputRef.current === null)
	check('all nodes removed', container.nodes.size === 0)
	print(
		'GTK_TEXT_ENTRY ' +
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
		printerr(error.stack ?? String(error))
	})
	.finally(() => {
		root.unmount()
		window.destroy()
		loop.quit()
	})
loop.run()
if (failure) {
	throw failure
}
