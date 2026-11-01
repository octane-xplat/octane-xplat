import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import Graphene from 'gi://Graphene?version=1.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { showToast } from '@octane-xplat/ui'
import { ToastProbe, pushRenderToast } from './ui-toast.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const dbg: string[] = []
/** onHide records — the module-level pushes carry no component state. */
const hides: string[] = []
const hide = (tag: string) => (r: string) => hides.push(`${tag}:${r}`)

const window = new Gtk.Window({ title: 'Octane GTK Toast test', default_width: 640, default_height: 700, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

// Toast surfaces render through portals and the fallback service root —
// outside the declaring container's node map. Search the live widget tree.
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
		for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) {
			walk(c)
		}
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

/** The toast card a label belongs to — climb to the first ancestor wide
 *  enough to be the card (stacks run 360 dips; labels stay under 200). */
const cardOf = (w: any): any => {
	for (let cur = w, i = 0; cur && i < 15; cur = cur.get_parent?.(), i++) {
		if (cur === window) { return null }
		if (cur.get_width?.() >= 200) { return cur }
	}
	return null
}

/** Widget rect in window coordinates. */
const bounds = (w: any): { x: number; y: number; w: number; h: number } | null => {
	const [ok, pt] = w.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	const [okB, rect] = w.compute_bounds(w)
	if (!ok || !okB) { return null }
	return { x: pt.x, y: pt.y, w: rect.size.width, h: rect.size.height }
}
const cardBounds = (needle: string) => {
	const w = findGtkText(needle)
	return w ? bounds(cardOf(w) ?? w) : null
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_TOAST_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

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
const W = 640
const H = 700

async function run() {
	root.render(ToastProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	// Inline <Toast> renders in the declaring tree.
	check('inline Toast renders in-tree', !!findView('inline-toast') && !!findGtkText('inline-toast-body'))

	// Module showToast → fallback stack (bottomEnd).
	const mod = showToast({ body: 'mod-toast-body', isAutoHide: false, onHide: hide('mod') })
	await pump(300)
	const mb = cardBounds('mod-toast-body')
	dbg.push('mod ' + JSON.stringify(mb))
	check('showToast lands a toast on the fallback stack', !!mb)
	check('fallback toast docks bottomEnd', !!mb && mb.x + mb.w > W * 0.7 && mb.y + mb.h > H * 0.6)

	// The nonmodal layers are input-transparent outside the toast cards.
	await clickAt(findView('bg'))
	await pump(200)
	check('nonmodal toast layer passes background clicks', hasText('bg-count', '1'))

	// useToast outside a viewport → same fallback stack.
	await clickAt(findView('t-outer'))
	await pump(250)
	check('useToast outside viewport lands on fallback', !!findGtkText('outer-toast-body'))

	// Auto-hide timer → onHide('auto'); the card leaves the stack.
	showToast({ body: 'auto-toast-body', autoHideDuration: 400, onHide: hide('auto') })
	await pump(150)
	check('auto toast presents', !!findGtkText('auto-toast-body'))
	await pump(800)
	check('auto toast hides on the timer', !findGtkText('auto-toast-body'))
	check('auto-hide reports auto reason', hides.includes('auto:auto'))

	// type=error does NOT auto-hide even with a short autoHideDuration.
	showToast({ body: 'error-toast-body', type: 'error', autoHideDuration: 400, onHide: hide('err') })
	await pump(700)
	check('error toast persists past autoHideDuration', !!findGtkText('error-toast-body'))

	// renderContent layout + its dismiss() → onHide('manual').
	pushRenderToast(hide('render'))
	await pump(250)
	check('renderContent toast presents', !!findGtkText('render-toast-body'))
	await clickAt(findGtkText('Close'))
	await pump(400)
	check('renderContent dismiss() removes the toast', !findGtkText('render-toast-body'))
	check('renderContent dismiss reports manual', hides.includes('render:manual'))

	// Anchored toast → Popover against the anchor view (a separate surface).
	await clickAt(findView('t-anchor'))
	await pump(300)
	const anch = findGtkText('anchored-toast-body')
	check('anchored toast presents via Popover', !!anch)
	check(
		'anchored toast lives on a popover surface',
		!!anch && anch.get_native?.() !== window,
	)
	await ready({ key: 'Escape' })
	await pump(300)
	check('anchored toast Escape dismisses', !findGtkText('anchored-toast-body'))
	check('anchored toast Escape reports manual', hasText('picked', 'hide:anchor:manual'))

	// ToastHandle.dismiss → manual.
	const handle = showToast({ body: 'handle-toast-body', isAutoHide: false, onHide: hide('handle') })
	await pump(250)
	check('handle toast presents', !!findGtkText('handle-toast-body'))
	handle?.dismiss()
	await pump(400)
	check('handle.dismiss removes the toast', !findGtkText('handle-toast-body'))
	check('handle.dismiss reports manual', hides.includes('handle:manual'))

	// ToastHandle.update swaps content in place.
	const upd = showToast({ body: 'update-toast-v1', isAutoHide: false })
	await pump(250)
	check('update toast presents v1', !!findGtkText('update-toast-v1'))
	upd?.update({ body: 'update-toast-v2' })
	await pump(250)
	check('handle.update rewrites the toast', !!findGtkText('update-toast-v2') && !findGtkText('update-toast-v1'))

	// uniqueID: overwrite replaces in place; ignore suppresses the new push.
	showToast({ body: 'uniq-v1', uniqueID: 'u1', isAutoHide: false })
	await pump(200)
	check('unique toast presents', !!findGtkText('uniq-v1'))
	showToast({ body: 'uniq-v2', uniqueID: 'u1', isAutoHide: false })
	await pump(250)
	check('uniqueID overwrite replaces in place', !!findGtkText('uniq-v2') && !findGtkText('uniq-v1'))
	showToast({ body: 'uniq-ignored', uniqueID: 'u1', collisionBehavior: 'ignore', isAutoHide: false })
	await pump(200)
	check('uniqueID ignore suppresses the new toast', !findGtkText('uniq-ignored') && !!findGtkText('uniq-v2'))

	// Per-toast position override → topStart on the fallback surface.
	showToast({ body: 'topstart-toast-body', position: 'topStart', isAutoHide: false })
	await pump(250)
	const tsb = cardBounds('topstart-toast-body')
	dbg.push('ts ' + JSON.stringify(tsb))
	check('per-toast position override docks topStart', !!tsb && tsb.x < W * 0.3 && tsb.y < H * 0.4)

	// Declared viewport: position topEnd, maxVisible 2.
	await clickAt(findView('vp-push'))
	await pump(250)
	const vpb = cardBounds('vp-toast-a')
	dbg.push('vp ' + JSON.stringify(vpb))
	check('viewport toast docks on the viewport layers', !!vpb)
	check('viewport toast lands topEnd', !!vpb && vpb.x + vpb.w > W * 0.7 && vpb.y < H * 0.4)

	// maxVisible overflow: a+b+c pushed (a already up) → b,c visible; a queues.
	await clickAt(findView('vp-push-b'))
	await pump(200)
	await clickAt(findView('vp-push-c'))
	await pump(250)
	check('maxVisible shows the newest entries', !!findGtkText('vp-toast-b') && !!findGtkText('vp-toast-c'))
	check('maxVisible queues the overflow', !findGtkText('vp-toast-a'))

	// Dismiss c through its handle → the queued a resurfaces on the stack.
	await clickAt(findView('vp-dismiss-c'))
	await pump(400)
	check('dismissed toast leaves the stack', !findGtkText('vp-toast-c'))
	check('queued overflow toast resurfaces', !!findGtkText('vp-toast-a'))

	// Second viewport: bottomStart + inset.
	await clickAt(findView('in-push'))
	await pump(250)
	const inb = cardBounds('in-toast-a')
	dbg.push('in ' + JSON.stringify(inb))
	// dump tree for the inset layer geometry
	{
		const dump = (w: any, d: number) => {
			if (d > 9 || !w) { return }
			const b = bounds(w)
			dbg.push(' '.repeat(d) + (w.constructor?.name ?? '?') + ' ' + JSON.stringify(b))
			for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { dump(c, d + 1) }
		}
		dump(window, 0)
	}
	check('inset viewport toast presents', !!inb)
	// bottomStart + inset {start:50, bottom:60} → left ≈66, bottom ≈700-76=624.
	check(
		'viewport inset shifts the stack',
		!!inb && Math.abs(inb.x - 66) < 8 && Math.abs(inb.y + inb.h - 624) < 8,
	)

	// Orphan reroute: unmount the second viewport — its live toast drains to
	// the fallback stack (bottomEnd).
	await clickAt(findView('vp2-toggle'))
	await pump(400)
	const ob = cardBounds('in-toast-a')
	dbg.push('orphan ' + JSON.stringify(ob))
	{
		const dump = (w: any, d: number) => {
			if (d > 9 || !w) { return }
			const b = bounds(w)
			dbg.push(' '.repeat(d) + (w.constructor?.name ?? '?') + ' ' + JSON.stringify(b))
			for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { dump(c, d + 1) }
		}
		dump(window, 0)
	}
	check('orphaned toast reroutes to the fallback stack', !!ob && ob.x + ob.w > W * 0.7)

	// Teardown — overlay children + service roots disposed, chrome refcount 0.
	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)
	void mod

	GLib.file_set_contents('/tmp/gtk-toast-dbg.log', dbg.join('\n'))
	print('GTK_TOAST ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	dbg.push('ERROR ' + String((e && (e.name + ' ' + e.message)) || e) + ' @ ' + String(e && (e.stack || e)))
	GLib.file_set_contents('/tmp/gtk-toast-dbg.log', dbg.join('\n'))
	print('GTK_TOAST_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
