import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './ui-text-area.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { TextAreaHarness, areaRef } from './ui-text-area.gtk'
Gtk.init()
const window = new Gtk.Window({ default_width: 340, default_height: 900 })
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
	view.add_css_class('pending-font-refit')
	root.unmount()
	check('font observers detach when the editor retires', editorNode.fontObservers?.size === 0)
	check('native handle clears on disposal', areaRef.current === null)
	await pause(40)
	window.destroy()
	print(
		'GTK_TEXT_AREA ' +
			JSON.stringify({
				checks,
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
