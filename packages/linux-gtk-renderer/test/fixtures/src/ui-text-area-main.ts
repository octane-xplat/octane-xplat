import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './ui-text-area.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	TextAreaHarness,
	NestedAreaHarness,
	areaRef,
	StandaloneEditor,
	standaloneRef,
	standaloneChanges,
} from './ui-text-area.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK text area test',
	default_width: 340,
	default_height: 360,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const outer = new Gtk.ScrolledWindow({
	hscrollbar_policy: Gtk.PolicyType.NEVER,
	vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
})
outer.set_child(host)
window.set_child(outer)
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
// A window-child replacement may allocate on a later GTK frame under load.
const waitForAllocation = async (ready: () => boolean) => {
	for (let attempt = 0; attempt < 120 && !ready(); attempt++) await pause(25)
	return ready()
}
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const close = (a: number, b: number) => Math.abs(a - b) <= 2
const style = { width: 280, fontSize: 26, padding: 0, borderWidth: 0, margin: 0 }
let props: Parameters<typeof TextAreaHarness>[0] = { value: 'One', style }
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(TextAreaHarness, props)
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
async function input(view: any, phase: string, repeat = 6, offsetY = 0) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_TEXT_AREA_READY ' +
			JSON.stringify({
				phase,
				x: bounds.x + bounds.width / 2,
				y: bounds.y + bounds.height / 2 + offsetY,
				repeat,
			}),
	)
	for (let i = 0; i < 200 && acknowledgments < ack; i++) await pause(25)
	check('OS phase completed: ' + phase, acknowledgments >= ack)
	await pause(300)
}
async function run() {
	await render()
	window.present()
	await pause(250)
	const view = areaRef.current!.native as any
	const buffer = view.get_buffer()
	const editorNode = [...container.nodes.values()].find((node) => node.view === view)!
	let fontEvents = 0
	const fontChanged = () => fontEvents++
	view.on('fontChanged', fontChanged)
	const hint = editorNode.textView!.placeholder
	const initialHeight = view.get_height()
	await render({ value: '', placeholder: 'Enter notes', placeholderTextColor: '#123456' })
	check('empty editor shows its hint', hint.get_visible() && hint.get_label() === 'Enter notes')
	check('hint is not an input target', !hint.get_can_target() && !hint.get_focusable())
	check(
		'hint has presentation semantics',
		hint.get_accessible_role() === Gtk.AccessibleRole.PRESENTATION,
	)
	check('hint does not resize the editor', close(view.get_height(), initialHeight))
	const color = hint.get_style_context().get_color()
	check(
		'hint color uses the shared style',
		[color.red, color.green, color.blue].map((x: number) => Math.round(x * 255)).join(',') ===
			'18,52,86',
	)
	const native = (globalThis as any).imports.gi.XplatMason
	check(
		'hint reaches native placeholder metadata',
		native.test_accessible_string_property(
			view,
			Gtk.AccessibleProperty.PLACEHOLDER,
			'Enter notes',
		) === null,
	)
	await render({ style: { ...style, padding: 9, borderWidth: 2 } })
	const [positioned, hintBounds] = hint.compute_bounds(view)
	const [hintX, hintY] = hint.get_layout_offsets()
	const caret = view.get_iter_location(buffer.get_start_iter())
	const [caretX, caretY] = view.buffer_to_window_coords(Gtk.TextWindowType.WIDGET, caret.x, caret.y)

	check(
		'hint starts at the padded editor text origin',
		positioned &&
			close(hintBounds.origin.x + hintX, caretX) &&
			close(hintBounds.origin.y + hintY, caretY),
	)
	await render({ style })
	await render({ placeholder: 'A long hint '.repeat(100) })
	check('long hint does not change width', close(view.get_width(), 280))
	check('long hint does not change row height', close(view.get_height(), initialHeight))
	await render({ placeholder: 'Enter notes', isReadOnly: true })
	check('read-only empty editor keeps its hint', hint.get_visible() && !view.get_editable())
	await render({ isReadOnly: false })
	if (GLib.getenv('GTK_TEXT_OS') === '1') {
		window.set_focus(null)
		await input(view, 'hint-click', 1)
		check('click through hint focuses the native editor', window.get_focus() === view)
	}
	await render({ value: 'One' })
	check('content hides the hint', !hint.get_visible())
	await render({ value: '', placeholder: undefined })
	check('removed hint stays hidden for empty content', !hint.get_visible())
	await render({ placeholder: 'Changed hint' })
	check(
		'replacement hint updates the label',
		hint.get_visible() && hint.get_label() === 'Changed hint',
	)
	await render({ value: 'One', placeholder: undefined, placeholderTextColor: undefined })
	const defaultHintColor = hint.get_style_context().get_color()
	const themedHintColor = new (globalThis as any).imports.gi.Gdk.RGBA()
	check(
		'theme defines a parseable hint color',
		themedHintColor.parse(editorNode.computedStyle!.placeholderColor),
	)
	check(
		'removing explicit hint color restores the theme hint color',
		['red', 'green', 'blue', 'alpha'].every(
			(key) => Math.abs(defaultHintColor[key] - themedHintColor[key]) < 0.01,
		),
	)
	if (GLib.getenv('GTK_TEXT_OS') === '1') {
		const edits: string[] = []
		await render({ value: 'abc', onChange: (value) => edits.push(value) })
		view.focus()
		view.select_region(1, 2)
		await input(view, 'type-X')
		check(
			'selection replacement reports one complete user edit: ' + JSON.stringify(edits),
			edits.length === 1 && edits[0] === 'aXc',
		)
		check('parent rejection restores the controlled value', view.text === 'abc')
		view.select_region(1, 2)
		await input(view, 'type-X')
		check('repeated rejection reports one new edit', edits.length === 2 && edits[1] === 'aXc')
		check('repeated rejection restores the controlled value', view.text === 'abc')
		edits.length = 0
		await render({
			onChange: (value) => {
				edits.push(value)
				props = { ...props, value }
				root.render(TextAreaHarness, props)
			},
		})
		view.set_position(1)
		await input(view, 'type-Y')
		check('accepting parent receives one edit', edits.length === 1 && edits[0] === 'aYbc')
		check(
			'accepted owner value remains in the editor',
			view.text === 'aYbc' && props.value === 'aYbc',
		)
		check('accepted edit keeps its native caret', view.get_position() === 2)
		await render({ value: 'One', onChange: undefined })
	}
	if (GLib.getenv('GTK_TEXT_OS') === '1') {
		const limitedEdits: string[] = []
		await render({
			value: '',
			maxLength: 3,
			onChange: (value) => {
				limitedEdits.push(value)
				props = { ...props, value }
				root.render(TextAreaHarness, props)
			},
		})
		view.focus()
		await input(view, 'type-ABCD')
		check(
			'TextArea forwards its native character cap',
			view.text === 'ABC' && props.value === 'ABC',
		)
		check(
			'TextArea only reports accepted inserted characters',
			limitedEdits.join(',') === 'A,AB,ABC',
		)
		await render({ maxLength: undefined })
		await input(view, 'type-D')
		check(
			'removing TextArea cap restores native insertion',
			view.text === 'ABCD' && props.value === 'ABCD',
		)
		await render({ value: '', maxLength: 0 })
		const beforeZero = limitedEdits.length
		await input(view, 'type-X')
		check(
			'zero TextArea cap blocks edits and callbacks',
			view.text === '' && limitedEdits.length === beforeZero,
		)
		await render({ value: 'One', maxLength: undefined, onChange: undefined })
	}
	const line = view.get_line_yrange(buffer.get_start_iter())[1]
	print(
		'GTK_TEXT_AREA_MEASURE ' +
			JSON.stringify({
				line,
				min: view.style.minHeight,
				max: view.style.maxHeight,
				height: view.get_height(),
				measure: view.measure(Gtk.Orientation.VERTICAL, 280),
			}),
	)
	check('native row height differs from the fallback for this font', line !== 24 && line > 0)
	check('three default rows use native line metrics', close(view.style.minHeight, line * 3))
	check('fixed rows constrain maximum', close(view.style.maxHeight, line * 3))
	check('fixed row allocation', close(view.get_height(), line * 3))
	const long = Array.from({ length: 12 }, (_, i) => 'Line ' + i).join('\n')
	await render({ value: long })
	check('long content keeps fixed row allocation', close(view.get_height(), line * 3))
	const adjustment = view.get_vadjustment()
	check(
		'bounded content has internal scroll range',
		adjustment.get_upper() > adjustment.get_page_size(),
	)
	const osInput = GLib.getenv('GTK_TEXT_OS') === '1'
	if (osInput) {
		view.focus()
		await input(view, 'end')
		check(
			'OS Ctrl End moves caret to final character',
			view.get_position() === Array.from(long).length,
		)
		check('OS keyboard scrolls the capped editor internally', adjustment.get_value() > 0)
		await input(view, 'home')
		check(
			'OS Ctrl Home restores the first line',
			adjustment.get_value() === 0 && view.get_position() === 0,
		)
		await input(view, 'wheel-down')
		check('OS wheel scrolls the capped editor internally', adjustment.get_value() > 0)
		await input(view, 'wheel-up', 12)
		check('OS reverse wheel restores the first line', adjustment.get_value() === 0)
		check('inner wheel leaves the app scroller still', outer.get_vadjustment().get_value() === 0)
		await render({ isReadOnly: true })
		await input(view, 'wheel-down')
		check('readOnly editor still scrolls', !view.get_editable() && adjustment.get_value() > 0)
		check('scrolling does not edit readOnly text', view.text === long)
		await input(view, 'wheel-up', 12)
		await render({ isDisabled: true, isReadOnly: false })
		await input(view, 'wheel-down')
		check('disabled editor does not scroll', !view.is_sensitive() && adjustment.get_value() === 0)
		outer.get_vadjustment().set_value(0)
		await pause(300)
		await render({ isDisabled: false })
		await input(view, 'outer-down', 6, 160)
		check('wheel outside the editor scrolls the app', outer.get_vadjustment().get_value() > 0)
		check('outer scrolling leaves the editor viewport still', adjustment.get_value() === 0)
		outer.get_vadjustment().set_value(0)
		await pause(300)
	}
	await render({ autoGrow: true, rows: 2, maxRows: 4 })
	check('bounded growth minimum rows', close(view.style.minHeight, line * 2))
	check('bounded growth maximum rows', close(view.style.maxHeight, line * 4))
	check('long content grows to row cap', close(view.get_height(), line * 4))
	await render({ value: 'Short' })
	check('short content shrinks to row floor', close(view.get_height(), line * 2))
	await render({ value: long, maxRows: undefined })
	check('removing maxRows clears old growth cap', view.get_height() > line * 4)
	await render({ autoGrow: false, rows: 3 })
	check('disabling growth restores fixed rows', close(view.get_height(), line * 3))
	await render({ style: { ...style, height: 35 } })
	check('explicit height supersedes previous row constraints', close(view.get_height(), 35))
	await render({
		style: { ...style, minHeight: 150, maxHeight: 200 },
		autoGrow: true,
		value: 'Small',
	})
	check('authored minHeight replaces generated row floor', close(view.get_height(), 150))
	await render({ value: long })
	check('authored maxHeight replaces generated row cap', close(view.get_height(), 200))
	check('row constraints do not cause font notifications', fontEvents === 0)
	await render({ style: { ...style, fontSize: 34 }, rows: 2 })
	const larger = view.get_line_yrange(buffer.get_start_iter())[1]
	check(
		'native row metrics follow font updates',
		larger > line && close(view.style.minHeight, larger * 2),
	)
	check('direct font change notifies subscribers', fontEvents > 0)
	await render({ style: { ...style, fontSize: undefined }, rows: 2, value: 'Small' })
	const small = view.get_line_yrange(buffer.get_start_iter())[1]
	const beforeParent = fontEvents
	await render({ frameClass: 'area-font-large' })
	const inherited = view.get_line_yrange(buffer.get_start_iter())[1]
	check(
		'ancestor CSS font change notifies the editor',
		fontEvents > beforeParent && inherited > small,
	)
	check('ancestor CSS updates the row floor', close(view.style.minHeight, inherited * 2))
	await render({ frameClass: undefined })
	check('ancestor font reset restores row floor', close(view.style.minHeight, small * 2))
	view.off('fontChanged', fontChanged)
	check('same editor survives sizing updates', areaRef.current!.native === view)
	await render({ value: '', placeholder: 'Retired hint' })
	check('hint is visible before disposal', hint.get_visible())
	view.add_css_class('pending-font-refit')
	root.unmount()
	check('font observers detach when the editor retires', editorNode.fontObservers?.size === 0)
	check('native handle clears on disposal', areaRef.current === null)
	buffer.insert_at_cursor('Retired buffer edit', -1)
	check('retired buffer cannot update the detached hint', hint.get_visible())
	await pause(40)
	const fieldHarness = createGtkRoot(host, {
		onUncaughtError(error) {
			throw error
		},
	})
	let fieldProps: Parameters<typeof TextAreaHarness>[0] = {
		defaultValue: 'Local',
		testID: 'draft-automation',
		rows: 2,
		style: { fontSize: 26, padding: 0, borderWidth: 0, margin: 0 },
	}
	const fieldRender = async (next: Partial<typeof fieldProps>) => {
		fieldProps = { ...fieldProps, ...next }
		fieldHarness.root.render(TextAreaHarness, fieldProps)
		await pause()
	}
	const fieldNodes = (name: string) =>
		[...fieldHarness.container.nodes.values()].filter((n) => n.cssClasses?.has(name))
	await fieldRender({})
	const localArea = areaRef.current!.native as any
	localArea.focus()
	localArea.set_position(5)
	if (osInput) await input(localArea, 'type-X')
	else {
		localArea.get_buffer().insert_at_cursor('X', -1)
		await pause()
	}
	check('uncontrolled edit is retained locally', localArea.text === 'LocalX')
	localArea.select_region(4, 1)
	await fieldRender({ label: 'Draft' })
	check('adding a label retains the native editor', areaRef.current!.native === localArea)
	check('adding a label retains uncontrolled text', localArea.text === 'LocalX')
	check('adding a label retains native focus', window.get_focus() === localArea)
	check(
		'adding a label retains backward selection',
		localArea.get_position() === 1 && localArea.get_selection_bounds().slice(1).join(',') === '1,4',
	)
	if (osInput) {
		window.set_focus(null)
		await input(fieldNodes('vx-field-label')[0].view, 'label-click', 1)
		check(
			'automatic label focuses an explicitly identified editor',
			window.get_focus() === localArea,
		)
	}
	await fieldRender({
		description: 'Keep this text',
		accessibilityHint: 'Extra context',
		width: '50%',
		isRequired: true,
		isReadOnly: true,
		isLoading: true,
		size: 'sm',
	})
	const chrome = fieldNodes('vx-field')[0]
	check('standalone TextArea owns one automatic field', fieldNodes('vx-field').length === 1)
	check('standalone width applies once to its field', close(chrome.view!.getBounds().width, 150))
	check('field width reaches the native editor once', close(localArea.get_width(), 150))
	check('readonly state reaches field chrome', chrome.cssClasses!.has('vx-field--readonly'))
	check('loading state reaches field chrome', chrome.cssClasses!.has('vx-field--loading'))
	check('size reaches field chrome', chrome.cssClasses!.has('vx-field--size-sm'))
	check(
		'readonly keeps a sensitive, noneditable editor',
		localArea.is_sensitive() && !localArea.get_editable(),
	)
	check(
		'required metadata reaches the editor',
		native.test_accessible_boolean_property(localArea, Gtk.AccessibleProperty.REQUIRED, true) ===
			null,
	)
	check(
		'busy metadata reaches the editor',
		native.test_accessible_state(localArea, Gtk.AccessibleState.BUSY, 1) === null,
	)
	check(
		'visible field label names the editor',
		native.test_accessible_string_property(localArea, Gtk.AccessibleProperty.LABEL, 'Draft') ===
			null,
	)
	check(
		'field description and own hint are combined once',
		native.test_accessible_string_property(
			localArea,
			Gtk.AccessibleProperty.DESCRIPTION,
			'Extra context. Keep this text',
		) === null,
	)
	await fieldRender({ status: { type: 'error', message: 'Try again' }, statusVariant: 'tooltip' })
	check('status variant reaches field chrome', chrome.cssClasses!.has('vx-field--status-tooltip'))
	check('tooltip status has no duplicate inline status', fieldNodes('vx-field-status').length === 0)
	check(
		'error state reaches the native editor',
		native.test_accessible_state(
			localArea,
			Gtk.AccessibleState.INVALID,
			Gtk.AccessibleInvalidState.TRUE,
		) === null,
	)
	check(
		'status joins the native hint without duplication',
		native.test_accessible_string_property(
			localArea,
			Gtk.AccessibleProperty.DESCRIPTION,
			'Extra context. Keep this text. Try again',
		) === null,
	)
	check(
		'field updates retain editor and text',
		areaRef.current!.native === localArea && localArea.text === 'LocalX',
	)
	await fieldRender({
		label: undefined,
		description: undefined,
		status: undefined,
		statusVariant: undefined,
		width: undefined,
		isRequired: false,
		isReadOnly: false,
		isLoading: false,
		size: undefined,
	})
	check(
		'removing chrome retains the editor and local text',
		areaRef.current!.native === localArea && localArea.text === 'LocalX',
	)
	check('removing field width restores available width', close(localArea.get_width(), 300))
	check('readonly reset reaches native editability', localArea.get_editable())
	check(
		'required metadata clears with the field flag',
		native.test_accessible_boolean_property(localArea, Gtk.AccessibleProperty.REQUIRED, false) ===
			null,
	)
	check(
		'busy metadata clears with the field flag',
		native.test_accessible_state(localArea, Gtk.AccessibleState.BUSY, 0) === null,
	)
	check(
		'invalid metadata clears with status removal',
		native.test_accessible_state(localArea, Gtk.AccessibleState.INVALID, 0) === null,
	)
	check(
		'field descriptions clear while own hint stays',
		native.test_accessible_string_property(
			localArea,
			Gtk.AccessibleProperty.DESCRIPTION,
			'Extra context',
		) === null,
	)
	await fieldRender({ isLoading: true })
	check(
		'loading keeps a sensitive editable editor',
		localArea.is_sensitive() && localArea.get_editable(),
	)
	localArea.focus()
	localArea.set_position(localArea.get_buffer().get_char_count())
	if (osInput) await input(localArea, 'type-Y')
	else {
		localArea.get_buffer().insert_at_cursor('Y', -1)
		await pause()
	}
	check('loading does not block native editing', localArea.text === 'LocalXY')
	await fieldRender({ isDisabled: true, isLoading: false })
	check(
		'disabled state reaches the editor and chrome',
		!localArea.is_sensitive() && chrome.cssClasses!.has('vx-field--disabled'),
	)
	await fieldRender({ isDisabled: false })
	areaRef.current!.focus()
	check('retained public handle still focuses the editor', window.get_focus() === localArea)
	fieldHarness.root.render(NestedAreaHarness, {})
	await pause()
	const nestedArea = areaRef.current!.native as any
	const nestedField = fieldNodes('vx-field')[0].view!
	check('native ID lookup ignores automation names', nestedField.getViewById('area') === nestedArea)
	check(
		'native ID lookup stays within its subtree',
		nestedField.getViewById('outside-area') === undefined,
	)
	check(
		'external field does not create an automatic duplicate',
		fieldNodes('vx-field').length === 1,
	)
	check(
		'external field owns its percentage width once',
		close(fieldNodes('vx-field')[0].view!.getBounds().width, 240) &&
			close(nestedArea.get_width(), 240),
	)
	check(
		'external field readonly state is inherited',
		!nestedArea.get_editable() && nestedArea.is_sensitive(),
	)
	check(
		'external field required metadata is inherited',
		native.test_accessible_boolean_property(nestedArea, Gtk.AccessibleProperty.REQUIRED, true) ===
			null,
	)
	check(
		'external field busy metadata is inherited',
		native.test_accessible_state(nestedArea, Gtk.AccessibleState.BUSY, 1) === null,
	)
	check(
		'external label owns the accessible name',
		native.test_accessible_string_property(
			nestedArea,
			Gtk.AccessibleProperty.LABEL,
			'Outer notes',
		) === null,
	)
	if (osInput) {
		const label = [...fieldHarness.container.nodes.values()].find(
			(n) => n.view instanceof Gtk.Label && n.view.get_text().startsWith('Outer notes'),
		)!
		window.set_focus(null)
		await input(label.view, 'label-click', 1)
		check(
			'actual outer label click focuses the multiline editor',
			window.get_focus() === nestedArea,
		)
	}
	fieldHarness.root.render(NestedAreaHarness, { childLabel: 'Specific editor name' })
	await pause()
	check(
		'explicit child label can override its accessible name',
		native.test_accessible_string_property(
			nestedArea,
			Gtk.AccessibleProperty.LABEL,
			'Specific editor name',
		) === null,
	)
	check(
		'child naming does not add visible field chrome',
		fieldNodes('vx-field').length === 1 && areaRef.current!.native === nestedArea,
	)
	fieldHarness.root.unmount()
	check('field-owned public handle clears on disposal', areaRef.current === null)
	check('disposed field lookup is inert', nestedField.getViewById('area') === undefined)
	const hosts: Array<[string, any]> = [
		['box', new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })],
		['fixed', new Gtk.Fixed()],
		['grid', new Gtk.Grid()],
		['scrolled', new Gtk.ScrolledWindow()],
	]
	for (const [name, nativeHost] of hosts) {
		window.set_child(nativeHost)
		const nested = createGtkRoot(nativeHost, {
			onUncaughtError(error) {
				throw error
			},
		})
		const initial = {
			generation: 1,
			content: name === 'box' ? Array.from({ length: 12 }, () => 'A line').join('\n') : undefined,
			width: 160,
			height: 80,
			left: name === 'fixed' ? 10 : undefined,
			top: name === 'fixed' ? 12 : undefined,
		}
		nested.root.render(StandaloneEditor, initial)
		await pause()
		const editor = standaloneRef.current
		const node = [...nested.container.nodes.values()].find(
			(node) => node.props.id === 'standalone-editor',
		)!
		const viewport = node.layoutView!
		check(
			name + ': native editor identity is public',
			editor === node.view && editor instanceof Gtk.TextView,
		)
		check(
			name + ': native scrolling host owns the editor',
			viewport.get_child() instanceof Gtk.ScrolledWindow &&
				viewport.get_child().get_child() === editor,
		)

		check(
			name + ': scrolling host mounts through viewless parents',
			viewport.is_ancestor(nativeHost),
		)
		check(
			name + ': initial physical size request',
			viewport.get_size_request().join(',') === '160,80',
		)
		if (name === 'box') {
			const allocated = await waitForAllocation(
				() =>
					close(viewport.get_width(), 160) &&
					close(viewport.get_height(), 80) &&
					close(editor.get_width(), 160),
			)
			check(
				'box: definite dimensions apply to the whole control: ' +
					JSON.stringify({
						size: [viewport.get_width(), viewport.get_height(), editor.get_width()],
						align: [viewport.get_halign(), viewport.get_valign()],
						expand: [viewport.get_hexpand(), viewport.get_vexpand()],
						measure: viewport.measure(Gtk.Orientation.VERTICAL, 160),
						scrollMeasure: node.textView!.scroller.measure(Gtk.Orientation.VERTICAL, 160),
						textMeasure: editor.measure(Gtk.Orientation.VERTICAL, 160),
						textRequest: editor.get_size_request(),
						font: editor.create_pango_layout('Mg').get_pixel_size(),
						style: node.computedStyle,
					}),
				allocated,
			)
			nested.root.render(StandaloneEditor, { ...initial, content: 'LongWord'.repeat(100) })
			await pause()
			check(
				'long unbroken text respects both explicit dimensions',
				await waitForAllocation(
					() => close(viewport.get_width(), 160) && close(viewport.get_height(), 80),
				),
			)
			nested.root.render(StandaloneEditor, { ...initial, width: undefined, height: undefined })
			check(
				'removing dimensions restores natural expansion',
				await waitForAllocation(() => viewport.get_width() > 160 && viewport.get_height() > 80),
			)
			nested.root.render(StandaloneEditor, initial)
			check(
				'restoring dimensions caps content again',
				await waitForAllocation(
					() => close(viewport.get_width(), 160) && close(viewport.get_height(), 80),
				),
			)
		}
		if (name === 'fixed') {
			const bounds = editor.getBounds()
			check('fixed: initial viewport position', close(bounds.x, 10) && close(bounds.y, 12))
		}
		nested.root.render(StandaloneEditor, {
			...initial,
			width: 90,
			height: 55,
			left: name === 'fixed' ? 25 : undefined,
			top: name === 'fixed' ? 30 : undefined,
		})
		await pause()
		check(
			name + ': size updates reach the physical host',
			viewport.get_size_request().join(',') === '90,55',
		)
		if (name === 'fixed') {
			const bounds = editor.getBounds()
			check('fixed: viewport position updates', close(bounds.x, 25) && close(bounds.y, 30))
		}
		nested.root.render(StandaloneEditor, { ...initial, translateX: 20, opacity: 0.4 })
		await pause()
		const [ok, translated] = viewport.compute_bounds(nativeHost)
		const [inside, relative] = editor.compute_bounds(viewport)
		check(
			name + ': transform moves the physical scrolling host',
			ok && close(translated.origin.x, (initial.left ?? 0) + 20),
		)
		check(name + ': editor is not translated twice', inside && close(relative.origin.x, 0))
		check(
			name + ': opacity applies once to the full control',
			Math.abs(viewport.get_opacity() - 0.4) < 0.01 && editor.get_opacity() === 1,
		)
		editor.focus()
		await pause()
		standaloneChanges.length = 0
		nested.root.render(StandaloneEditor, { ...initial, role: 'text' })
		await pause()
		const recreated = standaloneRef.current
		const recreatedViewport = node.layoutView!
		check(
			name + ': role recreation replaces both native widgets',
			recreated !== editor &&
				recreatedViewport !== viewport &&
				recreatedViewport.get_child().get_child() === recreated,
		)
		check(
			name + ': recreated physical host remains mounted',
			recreatedViewport.is_ancestor(nativeHost) && !viewport.is_ancestor(nativeHost),
		)
		check(name + ': recreation restores editor focus', window.get_focus() === recreated)
		recreated.get_buffer().insert_at_cursor('!', -1)
		check(
			name + ': recreated buffer retains its event descriptor',
			standaloneChanges.length === 1 && standaloneChanges[0] === '1:' + recreated.text,
		)
		nested.root.render(StandaloneEditor, { ...initial, generation: 2 })
		await pause()
		check(
			name + ': keyed replacement yields a new native editor',
			standaloneRef.current !== recreated && standaloneRef.current instanceof Gtk.TextView,
		)
		check(
			name + ': retired viewport leaves the host tree',
			!recreatedViewport.is_ancestor(nativeHost),
		)
		nested.root.unmount()
		await pause()
		check(name + ': standalone ref clears', standaloneRef.current === null)
	}
	window.destroy()
	print(
		'GTK_TEXT_AREA ' +
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
		console.error(error)
	})
	.finally(() => loop.quit())
loop.run()
if (failure) throw failure
