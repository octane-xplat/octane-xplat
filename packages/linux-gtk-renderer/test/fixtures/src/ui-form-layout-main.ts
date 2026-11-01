import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { FormScene, formRef, handles } from './ui-form-layout.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK form layout test',
	default_width: 660,
	default_height: 500,
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
const close = (a: number, b: number) => Math.abs(a - b) <= 2
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const bounds = (id: string) => node(id).view!.getBounds()
let props: Parameters<typeof FormScene>[0] = { direction: 'horizontal', count: 2 }
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(FormScene, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause()
	print(
		'GTK_FORM_INITIAL ' +
			JSON.stringify({
				errors: errors.map(String),
				fields: [bounds('field-0'), bounds('field-1')],
			}),
	)
	check('horizontal form has no effect errors', errors.length === 0)
	const a = bounds('field-0'),
		b = bounds('field-1')
	check('horizontal fields occupy different columns', b.x > a.x + 20 && close(a.y, b.y))
	check('horizontal fields have equal widths', close(a.width, b.width))
	check(
		'horizontal fields share the available width with the authored gap',
		close(a.width + b.width + 16, 600),
	)
	const body = [...container.nodes.values()].find((n) => n.cssClasses?.has('vx-field-body'))!
	check('field body preserves spacing between help, editor and status', body.props.style.gap === 4)
	const description = [...container.nodes.values()].find((n) =>
		n.cssClasses?.has('vx-field-description'),
	)!.view!
	const controlShell = node('control-0').parent!.view!
	check(
		'help and editor keep the native four-pixel gap',
		close(
			controlShell.getBounds().y - description.getBounds().y - description.getBounds().height,
			4,
		),
	)
	const originalForm = formRef.current
	const entry = handles[0]!.native as any
	const entryNode = node('control-0')
	entry.focus()
	await pause()
	entry.get_buffer().insert_text(entry.get_text_length(), '!', -1)
	await pause()
	check('uncontrolled edit is committed', entry.text === 'Value 0!')
	const focused = () => window.get_focus() === entry || window.get_focus()?.is_ancestor(entry)
	check('editor is focused before direction change', focused())
	await render({ direction: 'vertical' })
	check('layout direction retains native host', formRef.current === originalForm)
	check(
		'vertical direction retains editor and local text',
		handles[0]!.native === entry && entry.text === 'Value 0!' && !entryNode.destroyed,
	)
	check('vertical direction retains native focus', focused())
	const va = bounds('field-0'),
		vb = bounds('field-1')
	check('vertical fields occupy different rows', vb.y > va.y + 20 && close(va.x, vb.x))
	await render({ direction: 'horizontal-labels' })
	check(
		'horizontal labels retain editor and local text',
		handles[0]!.native === entry && entry.text === 'Value 0!' && !entryNode.destroyed,
	)
	check('horizontal labels retain native focus', focused())
	const field = node('field-0')
	const label = [...container.nodes.values()].find((n) => n.cssClasses?.has('vx-field-label'))!
	check(
		'horizontal-label field uses row geometry',
		field.cssClasses?.has('vx-field--hl') === true &&
			entry.getBounds().x > label.view!.getBounds().x + 10,
	)
	await render({ direction: 'horizontal', count: 3 })
	const fields = [0, 1, 2].map((i) => bounds('field-' + i))
	check(
		'adding a field creates three ordered columns',
		fields[0].x < fields[1].x &&
			fields[1].x < fields[2].x &&
			fields.every((f) => close(f.y, fields[0].y)),
	)
	check(
		'dynamic columns keep equal widths',
		fields.every((f) => close(f.width, fields[0].width)),
	)
	check(
		'new columns preserve the original editor and value',
		handles[0]!.native === entry && entry.text === 'Value 0!',
	)
	await render({ count: 2 })
	check(
		'removing a column restores two equal tracks',
		close(bounds('field-0').width, a.width) && close(bounds('field-1').width, a.width),
	)
	const native = (globalThis as any).imports.gi.XplatMason
	await render({ defaultOptionality: 'required' })
	check(
		'form-wide required default reaches controls',
		native.test_accessible_boolean_property(entry, Gtk.AccessibleProperty.REQUIRED, true) === null,
	)
	const labels = [...container.nodes.values()].filter((n) => n.cssClasses?.has('vx-field-label'))
	check(
		'form-wide required default suppresses restating markers',
		labels.every((n) => !n.view!.get_label().includes('*')),
	)
	await render({ optionalLast: true })
	check(
		'explicit optional overrides form-wide required',
		native.test_accessible_boolean_property(
			handles[1]!.native,
			Gtk.AccessibleProperty.REQUIRED,
			false,
		) === null,
	)
	await render({ defaultOptionality: undefined, optionalLast: false })
	check(
		'removing form default clears required metadata',
		native.test_accessible_boolean_property(entry, Gtk.AccessibleProperty.REQUIRED, false) === null,
	)
	check('all updates remain free of effect errors', errors.length === 0)
	root.unmount()
	check(
		'unmount clears child handles',
		handles.slice(0, 2).every((h) => h == null),
	)
	check('unmount clears the layout ref', formRef.current == null)
	check('retired native host cannot focus', originalForm.focus() === false)
	check('unmount empties the host', host.get_first_child() == null)
	window.destroy()
	print(
		'GTK_FORM_LAYOUT ' +
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
