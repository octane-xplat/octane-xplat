import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Scrollable, scrollRefs } from './ui-scroll.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK scroll test',
	default_width: 300,
	default_height: 180,
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
let osWheel = false
const check = (label: string, ok: boolean) => {
	if (!ok) throw new Error(label)
	checks++
}
const props = { axis: 'both' as const, width: 600, height: 400 }
async function run() {
	root.render(Scrollable, props)
	window.present()
	await pause(250)
	const view = scrollRefs.viewport
	check(
		'headless refs bind real viewport and content',
		view instanceof Gtk.ScrolledWindow && scrollRefs.content instanceof Gtk.Widget,
	)
	check(
		'adjustments expose browser-shaped dimensions',
		view.scrollWidth === 600 &&
			view.scrollHeight === 400 &&
			view.clientWidth > 0 &&
			view.clientWidth <= 200 &&
			view.clientHeight > 0 &&
			view.clientHeight <= 100,
	)
	check(
		'hook observes overflow on both axes',
		scrollRefs.state.inline.isScrollable &&
			scrollRefs.state.block.isScrollable &&
			scrollRefs.state.inline.atStart &&
			!scrollRefs.state.inline.atEnd &&
			scrollRefs.state.block.atStart &&
			!scrollRefs.state.block.atEnd,
	)
	let calls = 0
	let event: any
	const listener = (value: any) => {
		calls++
		event = value
	}
	view.on('scroll', listener)
	view.scrollLeft = 30
	view.scrollTop = 40
	await pause()
	check(
		'offset writes move native adjustments',
		view.get_hadjustment().get_value() === 30 && view.get_vadjustment().get_value() === 40,
	)
	check(
		'scroll subscriptions report the actual widget and offsets',
		calls >= 2 && event.object === view && event.scrollX === 30 && event.scrollY === 40,
	)
	check(
		'hook updates interior edge flags',
		!scrollRefs.state.inline.atStart &&
			!scrollRefs.state.inline.atEnd &&
			!scrollRefs.state.block.atStart &&
			!scrollRefs.state.block.atEnd,
	)
	view.off('scroll', listener)
	const stopped = calls
	view.scrollToVerticalOffset(1e6, false)
	view.scrollToHorizontalOffset(1e6, false)
	await pause()
	check(
		'offset methods clamp to each native range',
		view.scrollTop === view.scrollHeight - view.clientHeight &&
			view.scrollLeft === view.scrollWidth - view.clientWidth,
	)
	check(
		'removing one listener preserves the hook subscription',
		calls === stopped && scrollRefs.state.inline.atEnd && scrollRefs.state.block.atEnd,
	)
	view.scrollToVerticalOffset(-100)
	view.scrollToHorizontalOffset(-100)
	await pause()
	check('negative offsets clamp to the start', view.scrollTop === 0 && view.scrollLeft === 0)
	view.scrollToVerticalOffset(200, true)
	await pause(40)
	check(
		'animated offset samples an intermediate position',
		view.scrollTop > 0 && view.scrollTop < 200,
	)
	await pause(300)
	check('animated offset reaches its target', view.scrollTop === 200)
	view.scrollToVerticalOffset(250, true)
	view.scrollToVerticalOffset(0, false)
	await pause(300)
	check('an immediate write replaces pending animation', view.scrollTop === 0)
	view.scrollToVerticalOffset(200, true)
	await pause(30)
	view.get_vadjustment().set_value(11)
	await pause(300)
	check('external native movement cancels programmatic animation', view.scrollTop === 11)
	view.scrollToVerticalOffset(NaN, true)
	await pause()
	check('nonfinite offsets leave native state intact', view.scrollTop === 11)
	root.render(Scrollable, { ...props, hidden: true })
	await pause()
	check(
		'hidden indicators retain scrolling without growing the viewport',
		view.hscrollbar_policy === Gtk.PolicyType.EXTERNAL &&
			view.vscrollbar_policy === Gtk.PolicyType.EXTERNAL &&
			view.clientWidth <= 200 &&
			view.clientHeight <= 100 &&
			view.scrollHeight > view.clientHeight,
	)
	root.render(Scrollable, { ...props, axis: 'block', width: 200 })
	await pause()
	check(
		'axis and indicator changes compose without replacing the viewport',
		scrollRefs.viewport === view &&
			view.hscrollbar_policy === Gtk.PolicyType.NEVER &&
			view.vscrollbar_policy === Gtk.PolicyType.AUTOMATIC &&
			!scrollRefs.state.inline.isScrollable &&
			scrollRefs.state.block.isScrollable,
	)
	let layouts = 0
	const layout = () => layouts++
	view.on('layoutChanged', layout)
	root.render(Scrollable, { ...props, axis: 'block', width: 200, height: 60 })
	await pause()
	check(
		'content resizing updates overflow even when viewport bounds stay fixed',
		view.clientHeight === 100 &&
			!scrollRefs.state.block.isScrollable &&
			scrollRefs.state.block.atStart &&
			scrollRefs.state.block.atEnd &&
			layouts > 0,
	)
	view.off('layoutChanged', layout)
	root.render(Scrollable, { ...props, axis: 'inline', height: 60 })
	await pause()
	check(
		'inline-only viewport keeps the block axis inactive',
		view.hscrollbar_policy === Gtk.PolicyType.AUTOMATIC &&
			view.vscrollbar_policy === Gtk.PolicyType.NEVER &&
			scrollRefs.state.inline.isScrollable &&
			!scrollRefs.state.block.isScrollable,
	)
	root.render(Scrollable, { ...props, axis: 'block', width: 200 })
	await pause()
	view.scrollTop = 0
	await pause()
	if (GLib.getenv('GTK_TEST_WHEEL') === '1') {
		await new Promise<void>((resolve, reject) => {
			const timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 6000, () => {
				reject(new Error('OS wheel timeout'))
				return false
			})
			const wheel = () => {
				if (view.scrollTop <= 0) return
				view.off('scroll', wheel)
				GLib.source_remove(timeout)
				resolve()
			}
			view.on('scroll', wheel)
			print('GTK_UI_SCROLL_READY')
		})
		osWheel = true
		check('actual X11 wheel input scrolls the GTK viewport', view.scrollTop > 0)
	}
	view.scrollToVerticalOffset(200, true)
	root.unmount()
	await pause(350)
	check(
		'unmount disconnects refs and clears native scroll work',
		scrollRefs.viewport === null &&
			scrollRefs.content === null &&
			container.nodes.size === 0 &&
			view.scrollTop === 0 &&
			view.scrollHeight === 0,
	)
	view.scrollToVerticalOffset(200, true)
	await pause(300)
	check(
		'stale scroll handles cannot revive disposed widgets',
		view.scrollTop === 0 && container.nodes.size === 0,
	)
	window.destroy()
	print(
		'GTK_UI_SCROLL ' +
			JSON.stringify({
				checks,
				osWheel,
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
