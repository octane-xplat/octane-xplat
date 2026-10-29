import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'
Gtk.init()
const window = new Gtk.Window({ default_width: 340, default_height: 360 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const container = createGtkContainer(host)
const command = (op: string, id: number, extra: Record<string, unknown> = {}) =>
	({ op, id, ...extra }) as UniversalHostCommand
const apply = (commands: UniversalHostCommand[]) =>
	gtkDriver
		.prepareBatch(
			container,
			{ renderer: 'gtk', version: 1, commands },
			{
				invokeLocalCallback() {
					throw new Error('Raw GTK fixture has no local callback owners')
				},
			},
		)
		.apply()
const node = (id: number) => container.nodes.get(id)!
const view = (id: number) => node(id).view!
const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 180, () => {
			resolve()
			return false
		}),
	)
const loop = GLib.MainLoop.new(null, false)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) {
		throw new Error(name)
	}
	checks++
}
const groupProps = (display = 'flex') => ({
	style: { display, width: 200, height: 80, flexDirection: 'column' },
})
const leafProps = (extra: Record<string, unknown> = {}, style: Record<string, unknown> = {}) => ({
	text: 'Leaf',
	...extra,
	style: { width: 160, height: 30, ...style },
})
const update = async (id: number, props: Record<string, unknown>) => {
	apply([command('update', id, { props })])
	await pause()
}
async function run() {
	apply([
		command('create', 1, {
			type: 'masonview',
			props: {
				style: { display: 'flex', flexDirection: 'column', width: 300, height: 300, gap: 8 },
			},
		}),
		command('insert', 1, { parent: null, before: null }),
		command('create', 2, { type: 'masonview', props: groupProps() }),
		command('insert', 2, { parent: 1, before: null }),
		command('create', 3, {
			type: 'textfield',
			props: { text: 'Seed', style: { width: 160, height: 30 } },
		}),
		command('insert', 3, { parent: 2, before: null }),
		command('create', 4, { type: 'label', props: { text: 'Retained label' } }),
		command('insert', 4, { parent: 2, before: null }),
		command('create', 5, { type: 'masonview', props: { style: { width: 200, height: 20 } } }),
		command('insert', 5, { parent: 1, before: null }),
		command('create', 6, { type: 'textfield', props: leafProps() }),
		command('insert', 6, { parent: 1, before: null }),
		command('create', 7, {
			type: 'textview',
			props: { text: 'Multiline', style: { width: 200, height: 40 } },
		}),
		command('insert', 7, { parent: 1, before: null }),
	])
	window.present()
	await pause()
	const group = view(2),
		editor = view(3),
		label = view(4),
		leaf = view(6),
		multiline = view(7)
	const siblingY = view(5).getBounds().y
	const initialMultilineY = multiline.getBounds().y
	check(
		'initial subtree is mapped',
		group.get_mapped() && editor.get_mapped() && label.get_mapped(),
	)
	editor.text = 'Local edit'
	editor.focus()
	await pause()
	await update(2, groupProps('none'))
	check('display none hides the native container', !group.get_visible() && !group.get_mapped())
	check('display none unmaps retained descendants', !editor.get_mapped() && !label.get_mapped())
	check('display none removes layout contribution', view(5).getBounds().y < siblingY - 60)
	check(
		'hidden editor retains its native identity and value',
		view(3) === editor && editor.text === 'Local edit',
	)
	const focus = window.get_focus()
	check(
		'hidden subtree cannot keep native focus',
		!focus || !(focus === group || focus.is_ancestor(group)),
	)
	await update(2, groupProps())
	check(
		'display removal remaps the same descendants',
		view(2) === group && editor.get_mapped() && label.get_mapped(),
	)
	check(
		'display removal restores layout contribution',
		Math.abs(view(5).getBounds().y - siblingY) <= 1,
	)
	check('display removal keeps local text', editor.text === 'Local edit')
	await update(6, leafProps({ visible: true }, { display: 'none' }))
	check(
		'display none wins over visible true in the same bag',
		!leaf.get_visible() && !leaf.get_mapped(),
	)
	await update(6, leafProps({ visible: false }))
	check('display removal respects visible false', !leaf.get_visible())
	await update(6, leafProps())
	check('dropping visible restores the default', leaf.get_visible() && leaf.get_mapped())
	check(
		'restoring visible restores layout participation',
		Math.abs(multiline.getBounds().y - initialMultilineY) <= 1,
	)
	const multilineY = multiline.getBounds().y
	await update(6, leafProps({ visibility: 'hidden' }))
	check(
		'hidden retains native visibility but suppresses the child',
		leaf.get_visible() && !leaf.get_child_visible(),
	)
	check('hidden preserves layout space', Math.abs(multiline.getBounds().y - multilineY) <= 1)
	await update(6, leafProps({ visibility: 'hidden' }, { visibility: 'collapse' }))
	check('style collapse removes the native widget', !leaf.get_visible() && !leaf.get_mapped())

	check('collapse removes layout space', multiline.getBounds().y < multilineY - 20)
	await update(6, leafProps({ visibility: 'hidden' }))
	check(
		'style removal restores the direct hidden prop',
		leaf.get_visible() && !leaf.get_child_visible(),
	)
	check(
		'restored hidden prop retains layout space',
		Math.abs(multiline.getBounds().y - multilineY) <= 1,
	)
	await update(6, leafProps({ visibility: 'collapse' }, { visibility: 'hidden' }))
	check(
		'style hidden overrides a direct collapse in native visibility and flow',
		leaf.get_visible() &&
			!leaf.get_child_visible() &&
			Math.abs(multiline.getBounds().y - multilineY) <= 1,
	)
	await update(6, leafProps())
	check(
		'dropping visibility remaps the leaf',
		leaf.get_visible() && leaf.get_child_visible() && leaf.get_mapped(),
	)
	await update(7, { text: 'Multiline', style: { display: 'none', width: 200, height: 40 } })
	check('display none hides the private multiline host', !multiline.get_mapped())
	await update(7, { text: 'Multiline', style: { width: 200, height: 40 } })
	check(
		'multiline host removal restores the same editor',
		view(7) === multiline && multiline.get_mapped() && multiline.text === 'Multiline',
	)
	apply([
		command('create', 8, {
			type: 'label',
			props: { text: 'Initially hidden', visible: true, style: { display: 'none' } },
		}),
		command('insert', 8, { parent: 1, before: null }),
	])
	await pause()
	check(
		'initial hidden style wins over a later visible prop',
		!view(8).get_visible() && !view(8).get_mapped(),
	)
	apply([8, 7, 6, 5, 4, 3, 2, 1].map((id) => command('destroy', id)))
	check(
		'destroy clears native hosts and node records',
		host.get_first_child() == null && container.nodes.size === 0,
	)
	window.destroy()
	print(
		'GTK_VISIBILITY ' +
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
		apply([...container.nodes.keys()].reverse().map((id) => command('destroy', id)))
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
