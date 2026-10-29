import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { FieldChrome, inputRef, actions } from './ui-field-chrome.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK field chrome test',
	default_width: 440,
	default_height: 540,
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
const byClass = (name: string) =>
	[...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const fieldOwner = (id: string) => {
	let owner = node(id).parent
	while (owner && !owner.cssClasses?.has('vx-field')) owner = owner.parent
	if (!owner) throw new Error('No field owner for ' + id)
	return owner
}
const near = (actual: number, expected: number) => Math.abs(actual - expected) < 2
const popup = (anchor: any) => {
	for (let child = anchor.get_first_child(); child; child = child.get_next_sibling())
		if (child instanceof Gtk.Popover) return child
	throw new Error('no native status popover')
}
let props: Parameters<typeof FieldChrome>[0] = {
	bareWidth: 260,
	fieldWidth: '75%',
	variant: 'tooltip',
	message: 'Account is required',
	loading: true,
	readOnly: true,
	size: 'sm',
}
const render = () => root.render(FieldChrome, props)
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
async function phase(phase: string, point?: { x: number; y: number }) {
	const next = ack + 1
	print('GTK_FIELD_CHROME_READY ' + JSON.stringify({ phase, ...point }))
	for (let i = 0; i < 240 && ack < next; i++) await pause(20)
	check('OS phase completed ' + phase, ack >= next)
	await pause()
}
let osInput = false
async function run() {
	render()
	window.present()
	await pause(220)
	const bare = node('bare').view!
	const field = node('field').view!
	const shell = node('bare').parent!
	const fieldShell = node('field').parent!
	const chrome = fieldOwner('field')
	check('bare input width reaches its shell', near(shell.view!.getBounds().width, 260))
	check('standalone field width is applied once', near(chrome.view!.getBounds().width, 300))
	check(
		'wrapped shell does not repeat percentage width',
		fieldShell.props.style.width === undefined,
	)
	check(
		'enclosing field owns external percentage width',
		near(node('external').view!.getBounds().width, 320),
	)
	check(
		'nested control does not repeat width',
		node('inside').parent!.props.style.width === undefined,
	)
	check('read-only flag reaches visible chrome', chrome.cssClasses.has('vx-field--readonly'))
	check('loading flag reaches visible chrome', chrome.cssClasses.has('vx-field--loading'))
	check('size reaches visible chrome', chrome.cssClasses.has('vx-field--size-sm'))
	check('tooltip status is retained on GTK', chrome.cssClasses.has('vx-field--status-tooltip'))
	check('tooltip mode has no inline message', byClass('vx-field-status').length === 0)
	const clear = byClass('vx-input-clear')[0]
	const info = byClass('vx-field-info')[0]
	const status = byClass('vx-field-status-trigger')[0]
	check(
		'clear affordance is a focusable native button',
		clear.view!.get_focusable() && clear.view!.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
	)
	check(
		'label info is a focusable native button',
		info.view!.get_focusable() && info.view!.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
	)
	check(
		'status glyph is a focusable native button',
		status.view!.get_focusable() &&
			status.view!.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
	)
	check(
		'status glyph has a native hit area',
		status.view!.getBounds().width >= 20 && status.view!.getBounds().height >= 20,
	)
	if (GLib.getenv('GTK_FIELD_CHROME_OS') === '1') {
		const label = byClass('vx-field-label').find((n) =>
			n.view?.get_text().startsWith('Account'),
		)!.view!
		const bounds = label.getBounds()
		window.set_focus(null)
		await phase('label', { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
		check(
			'actual label click focuses the readonly TextInput',
			window.get_focus() === field || window.get_focus()?.is_ancestor(field),
		)
	}
	status.view!.focus()
	await pause()
	const native = popup(status.parent!.view)
	check('status focus opens a native tooltip', native.get_visible())
	check(
		'status content mounts in the existing root',
		byClass('vx-field-status').some((n) => n.view?.get_text() === 'Account is required'),
	)
	check('status tooltip retains focus on its trigger', window.get_focus() === status.view)
	props = { ...props, message: 'Account is invalid' }
	render()
	await pause()
	check(
		'open status tooltip updates message',
		byClass('vx-field-status').some((n) => n.view?.get_text() === 'Account is invalid'),
	)
	check('status update retains the native text entry', node('field').view === field)
	node('field-peer').view!.focus()
	await pause()
	props = {
		...props,
		bareWidth: '50%',
		variant: 'detached',
		loading: false,
		readOnly: false,
		size: 'lg',
	}
	render()
	await pause()
	check(
		'bare percentage width resolves against parent once',
		near(shell.view!.getBounds().width, 200),
	)
	check(
		'width updates retain input and public handle',
		node('bare').view === bare && inputRef.current?.native === bare,
	)
	check(
		'variant change retains native input',
		node('field').view === field && field.get_text() === 'Account',
	)
	check(
		'detached status renders a message below the control',
		byClass('vx-field-status--detached').some((n) => n.view?.get_text() === 'Account is invalid'),
	)
	check('old status popover is disposed', native.get_parent() === null)
	check(
		'chrome removes old state classes',
		!chrome.cssClasses.has('vx-field--readonly') && !chrome.cssClasses.has('vx-field--loading'),
	)
	check('chrome updates size', chrome.cssClasses.has('vx-field--size-lg'))
	props = { ...props, variant: 'attached', disabled: true }
	render()
	await pause()
	check(
		'attached status reaches native field chrome',
		chrome.cssClasses.has('vx-field--status-attached'),
	)
	check(
		'disabled state reaches chrome and actual entry',
		chrome.cssClasses.has('vx-field--disabled') && !field.get_sensitive(),
	)
	props = { ...props, variant: 'tooltip', disabled: false }
	render()
	await pause()
	check(
		'replacing status presentation retains uncontrolled text',
		node('field').view === field && field.get_text() === 'Account',
	)
	inputRef.current!.focus()
	await pause()
	if (GLib.getenv('GTK_FIELD_CHROME_OS') === '1') {
		await phase('edit')
	} else {
		bare.set_text('Edited account')
		await pause()
	}
	check('lifecycle probe starts with an uncontrolled edit', bare.get_text() === 'Edited account')
	bare.select_region(1, 5)
	const focusedEditor = window.get_focus()
	props = { ...props, bareLabel: 'Name', providerSize: 'lg', size: 'md' }
	render()
	await pause()
	check(
		'adding chrome retains native entry and public handle',
		node('bare').view === bare && inputRef.current!.native === bare,
	)
	check('adding chrome retains uncontrolled edits', bare.get_text() === 'Edited account')
	const [selected, start, end] = bare.get_selection_bounds()
	check('adding chrome retains selection', selected && start === 1 && end === 5)
	check('adding chrome retains exact native focus delegate', window.get_focus() === focusedEditor)
	check(
		'automatic chrome inherits provider size',
		fieldOwner('bare').cssClasses.has('vx-field--size-lg'),
	)
	check(
		'input and automatic chrome inherit the same size',
		node('bare').cssClasses.has('vx-input--size-lg'),
	)
	check('explicit input size wins over provider size', chrome.cssClasses.has('vx-field--size-md'))
	props = { ...props, bareLabel: undefined, providerSize: 'sm' }
	render()
	await pause()
	check(
		'removing chrome retains native entry and uncontrolled edits',
		node('bare').view === bare && bare.get_text() === 'Edited account',
	)
	const [kept, first, last] = bare.get_selection_bounds()
	check(
		'removing chrome retains selection and focus',
		kept && first === 1 && last === 5 && window.get_focus() === focusedEditor,
	)
	check(
		'size provider updates both automatic chrome and input',
		fieldOwner('bare').cssClasses.has('vx-field--size-sm') &&
			node('bare').cssClasses.has('vx-input--size-sm'),
	)
	props = { ...props, bareMessage: 'Please correct the name' }
	render()
	await pause()
	check(
		'first validation message retains edited input',
		node('bare').view === bare && bare.get_text() === 'Edited account',
	)
	const [statusSelection, statusStart, statusEnd] = bare.get_selection_bounds()
	check(
		'first validation message retains selection and focus',
		statusSelection && statusStart === 1 && statusEnd === 5 && window.get_focus() === focusedEditor,
	)
	props = { ...props, bareMessage: undefined }
	render()
	await pause()
	check(
		'clearing validation retains editor and focus',
		node('bare').view === bare &&
			bare.get_text() === 'Edited account' &&
			window.get_focus() === focusedEditor,
	)
	if (GLib.getenv('GTK_FIELD_CHROME_OS') === '1') {
		inputRef.current!.focus()
		await pause()
		actions.length = 0
		await phase('clear-focus')
		check('actual Tab reaches clear control', window.get_focus() === clear.view)
		await phase('clear')
		check(
			'actual Return clears in callback order',
			actions.join() === 'change:,clear' && bare.get_text() === '',
		)
		check('clear returns native focus to the input', window.get_focus() === bare.get_delegate())
		check(
			'empty uncontrolled input removes clear affordance',
			byClass('vx-input-clear').length === 0,
		)
		await phase('info')
		check('actual Tab reaches field info', window.get_focus() === info.view)
		const infoPopup = popup(info.parent!.view)
		check('actual focus opens label info', infoPopup.get_visible())
		await phase('escape')
		check('actual Escape dismisses label info', !infoPopup.get_visible())
		await phase('status')
		const current = byClass('vx-field-status-trigger')[0]
		check('actual Tab reaches validation glyph', window.get_focus() === current.view)
		check('actual focus opens validation message', popup(current.parent!.view).get_visible())
		osInput = true
	}
	root.unmount()
	await pause()
	check(
		'field cleanup releases all nodes and public handle',
		container.nodes.size === 0 && inputRef.current === null,
	)
	print(
		'GTK_FIELD_CHROME ' +
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
