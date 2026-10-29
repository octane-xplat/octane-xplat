import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PinScene, PinContextScene } from './ui-pin-input.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK PIN input test',
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
	if (!ok) failures.push(name)
}
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const cells = () => nodes('vx-pininput-cell').map((n) => n.view! as any)
const group = () => nodes('vx-pininput')[0].view!
let native: any
const named = (view: any, value: string) =>
	native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, value) === null
const bool = (view: any, key: number, value: boolean) =>
	native.test_accessible_boolean_property(view, key, value) === null
const state = (view: any, key: number, value: number) =>
	native.test_accessible_state(view, key, value) === null
const changes: string[] = [],
	completed: string[] = []
let props: Parameters<typeof PinScene>[0] = {
	label: 'Code',
	width: 280,
	length: 4,
	value: '12',
	onValueChange: (value) => changes.push(value),
	onComplete: (value) => completed.push(value),
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(PinScene, props)
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
const osInput = GLib.getenv('GTK_PIN_OS') === '1'
async function input(view: any, action: { type?: string; key?: string; click?: boolean }) {
	const bounds = view.getBounds()
	const ack = acknowledgments + 1
	print(
		'GTK_PIN_READY ' +
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
const focused = (view: any) => {
	const focus = window.get_focus()
	return focus === view || focus?.is_ancestor(view) === true
}
const text = () =>
	cells()
		.map((view) => view.text)
		.join('')
async function run() {
	await render()
	window.present()
	await pause(240)
	native = (globalThis as any).imports.gi.XplatMason
	const original = cells()
	check(
		'four native Entry cells',
		original.length === 4 && original.every((view) => view instanceof Gtk.Entry),
	)
	check('one field owner', nodes('vx-field').length === 1)
	check('one visible group label', nodes('vx-field-label').length === 1)
	check('field width', Math.abs((nodes('vx-field')[0]?.view?.getBounds().width ?? NaN) - 280) <= 2)
	check('group role', group().get_accessible_role() === Gtk.AccessibleRole.GROUP)
	check('group name', named(group(), 'Code'))
	check('required group metadata', bool(group(), Gtk.AccessibleProperty.REQUIRED, true))
	check('programmatic initial code', original.map((view) => view.text).join('|') === '1|2||')
	check(
		'numbered cell names',
		original.every((view, i) => named(view, 'Code, digit ' + (i + 1))),
	)
	check(
		'numeric keyboard hint',
		original.every((view) =>
			[Gtk.InputPurpose.DIGITS, Gtk.InputPurpose.NUMBER].includes(view.input_purpose),
		),
	)
	check(
		'future cells remain readOnly until previous cells fill',
		original.every((view, i) => view.get_editable() === i <= 2),
	)
	const bounds = original.map((view) => view.getBounds())
	check(
		'cells occupy one horizontal row',
		bounds.every((b) => Math.abs(b.y - bounds[0].y) <= 2) && bounds[0].x < bounds[3].x,
	)
	check(
		'cells stay inside the row',
		bounds.every((b) => b.x + b.width <= group().getBounds().x + group().getBounds().width + 1),
	)
	check(
		'group id is unique',
		[...container.nodes.values()].filter((n) => n.props.id === 'pin-group').length === 1,
	)
	await render({ secure: true })
	check(
		'secure mode masks every cell',
		cells().every((view) => !view.get_visibility()),
	)
	await render({ secure: false })
	check(
		'secure reset restores text visibility',
		cells().every((view) => view.get_visibility()),
	)
	await render({ value: '34' })
	check(
		'programmatic changes update cell text',
		cells()
			.map((view) => view.text)
			.join('|') === '3|4||',
	)
	check(
		'programmatic writes do not report edits or completion',
		changes.length === 0 && completed.length === 0,
	)
	check(
		'text and secure changes retain cells',
		cells().every((view, i) => view === original[i]),
	)
	await render({ isLoading: true, status: { type: 'error', message: 'Try again' } })
	check('busy group metadata', state(group(), Gtk.AccessibleState.BUSY, 1))
	check('invalid group metadata', state(group(), Gtk.AccessibleState.INVALID, 1))
	check(
		'busy cell metadata',
		cells().every((view) => state(view, Gtk.AccessibleState.BUSY, 1)),
	)
	await render({ isReadOnly: true })
	check('readOnly group metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	check(
		'readOnly cells',
		cells().every((view) => !view.get_editable()),
	)
	await render({ isReadOnly: false, isDisabled: true })
	check('disabled group sensitivity', !group().is_sensitive())
	check(
		'disabled cells',
		cells().every((view) => !view.is_sensitive()),
	)
	root.render(PinContextScene, { length: 4, value: '12' })
	await pause()
	check('external field owner is not duplicated', nodes('vx-field').length === 1)
	check('external group name', named(group(), 'Parent code'))
	check('external readOnly group metadata', bool(group(), Gtk.AccessibleProperty.READ_ONLY, true))
	check(
		'external size reaches group',
		nodes('vx-pininput')[0].cssClasses?.has('vx-pininput--size-sm') === true,
	)
	// Changing the top-level scene starts a fresh uncontrolled owner.
	await render({
		label: 'Code',
		value: undefined,
		isDisabled: false,
		isReadOnly: false,
		isLoading: false,
		status: undefined,
	})
	check('fresh uncontrolled owner starts empty', text() === '')
	check(
		'only the first empty cell is editable',
		cells().every((v, i) => v.get_editable() === (i === 0)),
	)
	const editors = cells()
	if (osInput) {
		await input(cells()[3], { click: true })
		await input(cells()[3], { type: '8' })
		check('future cell cannot relocate an edit', text() === '' && changes.length === 0)
		await input(cells()[0], { click: true })
		check('pointer focuses the first editor', focused(cells()[0]))
		for (let i = 0; i < 4; i++) {
			await input(cells()[i], { type: String(i + 1) })
			check('sequential prefix ' + i, text() === '1234'.slice(0, i + 1))
			if (i < 3) check('automatic focus advances ' + i, focused(cells()[i + 1]))
		}
		check('each entered digit reports once', changes.join('|') === '1|12|123|1234')
		check('completion fires once for the filled code', completed.join('|') === '1234')
		await input(cells()[1], { click: true })
		await input(cells()[1], { key: 'ctrl+a' })
		await input(cells()[1], { key: 'BackSpace' })
		check('clearing a digit truncates its suffix', text() === '1' && changes.at(-1) === '1')
		check('clearing does not complete a code', completed.length === 1)
		check(
			'truncation disables future edits',
			cells().every((v, i) => v.get_editable() === i <= 1),
		)
		await input(cells()[1], { type: '5' })
		check('refilling advances to the next empty editor', text() === '15' && focused(cells()[2]))
		check(
			'sequential editing retains native editors',
			cells().every((v, i) => v === editors[i]),
		)
		await render({ secure: true })
		await input(cells()[2], { type: '6' })
		check('secure entry still advances', text() === '156' && focused(cells()[3]))
		check(
			'secure entry remains masked',
			cells().every((v) => !v.get_visibility()),
		)
		const count = changes.length
		await render({ isReadOnly: true })
		await input(cells()[3], { click: true })
		await input(cells()[3], { type: '7' })
		check('readOnly blocks OS edits', text() === '156' && changes.length === count)
		await render({ isReadOnly: false, isDisabled: true })
		await input(cells()[0], { click: true })
		await input(cells()[0], { type: '8' })
		check('disabled blocks OS edits', text() === '156' && changes.length === count)
		let accept = false
		await render({
			isDisabled: false,
			secure: false,
			value: '1',
			onValueChange(value) {
				changes.push(value)
				if (accept) {
					props = { ...props, value }
					root.render(PinScene, props)
				}
			},
		})
		await input(cells()[1], { click: true })
		await input(cells()[1], { type: '9' })
		check(
			'controlled rejection restores the owner value',
			text() === '1' && changes.at(-1) === '19',
		)
		check('rejected append does not advance focus', focused(cells()[1]))
		await input(cells()[1], { type: '9' })
		check('repeated rejection restores again', text() === '1' && changes.at(-1) === '19')
		accept = true
		await input(cells()[1], { type: '2' })
		check('controlled acceptance advances focus', text() === '12' && focused(cells()[2]))
		await input(cells()[2], { type: '34' })
		check('continuous OS typing fills subsequent cells', text() === '1234')
		check('controlled completion fires once', completed.join('|') === '1234|1234')
		await input(cells()[1], { click: true })
		await input(cells()[1], { key: 'ctrl+a' })
		await input(cells()[1], { type: '9' })
		check('replacing a digit preserves the suffix', text() === '1934')
		check('replacement completion reports the new code', completed.at(-1) === '1934')
	}
	const beforeProgrammatic = changes.length
	const beforeComplete = completed.length
	await render({ value: '12', length: 6 })
	check('growing length adds cells', cells().length === 6)
	check(
		'growing retains the existing editors',
		cells()
			.slice(0, 4)
			.every((v, i) => v === editors[i]),
	)
	check(
		'six cells fit the authored width',
		cells().every((v) => {
			const b = v.getBounds(),
				g = group().getBounds()
			return b.x >= g.x - 1 && b.x + b.width <= g.x + g.width + 1
		}),
	)
	check(
		'numbered ids are unique',
		new Set(nodes('vx-pininput-cell').map((n) => n.props.id)).size === 6,
	)
	await render({ length: 2 })
	check('shrinking length removes trailing cells', cells().length === 2 && text() === '12')
	check(
		'shrinking retains the prefix editors',
		cells().every((v, i) => v === editors[i]),
	)
	await render({ length: 0 })
	check('empty length removes every cell', cells().length === 0)
	await render({
		length: 1,
		value: '7',
		label: 'New code',
		isOptional: true,
		isRequired: true,
		className: 'pin-custom',
		style: { height: 55 },
	})
	check('single-cell code repopulates', cells().length === 1 && text() === '7')
	check('label update reaches the group', named(group(), 'New code'))
	check('label update reaches the editor', named(cells()[0], 'New code, digit 1'))
	check(
		'optional overrides required at the group',
		bool(group(), Gtk.AccessibleProperty.REQUIRED, false),
	)
	check(
		'optional overrides required at the cell',
		bool(cells()[0], Gtk.AccessibleProperty.REQUIRED, false),
	)
	check('custom class reaches the group', nodes('pin-custom').length === 1)
	check('authored group style applies', Math.abs(group().getBounds().height - 55) <= 1)
	await render({
		className: undefined,
		style: undefined,
		label: undefined,
		isOptional: undefined,
		isRequired: undefined,
	})
	check('custom class resets', nodes('pin-custom').length === 0)
	check('authored style resets', group().getBounds().height < 55)
	check('unlabelled editor gets its default numbered name', named(cells()[0], 'PIN, digit 1'))
	check(
		'programmatic length and value changes stay silent',
		changes.length === beforeProgrammatic && completed.length === beforeComplete,
	)
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	print(
		'GTK_PIN ' +
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
