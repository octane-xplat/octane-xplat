import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Measurement } from './ui-measure.gtk'
Gtk.init()
const window = new Gtk.Window({ default_width: 300, default_height: 450 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
host.set_halign(Gtk.Align.START)
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 100) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
let latest: any
let reports = 0
const check = (label: string, ok: boolean) => {
	if (!ok) throw new Error(label)
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const report = (b: any) => {
	latest = b
	reports++
}
async function run() {
	root.render(Measurement, { width: 200, report })
	window.present()
	await pause(250)
	const target = node('measured').view!
	check('refs preserve Gtk identity', target instanceof Gtk.Widget)
	check(
		'allocated size is exposed',
		target.getActualSize().width === 80 && target.getActualSize().height === 30,
	)
	check('hook observes allocated bounds', latest?.width === 80 && latest?.height === 30)
	check(
		'ratio derives actual height: ' +
			JSON.stringify({
				width: node('ratio').view!.get_width(),
				height: node('ratio').view!.get_height(),
				style: node('ratio').computedStyle,
				bounds: node('ratio').view!.getBounds(),
			}),
		Math.abs(node('ratio').view!.get_height() - 100) < 1,
	)
	const stable = reports
	await pause()
	check('unchanged frames do not rerender the hook', reports === stable)
	const before = latest.y
	const scroll = node('measure-scroll').view! as any
	scroll.get_vadjustment().set_value(40)
	await pause()
	check('ancestor scrolling updates app-space position', Math.abs(latest.y - before + 40) < 1)
	root.render(Measurement, { width: 160, report })
	await pause()
	check('ratio follows parent resize', Math.abs(node('ratio').view!.get_height() - 80) < 1)
	let calls = 0
	const listener = () => calls++
	target.on('layoutChanged', listener)
	scroll.get_vadjustment().set_value(50)
	await pause()
	check('imperative layout subscription receives frame', calls > 0)
	target.off('layoutChanged', listener)
	const stopped = calls
	scroll.get_vadjustment().set_value(60)
	await pause()
	check(
		'off releases only its own subscription',
		calls === stopped && Math.abs(latest.y - before + 80) < 1,
	)
	root.render(Measurement, { width: 160, alternate: true, report })
	await pause()
	check('ref replacement binds new bounds', latest?.width === 70 && latest?.height === 40)
	check('destroyed ref has no connected bounds', target.getBounds() === null)
	root.render(Measurement, { width: 160, alternate: true, observe: false, report })
	await pause()
	const snapshot = latest.y
	scroll.get_vadjustment().set_value(100)
	await pause()
	check('observe false keeps the initial snapshot', latest.y === snapshot)
	root.unmount()
	const settled = reports
	await pause()
	check('unmount releases hook subscriptions', reports === settled)
	window.destroy()
	print(
		'GTK_UI_MEASURE ' +
			JSON.stringify({
				checks,
				gtk: `${Gtk.MAJOR_VERSION}.${Gtk.MINOR_VERSION}.${Gtk.MICRO_VERSION}`,
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
	})
	.finally(() => loop.quit())
loop.run()
if (failure) throw failure
