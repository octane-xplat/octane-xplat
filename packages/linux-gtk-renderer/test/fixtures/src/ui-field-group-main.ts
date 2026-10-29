import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { FieldGroupScene, memberRefs, changes, readings } from './ui-field-group.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK field group test',
	default_width: 440,
	default_height: 650,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const errors: unknown[] = []
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		errors.push(error)
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 200) =>
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
let props: Parameters<typeof FieldGroupScene>[0] = {
	groupLabel: 'Address',
	width: 300,
	requiredDefault: true,
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(FieldGroupScene, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause()
	const groupNode = node('address-group')
	const group = groupNode.view!
	const first = memberRefs[0]!.native as any
	const second = memberRefs[1]!.native as any
	const native = (globalThis as any).imports.gi.XplatMason
	const labelIs = (view: any, label: string) =>
		native.test_accessible_string_property(view, Gtk.AccessibleProperty.LABEL, label) === null
	check(
		'related fields have a native group role',
		group.get_accessible_role() === Gtk.AccessibleRole.GROUP,
	)
	check('field group has its own accessible name', labelIs(group, 'Address'))
	check(
		'member control keeps its individual name',
		labelIs(first, 'Street') && labelIs(second, 'City'),
	)
	check('custom class reaches the group', groupNode.cssClasses.has('group-custom'))
	check('authored group width reaches GTK', Math.abs(group.getBounds().width - 300) <= 2)
	check(
		'related fields remain separate vertical controls',
		second.getBounds().y > first.getBounds().y + 20,
	)
	check('custom hook sees field ownership', readings.inner.inField && !readings.outer.inField)
	check('owned hook inherits the control ID', readings.inner.props.id === 'owned-control')
	check('outside hook preserves its explicit ID', readings.outer.props.id === 'outside-control')
	check(
		'owned hook exposes field and label links',
		readings.inner.props.fieldLabel === 'Custom control' &&
			readings.inner.props.ariaLabelledBy === 'owner-label',
	)
	check(
		'owned hook links help and status without repeating web text',
		readings.inner.props.ariaDescribedBy === 'owner-description owner-status' &&
			readings.inner.props.ariaDescription === 'Local tip',
	)
	check(
		'owned hook composes native help once',
		readings.inner.props.accessibilityHint === 'Local tip. Shared help. Fix value',
	)
	check(
		'outside hook names and describes its own control',
		readings.outer.props.ariaLabel === 'Outside' &&
			readings.outer.props.ariaDescription === 'Own help' &&
			readings.outer.props.ariaDescribedBy === undefined,
	)
	check(
		'field flags win over false child defaults',
		readings.inner.props.isReadOnly === true &&
			readings.inner.props.isLoading === true &&
			readings.inner.props.isDisabled === false,
	)
	check(
		'form default required reaches owned and outside hook readers',
		readings.inner.props.isRequired === true && readings.outer.props.isRequired === true,
	)
	check(
		'size defaults distinguish field and provider ownership',
		readings.inner.props.size === 'lg' && readings.outer.props.size === 'sm',
	)
	first.focus()
	await pause()
	const delegate = window.get_focus()
	first.get_buffer().insert_text(first.get_text_length(), '!', -1)
	await pause()
	check(
		'native edit reaches the member callback once',
		first.text === 'Main!' && changes.length === 1 && changes[0] === 'Main!',
	)
	await render({
		groupLabel: 'Billing address',
		width: 280,
		disabled: true,
		optional: true,
		override: 'Local name',
		ownSize: 'md',
	})
	check(
		'group name and width update on the same native widget',
		node('address-group').view === group &&
			labelIs(group, 'Billing address') &&
			Math.abs(group.getBounds().width - 280) <= 2,
	)
	check(
		'group updates retain both editors and local text',
		memberRefs[0]!.native === first && memberRefs[1]!.native === second && first.text === 'Main!',
	)
	check('unrelated hook defaults retain exact member focus', window.get_focus() === delegate)
	check(
		'disabled context reaches custom and outside readers',
		readings.inner.props.isDisabled === true && readings.outer.props.isDisabled === true,
	)
	check(
		'disabled reason is appended once',
		readings.inner.props.accessibilityHint === 'Local tip. Shared help. Fix value. Locked',
	)
	check(
		'explicit optional overrides required default',
		readings.inner.props.isRequired === false &&
			readings.inner.props.isOptional === true &&
			readings.outer.props.isRequired === true,
	)
	check('explicit size overrides the field default', readings.inner.props.size === 'md')
	check(
		'own accessible name replaces the label link',
		readings.inner.props.ariaLabel === 'Local name' &&
			readings.inner.props.ariaLabelledBy === undefined,
	)
	await render({
		groupLabel: undefined,
		disabled: false,
		optional: false,
		requiredDefault: false,
		override: undefined,
		ownSize: undefined,
	})
	check('removing group label clears stale native name', !labelIs(group, 'Billing address'))
	print(
		'GTK_FIELD_GROUP_REMOVAL ' +
			JSON.stringify({
				sameEditor: memberRefs[0]!.native === first,
				text: first.text,
				sameFocus: window.get_focus() === delegate,
			}),
	)
	check(
		'removing group label retains editors, text and focus',
		memberRefs[0]!.native === first && first.text === 'Main!' && window.get_focus() === delegate,
	)
	check(
		'removing required default clears both readers',
		readings.inner.props.isRequired === false && readings.outer.props.isRequired === false,
	)
	check(
		'removing explicit overrides restores field defaults',
		readings.inner.props.size === 'lg' && readings.inner.props.ariaLabelledBy === 'owner-label',
	)
	check(
		'removing disabled state clears its reason',
		readings.inner.props.isDisabled === false &&
			readings.inner.props.accessibilityHint === 'Local tip. Shared help. Fix value',
	)
	check('all updates complete without effect errors', errors.length === 0)
	root.unmount()
	check(
		'unmount clears both control handles',
		memberRefs.every((h) => h == null),
	)
	check(
		'unmount retires the group node and clears the host',
		groupNode.destroyed && host.get_first_child() == null,
	)
	first.get_buffer().insert_text(first.get_text_length(), '?', -1)
	await pause()
	check('retired editors no longer dispatch member changes', changes.length === 1)
	window.destroy()
	print(
		'GTK_FIELD_GROUP ' +
			JSON.stringify({
				checks,
				gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
			}),
	)
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	console.error(error)
	try {
		root.unmount()
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) (globalThis as any).imports.system.exit(1)
