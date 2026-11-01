import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot, createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import { Measurement } from './ui-measure.gtk'
Gtk.init()
const window = new Gtk.Window({ default_width: 300, default_height: 450 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
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
	if (!ok) {
		throw new Error(label)
	}
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
	const retainedRoot = node('measure-root').view
	root.render(Measurement, { alternate: true, observe: false, report })
	await pause()
	check(
		'clearing root width restores GTK fill without replacing the widget',
		node('measure-root').view === retainedRoot && retainedRoot!.get_width() === 300,
	)
	check('ratio follows restored auto width', node('ratio').view!.get_height() === 150)
	root.unmount()
	const settled = reports
	await pause()
	check('unmount releases hook subscriptions', reports === settled)
	const boundary = createGtkContainer(host)
	const apply = (commands: any[]) =>
		gtkDriver.prepareBatch(boundary, { renderer: 'gtk', commands }).apply()
	apply([
		{ op: 'create', id: 1, type: 'masonview', props: { style: { width: 80, height: 20 } } },
		{
			op: 'create',
			id: 2,
			type: 'masonview',
			props: { style: { width: 200, height: 100, display: 'flex', flexDirection: 'column' } },
		},
		{ op: 'insert', id: 1, parent: null, before: null },
		{ op: 'insert', id: 2, parent: null, before: null },
	])
	await pause()
	const moving = boundary.nodes.get(1)!.view!
	check('direct root respects explicit width', moving.get_width() === 80)
	apply([{ op: 'move', id: 1, parent: 2, before: null }])
	await pause()
	check(
		'moving into Mason releases GTK alignment',
		moving.get_halign() === Gtk.Align.FILL && moving.get_width() === 80,
	)
	apply([{ op: 'move', id: 1, parent: null, before: 2 }])
	await pause()
	check(
		'moving back to GTK restores authored sizing',
		moving.get_halign() === Gtk.Align.START && moving.get_width() === 80,
	)
	apply([{ op: 'update', id: 1, props: { style: { height: 20 } } }])
	await pause()
	check(
		'direct root clearing width restores fill',
		moving.get_halign() === Gtk.Align.FILL && moving.get_width() === 300,
	)
	apply([
		{ op: 'destroy', id: 1 },
		{ op: 'destroy', id: 2 },
	])
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
if (failure) {
	throw failure
}
