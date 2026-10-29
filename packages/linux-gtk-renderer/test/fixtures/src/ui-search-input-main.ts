import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { SearchHarness, NestedSearch, GrowingSearchRow, searchRef } from './ui-search-input.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK search input test',
	default_width: 360,
	default_height: 360,
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
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const close = (a: number, b: number) => Math.abs(a - b) <= 2
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
let props: Parameters<typeof SearchHarness>[0] = {
	defaultValue: 'seed',
	label: 'Find items',
	width: '75%',
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(SearchHarness, props)
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
const osInput = GLib.getenv('GTK_SEARCH_OS') === '1'
async function input(view: any, action: { type?: string; key?: string; click?: boolean }) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_SEARCH_READY ' +
			JSON.stringify({
				...action,
				x: bounds.x + bounds.width / 2,
				y: bounds.y + bounds.height / 2,
			}),
	)
	for (let i = 0; i < 200 && acknowledgments < ack; i++) await pause(25)
	check('OS phase completed', acknowledgments >= ack)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause(250)
	const entry = searchRef.current!.native as any
	const entryNode = [...container.nodes.values()].find((n) => n.view === entry)!
	const native = (globalThis as any).imports.gi.XplatMason
	const cursor = () => Number(entry.get_delegate().cursor_position)
	const focused = () => window.get_focus() === entry || window.get_focus()?.is_ancestor(entry)
	const named = (view: any, name: string) =>
		native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, name) === null
	const state = (key: number, value: number) =>
		native.test_accessible_state(entry, key, value) === null
	check('search uses a native Entry', entry instanceof Gtk.Entry)
	check('uncontrolled default value reaches the editor', entry.text === 'seed')
	check('explicit id belongs to the editor', entryNode.props.id === 'search-control')
	check(
		'automation name stays independent from control id',
		entry.get_name() === 'search-automation',
	)
	check('field label names the native editor', named(entry, 'Find items'))
	check('one automatic field owns the search', nodes('vx-field').length === 1)
	check(
		'percentage width belongs to the outer field',
		close(nodes('vx-field')[0].view!.getBounds().width, 240),
	)
	check(
		'search shell consumes that width once',
		close(nodes('vx-search')[0].view!.getBounds().width, 240),
	)
	check(
		'default registered search glyph is allocated',
		nodes('vx-search-icon').length === 1 && close(nodes('vx-search-icon')[0].view!.get_width(), 16),
	)
	check('default clear affordance is available for content', nodes('vx-search-clear').length === 1)
	check(
		'clear affordance has button semantics',
		nodes('vx-search-clear')[0].view!.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
	)
	check(
		'clear affordance can receive keyboard focus',
		nodes('vx-search-clear')[0].view!.get_focusable(),
	)
	const changes: string[] = []
	await render({ value: 'abc', onChange: (value) => changes.push(value) })
	entry.focus()
	entry.select_region(1, 2)
	if (osInput) await input(entry, { type: 'X' })
	else {
		entry.set_text('aXc')
		await pause()
	}
	check('controlled rejected edit is restored', entry.text === 'abc')
	check('selection replacement reports a complete edit', changes.at(-1) === 'aXc')
	if (osInput) {
		check('OS replacement reports exactly one edit', changes.length === 1)
		entry.select_region(1, 2)
		await input(entry, { type: 'X' })
		check(
			'repeated rejection restores the owner',
			entry.text === 'abc' && changes.length === 2 && changes[1] === 'aXc',
		)
	}
	changes.length = 0
	const order: string[] = []
	const accept = (value: string) => {
		changes.push(value)
		order.push('change:' + value)
		props = { ...props, value }
		root.render(SearchHarness, props)
	}
	await render({ onChange: accept, onClear: () => order.push('clear') })
	entry.set_position(1)
	if (osInput) await input(entry, { type: 'Y' })
	else {
		entry.set_text('aYbc')
		await pause()
	}
	check(
		'accepting owner keeps native text and caret',
		entry.text === 'aYbc' && (!osInput || entry.get_position() === 2) && changes.at(-1) === 'aYbc',
	)
	if (osInput) {
		order.length = 0
		const clear = nodes('vx-search-clear')[0].view!
		clear.focus()
		await input(clear, { key: 'space' })
		check('keyboard clear calls change before clear', order.join('|') === 'change:|clear')
		check('accepted clear updates the controlled owner', entry.text === '' && props.value === '')
		check('clear returns focus to the retained editor', focused())
		check('empty text retires its clear affordance', nodes('vx-search-clear').length === 0)
	} else await render({ value: '' })
	await render({ value: 'keep' })
	entry.focus()
	await pause()
	// GtkEntry normalizes wrapper bounds; its delegate retains the active edge.
	entry.select_region(2, 0)
	await pause()
	print(
		'GTK_SEARCH_BEFORE_ICON_STATE ' +
			JSON.stringify({
				focus: focused(),
				position: cursor(),
				selection: entry.get_selection_bounds(),
				value: entry.text,
			}),
	)
	check(
		'focused backward selection is established before icon removal',
		focused() && cursor() === 0 && entry.get_selection_bounds().slice(1).join(',') === '0,2',
	)
	await render({ icon: false })
	print(
		'GTK_SEARCH_ICON_STATE ' +
			JSON.stringify({
				focus: focused(),
				position: cursor(),
				selection: entry.get_selection_bounds(),
			}),
	)
	check(
		'hiding the icon retains native editor and value',
		searchRef.current!.native === entry && entry.text === 'keep',
	)
	check(
		'hiding the icon retains focus and backward selection',
		focused() && cursor() === 0 && entry.get_selection_bounds().slice(1).join(',') === '0,2',
	)
	check('false icon renders no leading glyph', nodes('vx-search-icon').length === 0)
	await render({ icon: 'xplat-check' })
	check(
		'replacement registered icon is allocated',
		nodes('vx-search-icon').length === 1 && close(nodes('vx-search-icon')[0].view!.get_width(), 16),
	)
	check(
		'replacement icon retains editor and text',
		searchRef.current!.native === entry && entry.text === 'keep',
	)
	await render({ hasClear: false })
	check('hasClear false removes clear affordance', nodes('vx-search-clear').length === 0)
	await render({ hasClear: true, isReadOnly: true })
	check('readonly remains sensitive and selectable', entry.is_sensitive() && !entry.get_editable())
	check('readonly removes clear action', nodes('vx-search-clear').length === 0)
	check(
		'readonly reaches native accessibility metadata',
		native.test_accessible_boolean_property(entry, Gtk.AccessibleProperty.READ_ONLY, true) === null,
	)
	await render({ isReadOnly: false, isDisabled: true })
	check('disabled reaches native sensitivity', !entry.is_sensitive())
	check('disabled removes clear action', nodes('vx-search-clear').length === 0)
	const beforeDisabled = entry.text
	if (osInput) await input(entry, { type: 'Z' })
	check('disabled typing leaves the owner unchanged', entry.text === beforeDisabled)
	await render({ isDisabled: false, isLoading: true })
	check(
		'loading keeps the editor enabled and editable',
		entry.is_sensitive() && entry.get_editable(),
	)
	check('loading announces busy', state(Gtk.AccessibleState.BUSY, 1))
	check('loading preserves the clear affordance', nodes('vx-search-clear').length === 1)
	entry.focus()
	entry.set_position(entry.get_text_length())
	if (osInput) await input(entry, { type: 'Q' })
	else {
		entry.set_text(beforeDisabled + 'Q')
		await pause()
	}
	check('loading does not block accepted typing', entry.text === beforeDisabled + 'Q')
	await render({ label: undefined, width: undefined })
	check(
		'removing a label retains native state',
		searchRef.current!.native === entry && entry.text === beforeDisabled + 'Q',
	)
	check(
		'removing field width restores available width',
		close(nodes('vx-search')[0].view!.getBounds().width, 320),
	)
	await render({
		label: 'Find folders',
		description: 'All folders',
		status: { type: 'error', message: 'Try again' },
		statusVariant: 'tooltip',
		isRequired: true,
		size: 'sm',
		width: '50%',
		isLoading: false,
	})
	check('changing label updates native name', named(entry, 'Find folders'))
	check(
		'description and status are not duplicated',
		native.test_accessible_string_property(
			entry,
			Gtk.AccessibleProperty.DESCRIPTION,
			'All folders. Try again',
		) === null,
	)
	check(
		'required reaches the native editor',
		native.test_accessible_boolean_property(entry, Gtk.AccessibleProperty.REQUIRED, true) === null,
	)
	check(
		'error reaches native invalid metadata',
		state(Gtk.AccessibleState.INVALID, Gtk.AccessibleInvalidState.TRUE),
	)
	check('loading metadata clears', state(Gtk.AccessibleState.BUSY, 0))
	check(
		'size is resolved on search shell',
		nodes('vx-search')[0].cssClasses!.has('vx-search--size-sm'),
	)
	check(
		'status variant belongs to field owner',
		nodes('vx-field')[0].cssClasses!.has('vx-field--status-tooltip'),
	)
	check('tooltip status avoids duplicate inline message', nodes('vx-field-status').length === 0)
	check(
		'updated percent field width applies once',
		close(nodes('vx-field')[0].view!.getBounds().width, 160) &&
			close(nodes('vx-search')[0].view!.getBounds().width, 160),
	)
	if (osInput) {
		window.set_focus(null)
		await input(nodes('vx-field-label')[0].view, { click: true })
		check('field label focuses the editor by control id', focused())
		let submissions = 0
		await render({ onSubmit: () => submissions++ })
		const beforeSubmit = entry.text
		const edits = changes.length
		await input(entry, { key: 'Return' })
		check('Return submits the search once', submissions === 1)
		check(
			'search submit does not edit text',
			entry.text === beforeSubmit && changes.length === edits,
		)
	}
	const oldHandle = searchRef.current!
	root.render(GrowingSearchRow, {})
	await pause()
	check('an explicit growing field avoids duplicate wrappers', nodes('vx-field').length === 1)
	check(
		'parent row growth belongs to the field owner',
		close(nodes('vx-power-search-input')[0].view!.getBounds().width, 280),
	)
	check(
		'growing search control consumes the field width',
		close(nodes('vx-search')[0].view!.getBounds().width, 280),
	)
	root.render(NestedSearch, {})
	await pause()
	const nested = searchRef.current!.native as any
	check('nested field avoids automatic duplicate chrome', nodes('vx-field').length === 1)
	check('nested defaults reach editor editability', nested.is_sensitive() && !nested.get_editable())
	check('nested readonly suppresses clear affordance', nodes('vx-search-clear').length === 0)
	check('nested field label names the editor', named(nested, 'Parent query'))
	check(
		'nested defaults set required state',
		native.test_accessible_boolean_property(nested, Gtk.AccessibleProperty.REQUIRED, true) === null,
	)
	check(
		'nested defaults set busy state',
		native.test_accessible_state(nested, Gtk.AccessibleState.BUSY, 1) === null,
	)
	check('nested defaults set size', nodes('vx-search')[0].cssClasses!.has('vx-search--size-sm'))
	check(
		'external percent field width applies once',
		close(nodes('vx-search')[0].view!.getBounds().width, 256),
	)
	check(
		'replaced native editor is retired',
		entryNode.destroyed && oldHandle.native.focus() === false,
	)
	root.render(NestedSearch, { childLabel: 'Specific query' })
	await pause()
	check(
		'explicit child name overrides inherited label',
		named(nested, 'Specific query') && searchRef.current!.native === nested,
	)
	const nestedNode = [...container.nodes.values()].find((n) => n.view === nested)!
	root.unmount()
	check('unmount clears the public handle', searchRef.current === null)
	check('unmount retires the final native editor', nestedNode.destroyed && nested.focus() === false)
	check('unmount empties the host', host.get_first_child() == null)
	window.destroy()
	print(
		'GTK_SEARCH_INPUT ' +
			JSON.stringify({
				checks,
				osInput,
				gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
			}),
	)
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	console.error(error)
	root.unmount()
	window.destroy()
	loop.quit()
})
loop.run()
if (failed) (globalThis as any).imports.system.exit(1)
