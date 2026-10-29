import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	SegmentedScene,
	SegmentedContextScene,
	SegmentedStandaloneScene,
} from './ui-segmented-control.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK segmented control test',
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
	if (!ok) failures.push(name)
}
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const segments = () => {
	const owner = nodes('vx-segmented')[0]
	if (!owner) return nodes('vx-segment')
	const found: (typeof owner)[] = []
	const walk = (node: typeof owner) => {
		if (node.cssClasses?.has('vx-segment')) {
			found.push(node)
			return
		}
		for (const child of node.children) walk(child)
	}
	walk(owner)
	return found
}
const group = () => nodes('vx-segmented')[0].view!
let native: any
const named = (view: any, value: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, value) === null
const bool = (view: any, key: number, value: boolean) =>
	native.test_accessible_boolean_property(view, key, value) === null
const state = (view: any, key: number, value: number) =>
	native.test_accessible_state(view, key, value) === null
let props: Parameters<typeof SegmentedScene>[0] = {
	defaultValue: 'a',
	label: 'View mode',
	description: 'Choose a mode',
	width: 280,
	layout: 'fill',
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(SegmentedScene, props)
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
const osInput = GLib.getenv('GTK_SEGMENTED_OS') === '1'
async function input(view: any, action: { type?: string; key?: string; click?: boolean }) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_SEGMENTED_READY ' +
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
	await pause(240)
	native = (globalThis as any).imports.gi.XplatMason
	for (const parts of [false, true]) {
		await render({ parts })
		const mode = parts ? 'parts' : 'options'
		check(mode + ': three segments', segments().length === 3)
		check(mode + ': one field owner', nodes('vx-field').length === 1)
		check(
			mode + ': field width',
			Math.abs((nodes('vx-field')[0]?.view?.getBounds().width ?? NaN) - 280) <= 2,
		)
		check(
			mode + ': radio group role',
			group().get_accessible_role() === Gtk.AccessibleRole.RADIO_GROUP,
		)
		check(mode + ': group name', named(group(), 'View mode'))
		check(mode + ': required metadata', bool(group(), Gtk.AccessibleProperty.REQUIRED, true))
		check(
			mode + ': radio segment roles',
			segments().every((n) => n.view!.get_accessible_role() === Gtk.AccessibleRole.RADIO),
		)
		check(
			mode + ': segment names',
			segments().every((n, i) => named(n.view, ['Alpha', 'Beta', 'Gamma'][i])),
		)
		check(
			mode + ': default checked segment',
			segments().every((n, i) => state(n.view, Gtk.AccessibleState.CHECKED, i === 0 ? 1 : 0)),
		)
		check(mode + ': disabled segment sensitivity', !segments()[1].view!.is_sensitive())
		check(
			mode + ': enabled segments focus',
			segments()[0].view!.get_focusable() && segments()[2].view!.get_focusable(),
		)
		const bounds = segments().map((n) => n.view!.getBounds())
		check(
			mode + ': fill gives equal segment widths',
			Math.max(...bounds.map((b) => b.width)) - Math.min(...bounds.map((b) => b.width)) <= 1,
		)
		check(
			mode + ': segments share one horizontal row',
			bounds.every((b) => Math.abs(b.y - bounds[0].y) <= 2) &&
				bounds[0].x < bounds[1].x &&
				bounds[1].x < bounds[2].x,
		)
		await render({
			isReadOnly: true,
			isLoading: true,
			status: { type: 'error', message: 'Choose again' },
		})
		check(mode + ': readOnly group metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
		check(mode + ': busy group metadata', state(group(), Gtk.AccessibleState.BUSY, 1))
		check(mode + ': invalid group metadata', state(group(), Gtk.AccessibleState.INVALID, 1))
		await render({ isReadOnly: false, isLoading: false, status: undefined, isDisabled: true })
		check(mode + ': disabled group sensitivity', !group().is_sensitive())
		await render({ isDisabled: false })
	}
	await render({ hidden: true })
	check('icon-only segment keeps its name', named(segments()[2].view, 'Gamma'))
	check(
		'icon-only segment has no visible label',
		!nodes('vx-segment-label').some((n) => (n.view as any).get_text() === 'Gamma'),
	)
	check('icon remains present', nodes('segmented-test-icon').length === 1)
	if (osInput) {
		const changes: string[] = []
		await render({ hidden: false, parts: false, onValueChange: (value) => changes.push(value) })
		const before = [...container.nodes.values()].find((n) => n.props.id === 'segment-before')!.view!
		const after = [...container.nodes.values()].find((n) => n.props.id === 'segment-after')!.view!
		const focused = (view: any) =>
			window.get_focus() === view || window.get_focus()?.is_ancestor(view)
		const checked = (index: number, value: boolean) =>
			state(segments()[index].view, Gtk.AccessibleState.CHECKED, value ? 1 : 0)
		before.grab_focus()
		await input(before, { key: 'Tab' })
		check('Tab enters the selected segment', focused(segments()[0].view))
		await input(segments()[0].view, { key: 'Right' })
		check(
			'arrow skips disabled segment and selects locally',
			checked(2, true) && changes.join() === 'c' && focused(segments()[2].view),
		)
		await input(segments()[2].view, { key: 'space' })
		check('selected Space does not notify again', changes.join() === 'c')
		await input(segments()[2].view, { key: 'Tab' })
		check('Tab leaves the segment group once', focused(after))
		await input(after, { key: 'shift+Tab' })
		check('reverse Tab enters selected segment', focused(segments()[2].view))
		await input(segments()[2].view, { key: 'Left' })
		check(
			'reverse arrow selects previous eligible segment',
			checked(0, true) && changes.at(-1) === 'a',
		)
		for (const parts of [false, true]) {
			const mode = parts ? 'parts' : 'options'
			await render({ parts, value: 'a', onValueChange: (value) => changes.push(value) })
			const retained = segments().map((n) => n.view)
			segments()[2].view!.grab_focus()
			await input(segments()[2].view, { key: 'space' })
			check(
				mode + ': controlled rejection keeps selection',
				checked(0, true) && checked(2, false) && changes.at(-1) === 'c',
			)
			await render({
				onValueChange: (value) => {
					changes.push(value)
					props = { ...props, value }
					root.render(SegmentedScene, props)
				},
			})
			await input(segments()[2].view, { key: 'space' })
			check(mode + ': controlled owner accepts selection', checked(2, true) && props.value === 'c')
			await input(segments()[0].view, { click: true })
			check(
				mode + ': pointer selects and focuses',
				checked(0, true) && props.value === 'a' && focused(segments()[0].view),
			)
			check(
				mode + ': selection retains segment widgets',
				segments().every((n, i) => n.view === retained[i]),
			)
			const count = changes.length
			await input(segments()[0].view, { key: 'Return' })
			check(mode + ': Return does not activate a radio segment', changes.length === count)
			await render({ isReadOnly: true })
			await input(segments()[0].view, { key: 'Right' })
			check(
				mode + ': readOnly arrows focus without selecting',
				focused(segments()[2].view) && checked(0, true) && changes.length === count,
			)
			await input(segments()[2].view, { click: true })
			check(
				mode + ': readOnly pointer focuses without selecting',
				focused(segments()[2].view) && checked(0, true) && changes.length === count,
			)
			await render({ isReadOnly: false, isDisabled: true })
			before.grab_focus()
			await input(before, { key: 'Tab' })
			check(mode + ': disabled group is skipped by Tab', focused(after) && changes.length === count)
			await render({ isDisabled: false })
		}
		await render({ value: undefined, defaultValue: 'c' })
		check('dropping controlled value restores original local owner', checked(0, true))
		check('default updates do not reset local owner', checked(2, false))
	}
	await render({
		parts: true,
		hidden: false,
		value: 'a',
		width: '75%',
		layout: 'fill',
		isOptional: true,
		size: 'lg',
	})
	const owner = group()
	const retained = new Map(segments().map((n) => [n.props.accessibilityLabel, n.view]))
	check(
		'percentage field and track widths consumed once',
		Math.abs(nodes('vx-field')[0].view!.getBounds().width - 240) <= 2 &&
			Math.abs(group().getBounds().width - 240) <= 2,
	)
	check('optional overrides required form', bool(group(), Gtk.AccessibleProperty.REQUIRED, false))
	check(
		'explicit size reaches group class',
		nodes('vx-segmented')[0].cssClasses?.has('vx-segmented--size-lg') === true,
	)
	await render({ layout: 'hug' })
	check(
		'hug track shrinks to content within field',
		group().getBounds().width > 0 && group().getBounds().width < 240,
	)
	await render({ layout: 'fill' })
	check('fill restores complete track width', Math.abs(group().getBounds().width - 240) <= 2)
	const widths = segments().map((n) => n.view!.getBounds().width)
	check('fill restores equal segment widths', Math.max(...widths) - Math.min(...widths) <= 1)
	await render({
		label: 'Changed mode',
		isLabelHidden: true,
		size: undefined,
		isOptional: undefined,
		className: 'segmented-custom',
		style: { opacity: 0.6 },
	})
	check('hidden heading preserves accessible group name', named(group(), 'Changed mode'))
	check(
		'size resets to inherited medium',
		nodes('vx-segmented')[0].cssClasses?.has('vx-segmented--size-md') === true,
	)
	check(
		'group required state resets to form default',
		bool(group(), Gtk.AccessibleProperty.REQUIRED, true),
	)
	check(
		'custom class and opacity apply',
		nodes('segmented-custom').length === 1 && Math.abs(group().get_opacity() - 0.6) < 0.02,
	)
	check(
		'field chrome changes preserve group and segments',
		group() === owner &&
			segments().every((n) => n.view === retained.get(n.props.accessibilityLabel)),
	)
	await render({ accessibilityLabel: 'Explicit mode', style: { width: 200 } })
	check('explicit accessible name overrides field name', named(group(), 'Explicit mode'))
	check('authored width overrides fill default', Math.abs(group().getBounds().width - 200) <= 2)
	await render({ accessibilityLabel: undefined, className: undefined, style: undefined })
	check(
		'name class and opacity reset',
		named(group(), 'Changed mode') &&
			nodes('segmented-custom').length === 0 &&
			group().get_opacity() === 1,
	)
	check(
		'dropping authored width restores fill class',
		Math.abs(group().getBounds().width - 240) <= 2,
	)
	check(
		'control id remains unique on group',
		[...container.nodes.values()].filter((n) => n.props.id === 'segmented-group').length === 1,
	)
	await render({ reverse: true })
	check(
		'keyed reorder changes logical order',
		segments()
			.map((n) => n.props.accessibilityLabel)
			.join() === 'Gamma,Beta,Alpha',
	)
	check(
		'keyed reorder preserves segment widgets',
		segments().every((n) => n.view === retained.get(n.props.accessibilityLabel)),
	)
	check(
		'keyed reorder changes physical order',
		segments()[0].view!.getBounds().x < segments()[2].view!.getBounds().x,
	)
	const beta = segments()[1].view!
	await render({ reverse: false, hideMiddle: true })
	check(
		'option removal detaches retired segment',
		segments().length === 2 && beta.get_parent() === null,
	)
	await render({ hideMiddle: false })
	check(
		'restored option preserves controlled selection',
		segments().length === 3 && state(segments()[0].view, Gtk.AccessibleState.CHECKED, 1),
	)
	await render({ empty: true })
	check(
		'empty control retains field and track',
		segments().length === 0 && group() === owner && nodes('vx-field').length === 1,
	)
	await render({ empty: false })
	check(
		'repopulation restores selection',
		segments().length === 3 && state(segments()[0].view, Gtk.AccessibleState.CHECKED, 1),
	)
	if (osInput) {
		await render({
			rtl: true,
			enableMiddle: true,
			value: 'a',
			onValueChange: (value) => {
				props = { ...props, value }
				root.render(SegmentedScene, props)
			},
		})
		check(
			'RTL reaches native segment direction',
			segments().every((n) => n.view!.get_direction() === Gtk.TextDirection.RTL),
		)
		check(
			'RTL reverses physical segment order',
			segments()[0].view!.getBounds().x > segments()[2].view!.getBounds().x,
		)
		segments()[0].view!.grab_focus()
		await input(segments()[0].view, { key: 'Right' })
		check(
			'RTL Right selects previous logical segment',
			props.value === 'c' && state(segments()[2].view, Gtk.AccessibleState.CHECKED, 1),
		)
		await input(segments()[2].view, { key: 'Left' })
		check(
			'RTL Left selects next logical segment',
			props.value === 'a' && state(segments()[0].view, Gtk.AccessibleState.CHECKED, 1),
		)
	}
	root.render(SegmentedContextScene, { defaultValue: 'c' })
	await pause()
	check('external owner is not duplicated', nodes('vx-field').length === 1)
	check('external group name', named(group(), 'Parent mode'))
	check('external readOnly metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	const contextOwner = group()
	root.render(SegmentedContextScene, { defaultValue: 'a', size: 'lg', isReadOnly: false })
	await pause()
	check(
		'external field keeps local default after prop update',
		state(segments()[2].view, Gtk.AccessibleState.CHECKED, 1),
	)
	check(
		'explicit child size overrides field size',
		nodes('vx-segmented')[0].cssClasses?.has('vx-segmented--size-lg') === true,
	)
	check(
		'parent readOnly remains authoritative',
		bool(group(), Gtk.AccessibleProperty.READ_ONLY, true),
	)
	check('context updates retain group', group() === contextOwner)
	root.render(SegmentedStandaloneScene, { value: 'alone', label: 'Standalone' })
	await pause()
	check(
		'standalone part is presentational',
		segments()[0].view!.get_accessible_role() !== Gtk.AccessibleRole.RADIO,
	)
	check('standalone part is not keyboard focusable', !segments()[0].view!.get_focusable())
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	print(
		'GTK_SEGMENTED ' +
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
