import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Area, areaRef, refreshEvents } from './ui-area.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK area test',
	default_width: 300,
	default_height: 360,
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
const pause = (ms = 100) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
let osPull = false
const check = (label: string, ok: boolean) => {
	if (!ok) {
		throw new Error(label)
	}
	checks++
}
const node = (id: string, type?: string) =>
	[...container.nodes.values()].find((n) => n.props.id === id && (!type || n.type === type))!
const spinner = (id: string) => node(id, 'activityindicator')
const scroll = () => areaRef.current!.native as any
const indicator = () =>
	[...container.nodes.values()].find((n) => n.cssBaseClasses.has('vx-refresh'))!
const dragFor = (view: any) => {
	const controllers = view.observe_controllers()
	for (let i = 0; i < controllers.get_n_items(); i++) {
		const controller = controllers.get_item(i)
		if (controller instanceof Gtk.GestureDrag && controller.get_name?.() === 'octane-pan') {
			return controller
		}
	}
	throw new Error('Missing imperative pan controller')
}
async function run() {
	root.render(Area, { axis: 'block' })
	window.present()
	await pause(250)
	const handle = areaRef.current!
	const native = scroll()
	check(
		'portable handle exposes the real GTK viewport',
		native instanceof Gtk.ScrolledWindow && typeof handle.scrollToOffset === 'function',
	)
	check(
		'core area respects width and height props',
		native.get_width() === 200 && native.get_height() === 120,
	)
	check(
		'content padding reaches native allocation',
		Math.abs(node('area-document').view!.getBounds().x - native.getBounds().x - 8) < 1 &&
			native.scrollHeight >= 416,
	)
	check(
		'GTK stores the accessible label without replacing the automation id: ' +
			JSON.stringify({
				label: Gtk.test_accessible_has_property(native, Gtk.AccessibleProperty.LABEL),
				name: native.get_name(),
			}),
		Gtk.test_accessible_has_property(native, Gtk.AccessibleProperty.LABEL) &&
			native.get_name() === 'area',
	)
	root.render(Area, { axis: 'block', testID: 'native-feed' })
	await pause()
	check(
		'explicit test id takes precedence over the style id',
		native.get_name() === 'native-feed' && node('area', 'scrollview').cssId === 'area',
	)
	root.render(Area, { axis: 'block' })
	await pause()
	check('dropping test id restores the component id', native.get_name() === 'area')
	handle.scrollToOffset({ block: 50 })
	await pause()
	check('block handle moves content', native.scrollTop === 50)
	check(
		'Spinner uses the real busy GTK widget and declared size',
		spinner('plain-spinner').view!.get_spinning() &&
			spinner('plain-spinner').view!.getActualSize().width === 20,
	)
	check(
		'labeled Spinner forwards named size and label',
		spinner('labeled-spinner').view!.get_spinning() &&
			spinner('labeled-spinner').view!.getActualSize().width === 16 &&
			[...container.nodes.values()].some(
				(n) => n.type === 'label' && n.view!.get_label() === 'Loading',
			),
	)
	root.render(Area, { axis: 'both' })
	await pause()
	const inner = [...container.nodes.values()].find(
		(n) => n.type === 'scrollview' && n.view !== native,
	)!.view!
	check(
		'both axes preserve the outer portable handle',
		areaRef.current === handle && scroll() === native && inner instanceof Gtk.ScrolledWindow,
	)
	handle.scrollToOffset({ inline: 70, block: 60 })
	await pause()
	check(
		'both-axis handle targets its two viewports',
		native.scrollTop === 60 && inner.scrollLeft === 70,
	)
	handle.scrollToOffset({ block: 80 })
	await pause()
	check('omitted axes keep their position', native.scrollTop === 80 && inner.scrollLeft === 70)
	handle.scrollToOffset({ inline: 100, block: 100 }, { animated: true })
	await pause(350)
	check(
		'both-axis handle honors animated offsets',
		native.scrollTop === 100 && inner.scrollLeft === 100,
	)
	handle.scrollToOffset({ inline: -1, block: -1 })
	await pause()
	check('portable handle clamps negative offsets', native.scrollTop === 0 && inner.scrollLeft === 0)
	root.render(Area, { axis: 'inline' })
	await pause()
	handle.scrollToOffset({ inline: 60 })
	await pause()
	check(
		'inline axis drops the old nested target',
		scroll() === native &&
			native.scrollLeft === 60 &&
			[...container.nodes.values()].filter((n) => n.type === 'scrollview').length === 1,
	)
	root.render(Area, { axis: 'block', refresh: true, refreshing: false })
	await pause(250)
	const refreshing = scroll()
	const strip = indicator().view!
	const wrapper = node('area', 'scrollview').parent!.view!
	const geometry = {
		wrapper: wrapper.getBounds(),
		viewport: refreshing.getBounds(),
		indicator: strip.getBounds(),
		translation: strip.translateY,
	}
	check(
		'refresh wrapper preserves dimensions and hidden overlay: ' + JSON.stringify(geometry),
		wrapper.get_width() === 200 &&
			wrapper.get_height() === 120 &&
			refreshing.get_height() === 120 &&
			strip.get_height() === 64 &&
			strip.translateY === -64 &&
			Math.abs(strip.getBounds().y - wrapper.getBounds().y + 64) < 1,
	)
	check(
		'refresh overlay uses native GTK clipping',
		wrapper.get_overflow() === Gtk.Overflow.HIDDEN && wrapper.pick(10, -10, 0) === null,
	)
	const drag = dragFor(refreshing)
	drag.emit('drag-begin', 0, 0)
	drag.emit('drag-update', 0, 80)
	await pause()
	check(
		'pull reveal is damped through backed GTK transforms',
		refreshing.translateY === 40 && strip.translateY === -24,
	)
	drag.emit('drag-end', 0, 80)
	await pause(230)
	check(
		'sub-threshold release collapses without refreshing',
		refreshEvents.length === 0 && refreshing.translateY === 0 && strip.translateY === -64,
	)
	drag.emit('drag-begin', 0, 0)
	drag.emit('drag-update', 0, 180)
	drag.emit('cancel', null)
	drag.emit('drag-end', 0, 180)
	await pause(230)
	check('cancelled pulls never refresh', refreshEvents.length === 0 && refreshing.translateY === 0)
	root.render(Area, { axis: 'block', refresh: true, refreshing: false, version: 2 })
	await pause()
	check('callback updates keep one imperative gesture controller', dragFor(scroll()) === drag)
	drag.emit('drag-begin', 0, 0)
	drag.emit('drag-update', 0, 160)
	drag.emit('drag-end', 0, 160)
	await pause(210)
	check(
		'threshold release invokes the latest callback once and docks',
		refreshEvents.join() === '2' && scroll().translateY === 64 && strip.translateY === 0,
	)
	root.render(Area, { axis: 'block', refresh: true, refreshing: true, version: 2 })
	await pause(450)
	check('controlled refreshing keeps the dock after grace', scroll().translateY === 64)
	drag.emit('drag-begin', 0, 0)
	drag.emit('drag-end', 0, 0)
	await pause(220)
	check('resting release while held does not refresh again', refreshEvents.length === 1)
	root.render(Area, { axis: 'block', refresh: true, refreshing: false, version: 2 })
	await pause(230)
	check(
		'refreshing false collapses the dock',
		scroll().translateY === 0 && strip.translateY === -64,
	)
	areaRef.current!.scrollToOffset({ block: 50 })
	await pause()
	drag.emit('drag-begin', 0, 0)
	drag.emit('drag-update', 0, 200)
	drag.emit('drag-end', 0, 200)
	await pause(220)
	check(
		'pulls below the top edge do not refresh',
		refreshEvents.length === 1 && scroll().translateY === 0,
	)
	areaRef.current!.scrollToOffset({ block: 0 })
	await pause()
	if (GLib.getenv('GTK_TEST_PULL') === '1') {
		const before = refreshEvents.length
		await new Promise<void>((resolve, reject) => {
			const start = Date.now()
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
				if (refreshEvents.length > before) {
					resolve()
					return false
				}
				if (Date.now() - start > 6500) {
					reject(new Error('OS pull timeout'))
					return false
				}
				return true
			})
			print('GTK_UI_AREA_READY')
		})
		await pause(100)
		osPull = true
		check('actual X11 drag refreshes once through GTK picking', refreshEvents.length === before + 1)
	}
	root.render(Area, { axis: 'block', refresh: true, refreshing: true, hideSpinner: true })
	await pause(230)
	check(
		'busy false unmounts public Spinner variants',
		!spinner('plain-spinner') && !spinner('labeled-spinner'),
	)
	root.render(Area, { axis: 'block', refresh: true, refreshing: true })
	await pause()
	check(
		'busy true remounts an active native Spinner',
		spinner('plain-spinner').view!.get_spinning(),
	)
	const stale = areaRef.current!
	root.unmount()
	await pause(400)
	check(
		'unmount clears portable handles and widgets',
		areaRef.current === null && container.nodes.size === 0,
	)
	stale.scrollToOffset({ block: 200 }, { animated: true })
	await pause()
	check('stale portable handles stay inert', container.nodes.size === 0)
	window.destroy()
	print(
		'GTK_UI_AREA ' +
			JSON.stringify({
				checks,
				osPull,
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
