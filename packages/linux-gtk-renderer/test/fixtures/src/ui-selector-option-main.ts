import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { SelectorOptionScene } from './ui-selector-option.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK selector option test',
	default_width: 360,
	default_height: 280,
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
const failures: string[] = []
const check = (name: string, ok: boolean) => {
	checks++
	if (!ok) {
		failures.push(name)
	}
}
const nodes = (name: string) => [...container.nodes.values()].filter((n) => n.cssClasses?.has(name))
const part = () => nodes('vx-selectoroption')[0]
const text = () => nodes('vx-selectoroption-text')[0]
const label = () => nodes('vx-selectoroption-label')[0]
const description = () => nodes('vx-selectoroption-description')[0]
const icon = () => nodes('vx-selectoroption-icon')[0]
const close = (actual: number | undefined, expected: number) =>
	Math.abs((actual ?? NaN) - expected) <= 2
let props: Parameters<typeof SelectorOptionScene>[0] = {
	id: 'selector-part',
	label: 'Small',
	description: 'Fits a day bag',
	showIcon: true,
	className: 'selector-authored',
	style: { width: 280, height: 80, margin: 8 },
}
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(SelectorOptionScene, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause(260)
	const native = (globalThis as any).imports.gi.XplatMason
	const original = {
		part: part().view,
		text: text().view,
		label: label().view,
		description: description().view,
		icon: icon().view,
	}
	check('one option part', nodes('vx-selectoroption').length === 1)
	check('one label', nodes('vx-selectoroption-label').length === 1)
	check('one description', nodes('vx-selectoroption-description').length === 1)
	check('one icon lane', nodes('vx-selectoroption-icon').length === 1)
	check('label text', (label().view as any).get_text() === 'Small')
	check('description text', (description().view as any).get_text() === 'Fits a day bag')
	check('icon content', (nodes('selector-part-glyph')[0].view as any).get_text() === '+')
	check('authored class', part().cssClasses?.has('selector-authored') === true)
	check(
		'authored id appears once',
		[...container.nodes.values()].filter((n) => n.props.id === 'selector-part').length === 1,
	)
	check('explicit width', close(part().view?.getBounds().width, 280))
	check('explicit height', close(part().view?.getBounds().height, 80))
	check(
		'outer margin',
		close(part().view?.getBounds().x, 8) && close(part().view?.getBounds().y, 8),
	)
	check('icon and text are horizontal', icon().view!.getBounds().x < text().view!.getBounds().x)
	check(
		'icon lane gap',
		text().view!.getBounds().x - (icon().view!.getBounds().x + icon().view!.getBounds().width) >= 7,
	)
	check(
		'label precedes description',
		label().view!.getBounds().y < description().view!.getBounds().y,
	)
	check(
		'text remains inside option width',
		text().view!.getBounds().x + text().view!.getBounds().width <=
			part().view!.getBounds().x + part().view!.getBounds().width + 1,
	)
	check(
		'description uses smaller type',
		(description().view as any).get_pango_context().get_font_description().get_size() <
			(label().view as any).get_pango_context().get_font_description().get_size(),
	)
	check(
		'decorative icon lane is hidden to accessibility',
		native.test_accessible_state(icon().view, Gtk.AccessibleState.HIDDEN, 1) === null,
	)
	check('presentation part is not a focus stop', !part().view!.get_focusable())
	await render({
		label: 'Large ✓',
		description: 'Fits two day bags',
		iconText: 'L',
		isDisabled: true,
		className: 'selector-updated',
	})
	check('root retained on updates', part().view === original.part)
	check('text column retained on updates', text().view === original.text)
	check('label retained on updates', label().view === original.label)
	check('description retained on updates', description().view === original.description)
	check('icon lane retained on updates', icon().view === original.icon)
	check('label updates Unicode text', (label().view as any).get_text() === 'Large ✓')
	check('description updates text', (description().view as any).get_text() === 'Fits two day bags')
	check('icon content updates', (nodes('selector-part-glyph')[0].view as any).get_text() === 'L')
	check(
		'authored class is replaced',
		!part().cssClasses?.has('selector-authored') &&
			part().cssClasses?.has('selector-updated') === true,
	)
	check(
		'disabled part class matches web',
		part().cssClasses?.has('vx-selectoroption--disabled') === true,
	)
	await render({ label: undefined, description: undefined, showIcon: false })
	check('missing label removed', nodes('vx-selectoroption-label').length === 0)
	check('missing description removed', nodes('vx-selectoroption-description').length === 0)
	check('missing icon lane removed', nodes('vx-selectoroption-icon').length === 0)
	check('missing icon content removed', nodes('selector-part-glyph').length === 0)
	check(
		'empty text column remains',
		nodes('vx-selectoroption-text').length === 1 && text().view?.get_parent() === part().view,
	)
	check('empty part retains root', part().view === original.part)
	await render({
		label: '',
		description: '',
		showIcon: true,
		isDisabled: false,
		className: undefined,
		id: undefined,
		style: { width: '50%', height: 64 },
	})
	check(
		'empty strings still render both text leaves',
		nodes('vx-selectoroption-label').length === 1 &&
			nodes('vx-selectoroption-description').length === 1,
	)
	check('empty label stays empty', (label().view as any).get_text() === '')
	check('icon lane can be restored', nodes('vx-selectoroption-icon').length === 1)
	check(
		'restored decorative icon stays hidden after mapping',
		native.test_accessible_state(icon().view, Gtk.AccessibleState.HIDDEN, 1) === null,
	)
	check('disabled class clears', !part().cssClasses?.has('vx-selectoroption--disabled'))
	check('custom class clears', !part().cssClasses?.has('selector-updated'))
	check('authored id clears', !part().props.id)
	check('percentage width uses containing block', close(part().view?.getBounds().width, 160))
	check('height updates', close(part().view?.getBounds().height, 64))
	check(
		'margin clears',
		close(part().view?.getBounds().x, 0) && close(part().view?.getBounds().y, 0),
	)
	await render({
		label: 'Right to left',
		description: 'Details',
		style: { width: 280, height: 80, direction: 'rtl' },
	})
	check('direction propagates to option', part().view!.get_direction() === Gtk.TextDirection.RTL)
	check(
		'direction propagates to children',
		icon().view!.get_direction() === Gtk.TextDirection.RTL &&
			text().view!.get_direction() === Gtk.TextDirection.RTL,
	)
	check('RTL reverses physical lanes', icon().view!.getBounds().x > text().view!.getBounds().x)
	await render({ style: { width: 280, height: 80 } })
	check('direction resets', part().view!.get_direction() === Gtk.TextDirection.LTR)
	check('lane order resets', icon().view!.getBounds().x < text().view!.getBounds().x)
	root.unmount()
	await pause()
	check('unmount releases all nodes', container.nodes.size === 0)
	print(
		'GTK_SELECTOR_OPTION ' +
			JSON.stringify({
				checks,
				failures,
				osInput: false,
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
