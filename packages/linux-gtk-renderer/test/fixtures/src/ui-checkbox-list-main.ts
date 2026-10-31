import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	CheckboxListScene,
	CheckboxListContextScene,
	CheckboxStandaloneScene,
	SwitchFocusScene,
} from './ui-checkbox-list.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK checkbox list test',
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
const rows = () => {
	const owner = nodes('vx-checkbox-group')[0]
	if (!owner) {
		return nodes('vx-checkbox-row')
	}
	const found: (typeof owner)[] = []
	const walk = (node: typeof owner) => {
		if (node.cssClasses?.has('vx-checkbox-row')) {
			found.push(node)
			return
		}
		for (const child of node.children) {
			walk(child)
		}
	}
	walk(owner)
	return found
}
const group = () => nodes('vx-checkbox-group')[0].view!
let native: any
const named = (view: any, value: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, value) === null
const bool = (view: any, key: number, value: boolean) =>
	native.test_accessible_boolean_property(view, key, value) === null
const state = (view: any, key: number, value: number) =>
	native.test_accessible_state(view, key, value) === null
let props: Parameters<typeof CheckboxListScene>[0] = {
	defaultValue: ['a'],
	label: 'Features',
	description: 'Choose features',
	width: 280,
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(CheckboxListScene, props)
	await pause()
}
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
const osInput = GLib.getenv('GTK_CHECKBOX_LIST_OS') === '1'
async function input(view: any, action: { type?: string; key?: string; click?: boolean }) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_CHECKBOX_LIST_READY ' +
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
	for (const parts of [false, true]) {
		await render({ parts })
		const mode = parts ? 'parts' : 'options'
		check(mode + ': three checkbox rows', rows().length === 3)
		check(mode + ': one field owner', nodes('vx-field').length === 1)
		check(
			mode + ': field width',
			Math.abs((nodes('vx-field')[0]?.view?.getBounds().width ?? NaN) - 280) <= 2,
		)
		check(mode + ': group role', group().get_accessible_role() === Gtk.AccessibleRole.GROUP)
		check(mode + ': group name', named(group(), 'Features'))
		check(mode + ': required metadata', bool(group(), Gtk.AccessibleProperty.REQUIRED, true))
		check(
			mode + ': checkbox roles',
			rows().every((n) => n.view!.get_accessible_role() === Gtk.AccessibleRole.CHECKBOX),
		)
		check(
			mode + ': checkbox names',
			rows().every((n, i) => named(n.view, ['Alpha', 'Beta', 'Gamma'][i])),
		)
		check(
			mode + ': default checked set',
			rows().every((n, i) => state(n.view, Gtk.AccessibleState.CHECKED, i === 0 ? 1 : 0)),
		)
		check(mode + ': disabled option sensitivity', !rows()[1].view!.is_sensitive())
		check(
			mode + ': enabled rows focus',
			rows()[0].view!.get_focusable() && rows()[2].view!.get_focusable(),
		)
		check(mode + ': option end content', nodes('checkbox-test-end').length === 1)
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
		check(
			mode + ': disabled rows sensitivity',
			rows().every((n) => !n.view!.is_sensitive()),
		)
		await render({ isDisabled: false })
	}
	const changes: string[][] = []
	const checked = (index: number, value: boolean) =>
		state(rows()[index].view, Gtk.AccessibleState.CHECKED, value ? 1 : 0)
	const focused = (view: any) => window.get_focus() === view
	const label = (value: string) =>
		[...container.nodes.values()].find(
			(n) => n.type === 'label' && (n.view as any)?.get_text() === value,
		)!.view!
	if (osInput) {
		await render({ parts: false, onValueChange: (values) => changes.push([...values]) })
		rows()[0].view!.grab_focus()
		await input(rows()[0].view, { key: 'space' })
		check('local Space removes checked value', checked(0, false) && changes.at(-1)?.length === 0)
		await input(label('Gamma'), { click: true })
		check(
			'local pointer adds one checked value',
			checked(2, true) && changes.at(-1)?.join() === 'c',
		)
		check('pointer focuses the clicked checkbox', focused(rows()[2].view))
		const count = changes.length
		await input(rows()[2].view, { key: 'Return' })
		check('Return does not toggle a checkbox', changes.length === count && checked(2, true))
		rows()[0].view!.grab_focus()
		await input(rows()[0].view, { key: 'Tab' })
		check('Tab skips disabled checkbox', focused(rows()[2].view))
		await input(rows()[2].view, { key: 'space' })
		check(
			'local Space removes pointer selection',
			changes.at(-1)?.length === 0 && checked(2, false),
		)
		await render({ defaultValue: ['c'] })
		check('default updates do not reset local set', checked(0, false) && checked(2, false))
		await render({ isReadOnly: true })
		const readOnlyCount = changes.length
		rows()[0].view!.grab_focus()
		await input(label('Gamma'), { click: true })
		check(
			'readOnly pointer focuses without toggling',
			focused(rows()[2].view) && changes.length === readOnlyCount,
		)
		rows()[2].view!.set_focus_on_click(false)
		rows()[0].view!.grab_focus()
		await input(label('Gamma'), { click: true })
		check(
			'native focus-on-click opt-out is respected',
			focused(rows()[0].view) && changes.length === readOnlyCount,
		)
		rows()[2].view!.set_focus_on_click(true)
		await render({ isReadOnly: false })

		for (const parts of [false, true]) {
			const mode = parts ? 'parts' : 'options'
			await render({ parts, value: ['a'], onValueChange: (values) => changes.push([...values]) })
			const retained = rows().map((n) => n.view)
			rows()[2].view!.grab_focus()
			await input(rows()[2].view, { key: 'space' })
			check(
				mode + ': controlled rejection retains checked set',
				checked(0, true) && checked(2, false) && changes.at(-1)?.join() === 'a,c',
			)
			await render({
				onValueChange: (value) => {
					changes.push([...value])
					props = { ...props, value }
					root.render(CheckboxListScene, props)
				},
			})
			await input(rows()[2].view, { key: 'space' })
			check(
				mode + ': controlled Space accepts checked set',
				checked(0, true) && checked(2, true) && props.value?.join() === 'a,c',
			)
			await input(label('Alpha'), { click: true })
			check(
				mode + ': controlled pointer removes one value',
				checked(0, false) && checked(2, true) && props.value?.join() === 'c',
			)
			check(
				mode + ': selection retains row widgets',
				rows().every((n, i) => n.view === retained[i]),
			)
			await render({ isReadOnly: true })
			const count = changes.length
			rows()[2].view!.grab_focus()
			await input(rows()[2].view, { key: 'space' })
			await input(label('Alpha'), { click: true })
			check(
				mode + ': readOnly keyboard and pointer do not edit',
				changes.length === count && checked(0, false) && checked(2, true),
			)
			await render({ isReadOnly: false, isDisabled: true })
			await input(label('Alpha'), { click: true })
			check(mode + ': disabled pointer does not edit', changes.length === count)
			check(mode + ': disabled rows cannot focus', !rows()[0].view!.grab_focus())
			await render({ isDisabled: false })
		}
	}
	await render({
		parts: true,
		value: ['a'],
		isDisabled: false,
		isReadOnly: false,
		hasDividers: false,
	})
	const owner = group()
	const retained = new Map(
		rows().map((n) => [
			(n.view as any).get_accessible_role() + ':' + (n.props.accessibilityLabel ?? ''),
			n.view,
		]),
	)
	const beta = rows()[1].view!
	const plainBetaHeight = beta.getBounds().height
	await render({ hasDividers: true })
	check(
		'row dividers add native border height',
		Math.abs(beta.getBounds().height - plainBetaHeight - 1) <= 0.1,
	)
	check(
		'divider leaves checkbox inside row border',
		nodes('vx-ind-checkbox')[1].view!.getBounds().y +
			nodes('vx-ind-checkbox')[1].view!.getBounds().height <=
			beta.getBounds().y + beta.getBounds().height,
	)
	await render({ hasDividers: false })
	check(
		'removing dividers restores native row height',
		Math.abs(beta.getBounds().height - plainBetaHeight) <= 0.1,
	)
	await render({ width: '75%', size: 'lg', density: 'compact', isOptional: true })
	check(
		'percentage field and group width consumed once',
		Math.abs(nodes('vx-field')[0].view!.getBounds().width - 240) <= 2 &&
			Math.abs(group().getBounds().width - 240) <= 2,
	)
	check(
		'compact density uses small checkbox indicators',
		nodes('vx-ind-checkbox--sm').length === 3 &&
			nodes('vx-ind-checkbox--sm').every((n) => n.view!.getBounds().width === 20),
	)
	check(
		'optional overrides required form at group',
		bool(group(), Gtk.AccessibleProperty.REQUIRED, false),
	)
	await render({
		density: undefined,
		size: undefined,
		label: 'Changed features',
		className: 'checkbox-custom',
		style: { opacity: 0.6 },
		isLabelHidden: true,
	})
	check(
		'indicator size resets to default',
		nodes('vx-ind-checkbox--md').length === 3 &&
			nodes('vx-ind-checkbox--md').every((n) => n.view!.getBounds().width === 24),
	)
	check(
		'group size resets to inherited medium',
		nodes('vx-checkbox-group')[0].cssClasses?.has('vx-checkbox-group--size-md') === true,
	)
	check('hidden group heading preserves accessible name', named(group(), 'Changed features'))
	check(
		'custom group class and opacity apply',
		nodes('checkbox-custom').length === 1 && Math.abs(group().get_opacity() - 0.6) < 0.02,
	)
	check(
		'heading and state changes retain group and rows',
		group() === owner &&
			rows().every(
				(n) =>
					n.view ===
					retained.get(n.view!.get_accessible_role() + ':' + (n.props.accessibilityLabel ?? '')),
			),
	)
	await render({ className: undefined, style: undefined, horizontal: true })
	check(
		'class and opacity reset',
		nodes('checkbox-custom').length === 0 && group().get_opacity() === 1,
	)
	const horizontal = rows().map((n) => n.view!.getBounds())
	check(
		'horizontal rows share an allocation row',
		horizontal.every((bounds) => Math.abs(bounds.y - horizontal[0].y) <= 2) &&
			horizontal[0].x < horizontal[1].x &&
			horizontal[1].x < horizontal[2].x,
	)
	await render({ style: { flexDirection: 'column' } })
	const vertical = rows().map((n) => n.view!.getBounds())
	check(
		'authored direction overrides horizontal default',
		vertical[0].y < vertical[1].y && vertical[1].y < vertical[2].y,
	)
	await render({ style: undefined })
	const resetRow = rows().map((n) => n.view!.getBounds())
	check(
		'dropping authored direction restores horizontal class',
		resetRow.every((bounds) => Math.abs(bounds.y - resetRow[0].y) <= 2),
	)
	await render({ style: undefined, horizontal: false, reverse: true })
	check(
		'keyed reorder changes logical row order',
		rows()
			.map((n) => n.props.accessibilityLabel)
			.join() === 'Gamma,Beta,Alpha',
	)
	check(
		'keyed reorder retains row widgets',
		rows().every(
			(n) =>
				n.view ===
				retained.get(n.view!.get_accessible_role() + ':' + (n.props.accessibilityLabel ?? '')),
		),
	)
	check(
		'keyed reorder changes physical positions',
		rows()[0].view!.getBounds().y < rows()[2].view!.getBounds().y,
	)
	await render({ reverse: false, hideMiddle: true })
	check('option removal detaches disabled row', rows().length === 2 && beta.get_parent() === null)
	await render({ hideMiddle: false })
	check(
		'option restoration preserves checked value',
		rows().length === 3 && state(rows()[0].view, Gtk.AccessibleState.CHECKED, 1),
	)
	await render({ longDescription: true, width: 200 })
	const description = nodes('vx-checkbox-description')[0].view!
	const end = nodes('checkbox-test-end')[0].view!
	check(
		'long option description wraps inside field',
		description.getBounds().height >= 28 &&
			description.getBounds().x + description.getBounds().width <= group().getBounds().x + 200,
	)
	check(
		'trailing content follows the label column',
		end.getBounds().x >= description.getBounds().x + description.getBounds().width - 2,
	)
	await render({ empty: true })
	check(
		'empty list retains its field and group',
		rows().length === 0 && group() === owner && nodes('vx-field').length === 1,
	)
	await render({ empty: false, longDescription: false })
	check(
		'repopulation restores controlled checked set',
		rows().length === 3 && state(rows()[0].view, Gtk.AccessibleState.CHECKED, 1),
	)
	root.render(CheckboxListContextScene, { defaultValue: ['c'] })
	await pause()
	check('external owner is not duplicated', nodes('vx-field').length === 1)
	check('external group name', named(group(), 'Parent features'))
	check('external readOnly metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	root.render(CheckboxStandaloneScene, { isChecked: 'indeterminate' })
	await pause()
	const standalone = rows()[0].view!
	check(
		'standalone checkbox role',
		standalone.get_accessible_role() === Gtk.AccessibleRole.CHECKBOX,
	)
	check('standalone mixed checked metadata', state(standalone, Gtk.AccessibleState.CHECKED, 2))
	check('standalone accessible name', named(standalone, 'Select all'))
	check('standalone focusable', standalone.get_focusable())
	if (osInput) {
		const requests: boolean[] = []
		root.render(CheckboxStandaloneScene, {
			isChecked: 'indeterminate',
			onCheck: (value) => requests.push(value),
		})
		await pause()
		standalone.grab_focus()
		await input(standalone, { key: 'space' })
		check(
			'standalone mixed requests true and retains controlled mixed',
			requests.join() === 'true' && state(standalone, Gtk.AccessibleState.CHECKED, 2),
		)
		const accept = (value: boolean) => {
			requests.push(value)
			root.render(CheckboxStandaloneScene, { isChecked: value, onCheck: accept })
		}
		root.render(CheckboxStandaloneScene, { isChecked: 'indeterminate', onCheck: accept })
		await pause()
		await input(standalone, { key: 'space' })
		check(
			'standalone owner accepts mixed toggle',
			state(standalone, Gtk.AccessibleState.CHECKED, 1),
		)
		await input(standalone, { key: 'space' })
		check(
			'standalone owner accepts unchecked toggle',
			state(standalone, Gtk.AccessibleState.CHECKED, 0) && requests.at(-1) === false,
		)
	}
	if (osInput) {
		const changes: boolean[] = []
		const onChange = (value: boolean) => changes.push(value)
		root.render(SwitchFocusScene, { isReadOnly: true, onChange })
		await pause()
		const origin = rows()[0].view!
		const target = [...container.nodes.values()].find(
			(n) => n.view?.get_accessible_role() === Gtk.AccessibleRole.SWITCH,
		)!.view!
		origin.grab_focus()
		await input(label('Focus switch'), { click: true })
		check(
			'readOnly switch pointer focuses without editing',
			focused(target) && changes.length === 0,
		)
		target.set_focus_on_click(false)
		origin.grab_focus()
		await input(label('Focus switch'), { click: true })
		check('switch focus-on-click opt-out is respected', focused(origin) && changes.length === 0)
		target.set_focus_on_click(true)
		root.render(SwitchFocusScene, { onChange })
		await pause()
		await input(label('Focus switch'), { click: true })
		check(
			'switch pointer focuses and requests one toggle',
			focused(target) && changes.join() === 'true',
		)
		root.render(SwitchFocusScene, { isDisabled: true, onChange })
		await pause()
		origin.grab_focus()
		await input(label('Focus switch'), { click: true })
		check(
			'disabled switch does not take pointer focus or edit',
			focused(origin) && changes.join() === 'true',
		)
	}
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	print(
		'GTK_CHECKBOX_LIST ' +
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
