import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	GroupScene,
	groupRef,
	prefixRef,
	handles,
	RoleScene,
	roleRef,
	roleHandle,
} from './ui-input-group.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK input group test',
	default_width: 440,
	default_height: 440,
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
	if (!ok) {
		throw new Error(name)
	}
	checks++
}
const byClass = (name: string) =>
	[...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const near = (a: number, b: number) => Math.abs(a - b) <= 2
let props: Parameters<typeof GroupScene>[0] = {
	width: '80%',
	isReadOnly: true,
	isRequired: true,
	isLoading: true,
	size: 'lg',
	status: { type: 'error', message: 'Check amount' },
	statusVariant: 'detached',
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(GroupScene, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause()
	const group = groupRef.current
	const prefix = prefixRef.current
	const first = handles[0]!.native as any
	const second = handles[1]!.native as any
	const native = (globalThis as any).imports.gi.XplatMason
	const boolean = (view: any, property: any, value: boolean) =>
		native.test_accessible_boolean_property(view, property, value) === null
	const state = (view: any, property: any, value: number) =>
		native.test_accessible_state(view, property, value) === null
	const text = (view: any, property: any, value: string) =>
		native.test_accessible_string_property(view, property, value) === null
	print(
		'GTK_GROUP_INITIAL ' +
			JSON.stringify({
				role: group.get_accessible_role(),
				width: node('amount-group').view!.getBounds().width,
				ids: byClass('vx-input').map((n) => n.props.id),
			}),
	)
	check(
		'input group has a native accessible group role',
		group.get_accessible_role() === Gtk.AccessibleRole.GROUP,
	)
	check(
		'input group has its required accessible name',
		text(group, Gtk.AccessibleProperty.LABEL, 'Amount'),
	)
	check(
		'group width applies once to the field owner',
		near(node('amount-group').view!.getBounds().width, 320),
	)
	const geometry = {
		group: group.getBounds(),
		editors: [first.getBounds(), second.getBounds()],
		suffix: node('suffix-action').view!.getBounds(),
		groupBorder: group.get_style_context().get_border().left,
		memberBorders: [first, second].map((view) => view.get_style_context().get_border().left),
	}
	print('GTK_GROUP_GEOMETRY ' + JSON.stringify(geometry))
	check(
		'joined members stay inside the authored group width',
		[...geometry.editors, geometry.suffix].every(
			(b) =>
				b.x >= geometry.group.x - 2 && b.x + b.width <= geometry.group.x + geometry.group.width + 2,
		),
	)
	check(
		'one group border replaces member input borders',
		geometry.groupBorder > 0 && geometry.memberBorders.every((width) => width === 0),
	)
	check(
		'joined editors and suffix do not overlap',
		geometry.editors[0].x + geometry.editors[0].width <= geometry.editors[1].x + 2 &&
			geometry.editors[1].x + geometry.editors[1].width <= geometry.suffix.x + 2,
	)
	const ids = byClass('vx-input')
		.map((n) => n.props.id)
		.filter(Boolean)
	check(
		'anonymous group members do not share a generated control ID',
		new Set(ids).size === ids.length,
	)
	check(
		'group read-only reaches both editors',
		!first.get_editable() && !second.get_editable() && first.get_sensitive(),
	)
	check(
		'group required metadata reaches both editors',
		[first, second].every((v) => boolean(v, Gtk.AccessibleProperty.REQUIRED, true)),
	)
	check(
		'group loading reaches both editors',
		[first, second].every((v) => state(v, Gtk.AccessibleState.BUSY, 1)),
	)
	check('group exposes busy state', state(group, Gtk.AccessibleState.BUSY, 1))
	check('group error exposes invalid state', state(group, Gtk.AccessibleState.INVALID, 1))
	check(
		'group name reaches member controls',
		[first, second].every((v) => text(v, Gtk.AccessibleProperty.LABEL, 'Amount')),
	)
	check(
		'group hint reaches member controls once',
		[first, second].every((v) =>
			text(v, Gtk.AccessibleProperty.DESCRIPTION, 'Before tax. Check amount'),
		),
	)
	check('group size reaches the first editor', byClass('vx-input--size-lg').length === 1)
	check('member size overrides the group', byClass('vx-input--size-sm').length === 1)
	check(
		'prefix string renders as native text',
		node('prefix').view!.get_first_child().get_text() === '$',
	)
	check(
		'group retains detached status presentation',
		byClass('vx-field-status--detached').length === 1,
	)
	await render({
		isReadOnly: false,
		isLoading: false,
		status: undefined,
		isRequired: false,
		width: '50%',
		size: 'md',
	})
	check(
		'prop updates retain both native editors',
		handles[0]!.native === first && handles[1]!.native === second,
	)
	check('removing read-only restores editing', first.get_editable() && second.get_editable())
	check(
		'removing loading clears metadata',
		state(first, Gtk.AccessibleState.BUSY, 0) && state(group, Gtk.AccessibleState.BUSY, 0),
	)
	check('removing required clears metadata', boolean(first, Gtk.AccessibleProperty.REQUIRED, false))
	check(
		'width updates apply to owner once',
		near(node('amount-group').view!.getBounds().width, 200),
	)
	first.get_buffer().insert_text(first.get_text_length(), '!', -1)
	first.focus()
	await pause()
	check('native edit commits before state changes', first.text === '12!')
	await render({ isDisabled: true })
	check(
		'disabled group blocks member editors and suffix actions',
		!first.get_sensitive() &&
			!second.get_sensitive() &&
			!node('suffix-action').view!.is_sensitive(),
	)
	await render({ isDisabled: false })
	check(
		'enabling group retains edits and native editor',
		handles[0]!.native === first && first.text === '12!' && first.get_sensitive(),
	)
	const smallBounds = group.getBounds()
	const smallEditors = [first.getBounds(), second.getBounds()]
	const smallSuffix = node('suffix-action').view!.getBounds()
	print(
		'GTK_GROUP_NARROW ' +
			JSON.stringify({ group: smallBounds, editors: smallEditors, suffix: smallSuffix }),
	)
	check(
		'narrow group editors and suffix do not overlap',
		smallEditors[0].x + smallEditors[0].width <= smallEditors[1].x + 2 &&
			smallEditors[1].x + smallEditors[1].width <= smallSuffix.x + 2,
	)

	check(
		'narrow groups retain contained inputs and actions',
		[first, second, node('suffix-action').view!].every((view) => {
			const b = view.getBounds()
			return b.x >= smallBounds.x - 2 && b.x + b.width <= smallBounds.x + smallBounds.width + 2
		}),
	)
	first.focus()
	await pause()
	const focused = window.get_focus()
	await render({ customPrefix: true })
	check(
		'custom prefix nodes render without replacing the addon host',
		prefixRef.current === prefix && prefix.get_first_child().get_text() === 'USD',
	)
	check(
		'prefix changes retain editor text and exact focus',
		handles[0]!.native === first && first.text === '12!' && window.get_focus() === focused,
	)
	check('group updates retain the same native row', groupRef.current === group)
	await render({ isLabelHidden: true })
	check(
		'hidden group labels remove visual label and help only',
		byClass('vx-field-label').length === 0 &&
			byClass('vx-field-description').length === 0 &&
			text(group, Gtk.AccessibleProperty.LABEL, 'Amount'),
	)
	check('all updates have no effect errors', errors.length === 0)
	root.render(RoleScene, { role: 'group' })
	await pause()
	check(
		'replacing the group disposes its editor and group refs',
		groupRef.current == null && prefixRef.current == null && handles.every((h) => h == null),
	)
	check('retired group cannot focus', group.focus() === false)
	const originalRoleHost = roleRef.current
	const roleEditor = roleHandle.current!.native as any
	roleEditor.focus()
	roleEditor.get_buffer().insert_text(roleEditor.get_text_length(), '!', -1)
	await pause()
	const delegate = window.get_focus()
	check(
		'group role leaves keyboard focus on its editor',
		!originalRoleHost.get_focusable() &&
			(delegate === roleEditor || delegate?.is_ancestor(roleEditor)),
	)
	root.render(RoleScene, { role: 'button' })
	await pause()
	const buttonHost = roleRef.current
	check(
		'changing group to button replaces the role host',
		buttonHost !== originalRoleHost &&
			buttonHost.get_accessible_role() === Gtk.AccessibleRole.BUTTON,
	)
	check(
		'role recreation retains the editor and text',
		roleHandle.current!.native === roleEditor && roleEditor.text === 'Retained!',
	)
	check('role recreation retains the exact focus delegate', window.get_focus() === delegate)
	root.render(RoleScene, { role: 'group' })
	await pause()
	check(
		'changing button back restores a nonfocusable native group',
		roleRef.current !== buttonHost &&
			roleRef.current.get_accessible_role() === Gtk.AccessibleRole.GROUP &&
			!roleRef.current.get_focusable(),
	)
	check(
		'group recreation keeps its editor focus',
		roleHandle.current!.native === roleEditor && window.get_focus() === delegate,
	)
	root.render(RoleScene, { role: undefined })
	await pause()
	check(
		'removing the group role restores the native default',
		roleRef.current.get_accessible_role() !== Gtk.AccessibleRole.GROUP &&
			!roleRef.current.get_focusable(),
	)
	check(
		'role removal retains local text and focus',
		roleEditor.text === 'Retained!' && window.get_focus() === delegate,
	)
	root.unmount()
	check(
		'role fixtures dispose refs and native hosts',
		roleRef.current == null && roleHandle.current == null && host.get_first_child() == null,
	)
	check(
		'retired role hosts cannot focus',
		originalRoleHost.focus() === false && buttonHost.focus() === false,
	)
	window.destroy()
	print(
		'GTK_INPUT_GROUP ' +
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
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
