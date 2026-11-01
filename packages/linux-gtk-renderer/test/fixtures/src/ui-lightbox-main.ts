import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { LightboxProbe } from './ui-lightbox.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const dbg: string[] = []

const window = new Gtk.Window({ title: 'Octane GTK Lightbox test', default_width: 640, default_height: 700, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const findGtkText = (needle: string): any => {
	let found: any = null
	const walk = (w: any) => {
		if (found || !w) { return }
		try {
			const text =
				typeof w.get_label === 'function'
					? w.get_label()
					: typeof w.get_text === 'function'
						? w.get_text()
						: null
			if (typeof text === 'string' && text.includes(needle)) { found = w; return }
		} catch { }
		for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { walk(c) }
	}
	walk(window)
	return found
}
const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const hasText = (id: string, text: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (n?.props?.id === id) {
				const probe = (node: any): boolean => {
					if (!node) { return false }
					if (JSON.stringify(node.props).includes(text)) { return true }
					for (const c of node.children ?? []) { if (probe(c)) { return true } }
					return false
				}
				return probe(n)
			}
		} catch { }
	}
	return false
}
/** First widget whose accessible name matches — the lightbox nav
 *  Pressables expose 'Previous'/'Next'/'Close' via accessibilityLabel.
 *  GTK 4 widgets implement GtkAccessible directly (no get_accessible);
 *  the renderer also mirrors the label into the widget name. */
const findA11y = (name: string): any => {
	let found: any = null
	const walk = (w: any) => {
		if (found || !w) { return }
		try {
			const nm = w.get_accessible_name?.() ?? w.get_name?.() ?? null
			if (nm === name) { found = w; return }
		} catch { }
		for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { walk(c) }
	}
	walk(window)
	return found
}
/** First Gtk.Picture in the window — the lightbox media image. */
const findPicture = (): any => {
	let found: any = null
	const walk = (w: any) => {
		if (found || !w) { return }
		try {
			if (typeof w.get_paintable === 'function') { found = w; return }
		} catch { }
		for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { walk(c) }
	}
	walk(window)
	return found
}
/** Bounds in window coordinates — includes the view's transforms, so the
 *  zoom check sees the scale that compute_bounds(self) would hide. */
const bounds = (w: any): { x: number; y: number; w: number; h: number } | null => {
	const [ok, rect] = w.compute_bounds(window)
	if (!ok) { return null }
	return { x: rect.origin.x, y: rect.origin.y, w: rect.size.width, h: rect.size.height }
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_LIGHTBOX_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})
const sendKey = async (key: string) => {
	await ready({ key })
}
const clickAt = async (widget: any) => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds for widget') }
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2
	let y = rect.origin.y - ty + rect.size.height / 2
	for (let surface = native.get_surface(); typeof surface.get_parent === 'function'; surface = surface.get_parent()) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	await ready({ x: x + wx, y: y + wy })
}
const overlayChildren = () => ((container as any).overlayLayers?.size ?? 0)

async function run() {
	root.render(LightboxProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	check('probe mounts', !!findView('lb-open'))

	// Controlled open → modal stage with media + counter + caption.
	await clickAt(findView('lb-open'))
	await pump(350)
	check('lightbox presents on an overlay layer', !!findGtkText('1 of 3'))
	check('lightbox renders the media image', !!findPicture())
	check('lightbox renders the caption', !!findGtkText('Caption A'))
	const picB = bounds(findPicture()!)
	dbg.push('pic ' + JSON.stringify(picB))
	check('media image has visible bounds', !!picB && picB.w > 0 && picB.h > 0)

	// The panel's own Next control advances the controlled index.
	await clickAt(findA11y('Next'))
	await pump(250)
	check('nav control advances the slide', !!findGtkText('2 of 3'))
	check('onIndexChange reports the move', hasText('picked', 'idx:1'))

	// Real Right/Left arrows on the focused stage navigate.
	await sendKey('Right')
	await pump(250)
	check('Right arrow advances the slide', !!findGtkText('3 of 3'))
	await sendKey('Left')
	await pump(200)
	await sendKey('Left')
	await pump(250)
	check('Left arrow steps back', !!findGtkText('1 of 3'))

	// Escape → onOpenChange(false) → controlled close.
	await sendKey('Escape')
	await pump(300)
	check('Escape dismisses the lightbox', !findGtkText('1 of 3'))
	check('Escape reports via onOpenChange', hasText('picked', 'ctl-closed'))

	// Reopen → real swipe navigates; real double-tap zooms the media.
	await clickAt(findView('lb-open'))
	await pump(300)
	await ready({ drag: { dx: -180, dy: 0 }, x: 320, y: 350 })
	await pump(300)
	check('swipe left advances the slide', !!findGtkText('2 of 3'))
	// Double-tap zoom is bound to the media image — land both presses inside
	// its actual bounds rather than the bare stage around it.
	const pic = findPicture()
	const picBox = pic && bounds(pic)
	const preZoom = picBox
	await ready(
		picBox
			? { dbl: true, x: picBox.x + picBox.w / 2, y: picBox.y + picBox.h / 2 }
			: { dbl: true, x: 320, y: 350 },
	)
	await pump(350)
	const postZoom = bounds(findPicture()!)
	dbg.push('zoom ' + JSON.stringify(preZoom) + ' ' + JSON.stringify(postZoom))
	check(
		'double-tap zooms the media',
		!!preZoom && !!postZoom && postZoom.w > preZoom.w * 1.5,
	)
	await sendKey('Escape')
	await pump(300)
	check('lightbox closes after interactions', !findGtkText('2 of 3'))

	// useLightbox imperative open at an index (hook button is back on the
	// interactive root now that the controlled lightbox is closed).
	await clickAt(findView('hook-open'))
	await pump(300)
	check('useLightbox open(index) presents that slide', !!findGtkText('3 of 3'))
	check('useLightbox reports its index', hasText('picked', 'hook-idx:2'))
	await sendKey('Escape')
	await pump(300)
	check('useLightbox element closes', !findGtkText('3 of 3'))

	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)

	GLib.file_set_contents('/tmp/gtk-lightbox-dbg.log', dbg.join('\n'))
	print('GTK_LIGHTBOX ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	dbg.push('ERROR ' + String((e && (e.name + ' ' + e.message)) || e))
	GLib.file_set_contents('/tmp/gtk-lightbox-dbg.log', dbg.join('\n'))
	print('GTK_LIGHTBOX_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
