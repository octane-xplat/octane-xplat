import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	ToggleFields,
	ToggleContexts,
	actions,
	changes,
	hasPending,
	settle,
} from './ui-toggle-fields.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK toggle fields test',
	default_width: 400,
	default_height: 450,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const errors: unknown[] = []
const { root, container } = createGtkRoot(host, { onUncaughtError: (error) => errors.push(error) })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 180) =>
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
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const owner = (value: any) => {
	const form = node('toggle-fields')
	while (value.parent && value.parent !== form) {
		value = value.parent
	}
	return value
}
const labels = (name: string) =>
	[...container.nodes.values()].filter(
		(n) => n.type === 'label' && String(n.props.text).startsWith(name),
	)
const visible = (value: any) => !!value?.view?.get_mapped() && value.view.getBounds().height > 0
let ack = 0,
	osInput = false
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: any, key: number) => {
	if (key === Gdk.KEY_F12) {
		ack++
		return true
	}
	return false
})
window.add_controller(keys)
async function clickLabel(value: any) {
	const bounds = value.view.getBounds()
	const next = ack + 1
	print(
		'GTK_TOGGLE_FIELDS_READY ' +
			JSON.stringify({
				phase: 'label',
				x: Math.floor(bounds.x + bounds.width / 2),
				y: Math.floor(bounds.y + bounds.height / 2),
			}),
	)
	for (let i = 0; i < 250 && ack < next; i++) {
		await pause(20)
	}
	check('OS label input acknowledged', ack >= next)
	await pause()
}
let props: Parameters<typeof ToggleFields>[0] = {
	width: 220,
	required: true,
	loading: true,
	readOnly: true,
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(ToggleFields, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause()
	const native = (globalThis as any).imports.gi.XplatMason
	const checkbox = node('field-checkbox').view!,
		toggle = node('field-switch').view!
	for (const [id, view] of [
		['field-checkbox', checkbox],
		['field-switch', toggle],
	] as const) {
		const field = owner(node(id))

		check(
			id + ' authored width sizes the whole field',
			Math.abs(field.view.getBounds().width - 220) <= 2,
		)
		check(
			id + ' inherits required metadata',
			native.test_accessible_boolean_property(view, Gtk.AccessibleProperty.REQUIRED, true) === null,
		)
		check(
			id + ' exposes read-only metadata',
			native.test_accessible_boolean_property(view, Gtk.AccessibleProperty.READ_ONLY, true) ===
				null,
		)
		check(
			id + ' exposes loading metadata',
			native.test_accessible_state(view, Gtk.AccessibleState.BUSY, 1) === null,
		)
	}
	await render({ hidden: true, loading: false, readOnly: false })

	check('hidden checkbox label has no visible text', !labels('Keep receipts').some(visible))
	check('hidden switch label has no visible text', !labels('Notifications').some(visible))
	check(
		'hiding labels retains both control hosts',
		node('field-checkbox').view === checkbox && node('field-switch').view === toggle,
	)
	await render({ hidden: false, required: false })
	if (GLib.getenv('GTK_TOGGLE_FIELDS_OS') === '1') {
		osInput = true
		await clickLabel(labels('Notifications')[0])
		check(
			'switch label dispatches one requested change',
			changes.length === 1 && changes[0][0] === 'switch' && changes[0][1] === true,
		)
		check(
			'switch label also invokes changeAction once',
			actions.length === 1 && actions[0][0] === 'switch' && hasPending('switch'),
		)
		if (hasPending('switch')) {
			settle('switch', false)
			await pause()
			check(
				'rejected switch label action reports the previous value',
				changes.length === 2 && changes[1][1] === false,
			)
		}
	}
	const checked = (view: any, value: number) =>
		native.test_accessible_state(view, Gtk.AccessibleState.CHECKED, value) === null
	const boolean = (view: any, property: number, value: boolean) =>
		native.test_accessible_boolean_property(view, property, value) === null
	const description = (view: any, value: string) =>
		native.test_accessible_string_property(view, Gtk.AccessibleProperty.DESCRIPTION, value) === null
	const busy = (view: any, value: boolean) =>
		native.test_accessible_state(view, Gtk.AccessibleState.BUSY, value ? 1 : 0) === null
	for (const [name, view, help, issue] of [
		['checkbox', checkbox, 'Checkbox help', 'Checkbox issue'],
		['switch', toggle, 'Switch help', 'Switch issue'],
	] as const) {
		check(
			name + ' drops required/read-only/loading metadata',
			boolean(view, Gtk.AccessibleProperty.REQUIRED, false) &&
				boolean(view, Gtk.AccessibleProperty.READ_ONLY, false) &&
				busy(view, false),
		)
		check(name + ' announces help and validation', description(view, help + '. ' + issue))
		check(
			name + ' exposes invalid state',
			native.test_accessible_state(view, Gtk.AccessibleState.INVALID, 1) === null,
		)
		check(
			name + ' keeps automation identity independent from control ID',
			view.get_name() === name + '-automation',
		)
	}
	check(
		'checkbox label tooltip reaches native hint',
		description(labels('Keep receipts')[0].view, 'Checkbox tip'),
	)
	check(
		'switch label tooltip reaches native hint',
		description(labels('Notifications')[0].view, 'Switch tip'),
	)
	await render({ width: 280, required: true, optional: true, size: 'sm' })
	check(
		'optional controls override the form required default',
		boolean(checkbox, Gtk.AccessibleProperty.REQUIRED, false) &&
			boolean(toggle, Gtk.AccessibleProperty.REQUIRED, false),
	)
	check(
		'optional labels render their marker',
		labels('Keep receipts')[0].props.text.endsWith(' (Optional)') &&
			labels('Notifications')[0].props.text.endsWith(' (Optional)'),
	)
	check(
		'size provider reaches both controls',
		node('field-checkbox').props.className.includes('vx-checkbox--size-sm') &&
			node('field-switch').children.some((n) =>
				String(n.props.className).includes('vx-switch--size-sm'),
			),
	)
	const primaryIndicator = node('field-checkbox').children.find((n) =>
		String(n.props.className).split(' ').includes('vx-ind-checkbox'),
	)!.view!
	const primaryTrack = node('field-switch').children.find((n) =>
		String(n.props.className).split(' ').includes('vx-switch'),
	)!.view!
	check(
		'small size changes physical indicator and track geometry',
		primaryIndicator.getBounds().width === 20 &&
			primaryTrack.getBounds().width === 32 &&
			primaryTrack.getBounds().height === 20,
	)
	await render({ width: '50%', opacity: 0.6, hint: 'Custom hint' })
	check(
		'percentage width sizes the complete fields relative to their form',
		Math.abs(owner(node('field-checkbox')).view.getBounds().width - 180) <= 2 &&
			Math.abs(owner(node('field-switch')).view.getBounds().width - 180) <= 2,
	)
	check(
		'authored styles and classes reach the visual controls',
		Math.abs(checkbox.get_opacity() - 0.6) < 0.01 &&
			Math.abs(primaryTrack.get_opacity() - 0.6) < 0.01 &&
			node('field-checkbox').props.className.includes('fixture-toggle') &&
			node('field-switch').children.some((n) =>
				String(n.props.className).includes('fixture-toggle'),
			),
	)
	check(
		'explicit hints compose with field help and validation',
		description(checkbox, 'Custom hint. Checkbox help. Checkbox issue') &&
			description(toggle, 'Switch help. Switch issue'),
	)
	await render({ width: 280, opacity: undefined, hint: undefined })
	check(
		'style removal restores opacity without replacing visual hosts',
		checkbox.get_opacity() === 1 &&
			primaryTrack.get_opacity() === 1 &&
			node('field-switch').children.some((n) => n.view === primaryTrack),
	)
	checkbox.focus()
	await render({ hidden: true, status: false })
	check(
		'chrome and width updates retain focused control identity',
		node('field-checkbox').view === checkbox &&
			window.get_focus() === checkbox &&
			node('field-switch').view === toggle,
	)
	check(
		'changed width applies to both field owners',
		Math.abs(owner(node('field-checkbox')).view.getBounds().width - 280) <= 2 &&
			Math.abs(owner(node('field-switch')).view.getBounds().width - 280) <= 2,
	)
	check(
		'status removal clears invalid state and hint',
		native.test_accessible_state(checkbox, Gtk.AccessibleState.INVALID, 0) === null &&
			description(checkbox, 'Checkbox help') &&
			description(toggle, 'Switch help'),
	)
	await render({ hidden: false, optional: false, required: false, size: undefined })
	const track = () =>
		node('field-switch').children.find((n) =>
			String(n.props.className).split(' ').includes('vx-switch'),
		)!.view!
	await render({ labelPosition: 'start', labelSpacing: 'hug' })
	let labelBounds = labels('Notifications')[0].view!.getBounds()
	let trackBounds = track().getBounds()
	check(
		'start hug places label before track',
		labelBounds.x + labelBounds.width <= trackBounds.x + 2,
	)
	check('start hug stays at the field start', Math.abs(labelBounds.x - toggle.getBounds().x) <= 2)
	await render({ labelPosition: 'end', labelSpacing: 'spread' })
	labelBounds = labels('Notifications')[0].view!.getBounds()
	trackBounds = track().getBounds()
	check(
		'end spread places label at the field end',
		labelBounds.x >= trackBounds.x + trackBounds.width + 20 &&
			Math.abs(
				labelBounds.x + labelBounds.width - (toggle.getBounds().x + toggle.getBounds().width),
			) <= 2,
	)
	await render({ labelPosition: undefined, labelSpacing: undefined })
	check(
		'removing label layout props keeps hosts and restores order',
		node('field-switch').view === toggle &&
			labels('Notifications')[0].view!.getBounds().x > track().getBounds().x,
	)
	if (osInput) {
		for (const [name, view, label] of [
			['checkbox', checkbox, 'Keep receipts'],
			['switch', toggle, 'Notifications'],
		] as const) {
			const before = changes.length,
				beforeActions = actions.length
			await clickLabel(labels(label)[0])
			check(
				name + ' label enters one optimistic action',
				changes.length === before + 1 &&
					changes[before][0] === name &&
					changes[before][1] === true &&
					actions.length === beforeActions + 1 &&
					hasPending(name) &&
					checked(view, Gtk.AccessibleTristate.TRUE) &&
					busy(view, true),
			)
			settle(name, true)
			await pause()
			check(
				name + ' successful action preserves value and clears pending',
				checked(view, Gtk.AccessibleTristate.TRUE) &&
					busy(view, false) &&
					changes.length === before + 1,
			)
		}
		await render({ checkboxValue: true, switchValue: true })
		for (const [name, view, label] of [
			['checkbox', checkbox, 'Keep receipts'],
			['switch', toggle, 'Notifications'],
		] as const) {
			const before = changes.length
			await clickLabel(labels(label)[0])
			check(
				name + ' controlled request leaves owner value intact',
				changes[before][1] === false &&
					checked(view, Gtk.AccessibleTristate.TRUE) &&
					hasPending(name),
			)
			settle(name, false)
			await pause()
			check(
				name + ' controlled rejection reports previous value',
				changes.length === before + 2 &&
					changes[before + 1][1] === true &&
					checked(view, Gtk.AccessibleTristate.TRUE) &&
					busy(view, false),
			)
		}
		await render({ checkboxValue: undefined, switchValue: undefined, throws: true })
		for (const [name, view, label] of [
			['checkbox', checkbox, 'Keep receipts'],
			['switch', toggle, 'Notifications'],
		] as const) {
			const before = changes.length
			await clickLabel(labels(label)[0])
			check(
				name + ' synchronous action failure rolls back without an effect error',
				changes.length === before + 2 &&
					changes[before][1] === false &&
					changes[before + 1][1] === true &&
					checked(view, Gtk.AccessibleTristate.TRUE) &&
					busy(view, false) &&
					!hasPending(name),
			)
		}
		await render({ throws: false, readOnly: true })
		let before = changes.length
		await clickLabel(labels('Keep receipts')[0])
		await clickLabel(labels('Notifications')[0])
		check(
			'read-only labels cannot start changes or actions',
			changes.length === before && !hasPending('checkbox') && !hasPending('switch'),
		)
		await render({ readOnly: false, disabled: true })
		before = changes.length
		await clickLabel(labels('Keep receipts')[0])
		await clickLabel(labels('Notifications')[0])
		check(
			'disabled labels cannot start changes',
			changes.length === before && !checkbox.get_sensitive() && !toggle.get_sensitive(),
		)
		check(
			'disabled reason joins the native hint',
			description(checkbox, 'Checkbox help. Checkbox locked') &&
				description(toggle, 'Switch help. Switch locked'),
		)
		await render({ disabled: false })
		check(
			'dropping disabled restores sensitivity and removes reason',
			checkbox.get_sensitive() &&
				toggle.get_sensitive() &&
				description(checkbox, 'Checkbox help') &&
				description(toggle, 'Switch help'),
		)
	}
	root.render(ToggleContexts, { active: true })
	await pause()
	const contextCheckbox = node('context-checkbox').view!,
		contextSwitch = node('context-switch').view!
	for (const [id, view] of [
		['context-checkbox', contextCheckbox],
		['context-switch', contextSwitch],
	] as const) {
		check(
			id + ' inherits field flags',
			!view.get_sensitive() &&
				busy(view, true) &&
				boolean(view, Gtk.AccessibleProperty.READ_ONLY, true) &&
				boolean(view, Gtk.AccessibleProperty.REQUIRED, false),
		)
		check(
			id + ' inherits provider size without a nested field',
			node(id).props.className.includes(
				id === 'context-checkbox' ? 'vx-checkbox--size-sm' : 'vx-switch-row',
			) &&
				[...container.nodes.values()].filter((n) =>
					String(n.props.className).split(' ').includes('vx-field'),
				).length === 2,
		)
	}
	check(
		'field default values include mixed and selected',
		checked(contextCheckbox, Gtk.AccessibleTristate.MIXED) &&
			checked(contextSwitch, Gtk.AccessibleTristate.TRUE),
	)
	check(
		'explicit accessible name wins over field label',
		native.test_accessible_string_property(
			contextCheckbox,
			Gtk.AccessibleProperty.LABEL,
			'Custom context name',
		) === null,
	)
	check(
		'external field help and disabled reason are inherited',
		description(contextCheckbox, 'Inherited checkbox help. Inherited issue. Inherited lock'),
	)
	check(
		'external field label supplies the switch accessible name',
		native.test_accessible_string_property(
			contextSwitch,
			Gtk.AccessibleProperty.LABEL,
			'Context switch',
		) === null,
	)
	root.render(ToggleContexts, { active: false, overrideSize: true })
	await pause()
	check(
		'field updates retain child owners',
		node('context-checkbox').view === contextCheckbox &&
			node('context-switch').view === contextSwitch,
	)
	check(
		'field removal restores required default and read-only/loading states',
		contextCheckbox.get_sensitive() &&
			contextSwitch.get_sensitive() &&
			busy(contextCheckbox, false) &&
			boolean(contextCheckbox, Gtk.AccessibleProperty.READ_ONLY, false) &&
			boolean(contextCheckbox, Gtk.AccessibleProperty.REQUIRED, true),
	)
	check(
		'explicit control size overrides provider',
		node('context-checkbox').props.className.includes('vx-checkbox--size-lg') &&
			node('context-switch').children.some((n) =>
				String(n.props.className).includes('vx-switch--size-lg'),
			),
	)
	const contextTrack = node('context-switch').children.find((n) =>
		String(n.props.className).split(' ').includes('vx-switch'),
	)!.view!
	check(
		'larger size restores the standard track dimensions',
		contextTrack.getBounds().width === 40 && contextTrack.getBounds().height === 24,
	)
	if (osInput) {
		const before = changes.length
		await clickLabel(labels('Context checkbox')[0])
		check(
			'external field label focuses its control',
			window.get_focus() === contextCheckbox && changes.length === before,
		)
		// The visible checkbox's explicit accessible name differs from its label;
		// use the control surface to exercise the uncontrolled mixed rollback.
		await clickLabel(node('context-checkbox'))
		check(
			'uncontrolled mixed click requests true',
			changes[before][1] === true && hasPending('context-checkbox'),
		)
		settle('context-checkbox', false)
		await pause()
		check(
			'uncontrolled mixed rejection restores mixed native state',
			checked(contextCheckbox, Gtk.AccessibleTristate.MIXED) &&
				changes[before + 1][1] === false &&
				busy(contextCheckbox, false),
		)
		await clickLabel(node('context-switch'))
		check('context switch starts an action before disposal', hasPending('context-switch'))
	}
	root.unmount()
	if (osInput && hasPending('context-switch')) {
		settle('context-switch', true)
		await pause()
		check(
			'settling a retired action does not recreate native children',
			host.get_first_child() == null,
		)
	}
	check('updates complete without effect errors', errors.length === 0)
	check('unmount clears native host', host.get_first_child() == null)
	window.destroy()
	print('GTK_TOGGLE_FIELD_RESULTS ' + JSON.stringify({ checks, failures, osInput }))
	if (failures.length) {
		throw new Error(failures.join('; '))
	}
	print(
		'GTK_TOGGLE_FIELDS ' +
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
	print('GTK_TOGGLE_FIELD_FAILURES ' + JSON.stringify({ checks, failures, osInput }))
	console.error(error)
	try {
		root.unmount()
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
