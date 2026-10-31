import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import Graphene from 'gi://Graphene?version=1.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { closeBottomSheet } from '@octane-xplat/ui'
import { SheetProbe } from './ui-sheet.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const flush = () => {
	try { GLib.file_set_contents('/tmp/gtk-sheet-dbg.log', dbg.join('\n')) } catch { }
}
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	dbg.push((ok ? 'PASS ' : 'FAIL ') + name)
	flush()
	if (!ok) { failures.push(name) }
}
const dbg: string[] = []

const window = new Gtk.Window({ title: 'Octane GTK Sheet test', default_width: 640, default_height: 700, decorated: false })
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
/** Widget-tree lookup by the renderer's widget name (id mirror) — reaches
 *  portal-mounted children regardless of node bookkeeping. */
const findByName = (name: string): any => {
	let found: any = null
	const walk = (w: any) => {
		if (found || !w) { return }
		try {
			if (w.get_name?.() === name) { found = w; return }
		} catch { }
		for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) { walk(c) }
	}
	walk(window)
	return found
}
/** Node-tree lookup for popover-mounted content (menu rows inside a
 *  Gtk.Popover): props carry the label text; climb to the view-bearing
 *  ancestor row. */
const findLabel = (text: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (JSON.stringify(n.props).includes(text)) {
				let cur = n
				while (cur && !cur.view) { cur = cur.parent }
				if (cur?.view) { return cur.view }
			}
		} catch { }
	}
	return null
}
const findMenuRow = (text: string): any => findLabel(text) ?? findGtkText(text)
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
/** Window-relative bounds — transforms included, so a translated sheet
 *  panel reports where it is painted. */
const bounds = (w: any): { x: number; y: number; w: number; h: number } | null => {
	const [ok, pt] = w.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	const [okB, rect] = w.compute_bounds(w)
	if (!ok || !okB) { return null }
	return { x: pt.x, y: pt.y, w: rect.size.width, h: rect.size.height }
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	dbg.push('READY ' + JSON.stringify(payload))
	flush()
	print('GTK_SHEET_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})
const point = (widget: any) => {
	const native = widget?.get_native?.()
	if (!native) { return null }
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
	return { x: x + wx, y: y + wy }
}
const clickAt = async (widget: any, what?: string) => {
	const p = widget && point(widget)
	if (!p) { dbg.push('MISSING widget ' + String(what)); return }
	await ready(p)
}
const dragAt = async (widget: any, dx: number, dy: number, what?: string) => {
	const p = widget && point(widget)
	if (!p) { dbg.push('MISSING widget ' + String(what)); return }
	await ready({ x: p.x, y: p.y, drag: { dx, dy } })
}
const overlayChildren = () => ((container as any).overlayLayers?.size ?? 0)
const VH = 700

async function run() {
	root.render(SheetProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	check('sheet probe mounts', !!findView('bg-btn'))
	check('no sheet at rest', !findGtkText('ctl-body'))

	// Controlled sheet: presents bottom-docked, scrim claims background input
	// and doubles as the dismiss gesture.
	await clickAt(findView('ctl-open'))
	await pump(400)
	check('controlled sheet opens', !!findGtkText('ctl-body'))
	const ctlPanel = findByName('ctl-sheet')
	const ctlBounds = ctlPanel && bounds(ctlPanel)
	dbg.push('ctl ' + JSON.stringify(ctlBounds))
	check('sheet docks to the window bottom', !!ctlBounds && Math.abs(ctlBounds.y + ctlBounds.h - VH) <= 6)
	check('capped sheet height is 62 percent', !!ctlBounds && Math.abs(ctlBounds.h - VH * 0.62) <= 8)
	await clickAt(findView('bg-btn'))
	await pump(400)
	check('scrim claims background clicks', !hasText('bg-count', '1'))
	check('scrim tap dismisses the sheet', !findGtkText('ctl-body'))
	check('dismiss reports onOpenChange', hasText('picked', 'ctl:closed'))
	check('overlay layer released', overlayChildren() === 0)

	// Reopen → Escape dismisses through the layer stack.
	await clickAt(findView('ctl-open'))
	await pump(400)
	check('sheet reopens', !!findGtkText('ctl-body'))
	await ready({ key: 'Escape' })
	await pump(400)
	check('Escape dismisses the sheet', !findGtkText('ctl-body'))

	// Reopen → grabber swipe-down dismisses (swipe-only mode, no snap points).
	await clickAt(findView('ctl-open'))
	await pump(400)
	check('sheet reopens for swipe', !!findGtkText('ctl-body'))
	const grabber = findByName('ctl-sheet-grabber')
	check('grabber row exists', !!grabber)
	dbg.push('grabber=' + !!grabber + ' panel=' + !!findByName('ctl-sheet'))
	if (grabber) { await dragAt(grabber, 0, 120) }
	await pump(450)
	dbg.push('after-swipe panel=' + JSON.stringify(findByName('ctl-sheet') && bounds(findByName('ctl-sheet'))) + ' pan=' + String((globalThis as any).__sheetPan) + ' last=' + String((globalThis as any).__sheetPanLast))
	check('grabber swipe dismisses the sheet', !findGtkText('ctl-body'))

	// Snap points: the largest stop sizes the panel; releases snap to the
	// nearest detent below/above the finger and dismiss below the peek stop.
	await clickAt(findView('snap-open'))
	await pump(400)
	check('snap sheet opens', !!findGtkText('snap-body'))
	const snapPanel = () => findByName('snap-sheet')
	const snapBounds = snapPanel() && bounds(snapPanel())
	dbg.push('snap ' + JSON.stringify(snapBounds))
	check('snap panel sizes to the largest detent', !!snapBounds && Math.abs(snapBounds.h - VH * 0.9) <= 8)
	check('snap sheet rests at the smallest detent', !!snapBounds && Math.abs(snapBounds.y - (VH - VH * 0.25)) <= 14)
	const snapGrabber = findByName('snap-sheet-grabber')
	await dragAt(snapGrabber, 0, -400, 'snap-grabber')
	await pump(450)
	const topBounds = snapPanel() && bounds(snapPanel())
	dbg.push('snap-top ' + JSON.stringify(topBounds))
	check('drag up snaps to the largest detent', !!topBounds && Math.abs(topBounds.y - (VH - VH * 0.9)) <= 14)
	await dragAt(snapGrabber, 0, 250, 'snap-grabber')
	await pump(450)
	const midBounds = snapPanel() && bounds(snapPanel())
	dbg.push('snap-mid ' + JSON.stringify(midBounds))
	check('drag down snaps to the middle detent', !!midBounds && Math.abs(midBounds.y - VH * 0.5) <= 14)
	await dragAt(snapGrabber, 0, 150, 'snap-grabber')
	await pump(450)
	const lowBounds = snapPanel() && bounds(snapPanel())
	dbg.push('snap-low ' + JSON.stringify(lowBounds))
	check('drag down snaps to the peek detent', !!lowBounds && Math.abs(lowBounds.y - VH * 0.75) <= 14)
	await dragAt(snapGrabber, 0, 250, 'snap-grabber')
	await pump(500)
	check('drag past the peek detent dismisses', !findGtkText('snap-body'))
	check('snap dismiss reports onOpenChange', hasText('picked', 'snap:closed'))

	// Height budgets against the 700px window.
	const heightCases: Array<[string, number | null, number]> = [
		['h-hug', null, 0],
		['h-capped', VH * 0.62, 8],
		['h-tall', VH * 0.92, 8],
		['h-num', 300, 8],
		['h-pct', VH * 0.5, 8],
	]
	for (const [id, expected, tol] of heightCases) {
		await clickAt(findView(id))
		await pump(400)
		const hb = findByName('h-sheet') && bounds(findByName('h-sheet'))
		dbg.push(id + ' ' + JSON.stringify(hb))
		check(id + ' presents a sheet', !!findGtkText('height-body'))
		if (expected == null) {
			check(id + ' hugs content height', !!hb && hb.h < 220)
		} else {
			check(id + ' height budget applies', !!hb && Math.abs(hb.h - expected) <= tol)
		}
		check(id + ' docks at the bottom', !!hb && Math.abs(hb.y + hb.h - VH) <= 8)
		await ready({ key: 'Escape' })
		await pump(400)
	}

	// purpose='required': scrim press, Escape and swipe all stay open; only
	// the sheet's own affordance closes it.
	await clickAt(findView('req-open'))
	await pump(400)
	check('required sheet opens', !!findGtkText('req-body'))
	await clickAt(findView('bg-btn'))
	await pump(350)
	check('required sheet ignores scrim taps', !!findGtkText('req-body'))
	check('required sheet blocks background input', !hasText('bg-count', '1'))
	await ready({ key: 'Escape' })
	await pump(350)
	check('required sheet ignores Escape', !!findGtkText('req-body'))
	const reqGrabber = findByName('req-sheet-grabber')
	if (reqGrabber) { await dragAt(reqGrabber, 0, 300) }
	await pump(450)
	check('required sheet snaps back after swipe', !!findGtkText('req-body'))
	await clickAt(findByName('req-close'))
	await pump(400)
	check('required sheet closes from inside', !findGtkText('req-body'))

	// purpose='form': the scrim blocks input but does not dismiss; Escape closes.
	await clickAt(findView('form-open'))
	await pump(400)
	check('form sheet opens', !!findGtkText('form-body'))
	await clickAt(findView('bg-btn'))
	await pump(350)
	check('form sheet ignores scrim taps', !!findGtkText('form-body'))
	await ready({ key: 'Escape' })
	await pump(400)
	check('form sheet dismisses on Escape', !findGtkText('form-body'))

	// hasScrim=false keeps the page interactive under the panel.
	await clickAt(findView('noscrim-open'))
	await pump(400)
	check('scrim-free sheet opens', !!findGtkText('noscrim-body'))
	await clickAt(findView('bg-btn'))
	await pump(350)
	check('scrim-free sheet passes background clicks', hasText('bg-count', '1'))
	check('scrim-free sheet stays open', !!findGtkText('noscrim-body'))
	await clickAt(findByName('noscrim-close'))
	await pump(400)
	check('scrim-free sheet closes from inside', !findGtkText('noscrim-body'))

	// Uncontrolled sheet: defaultOpen presents it; a scrim tap closes itself.
	await clickAt(findView('unctl-mount'))
	await pump(400)
	check('uncontrolled sheet opens by default', !!findGtkText('unctl-body'))
	await clickAt(findView('bg-btn'))
	await pump(400)
	check('uncontrolled sheet self-dismisses on scrim', !findGtkText('unctl-body'))

	// Switcher: one host swaps panels; scrim/Escape report through
	// onActiveSheetChange.
	await clickAt(findView('sw-a'))
	await pump(400)
	check('switcher shows sheet a', !!findGtkText('sw-content-a'))
	await clickAt(findByName('sw-goto-b'))
	await pump(400)
	check('switcher swaps to sheet b', !!findGtkText('sw-content-b'))
	check('switcher hides the old panel', !findGtkText('sw-content-a'))
	await clickAt(findByName('sw-goto-close'))
	await pump(400)
	check('switcher closes on null selection', !findGtkText('sw-content-b'))
	await clickAt(findView('sw-a'))
	await pump(400)
	await ready({ key: 'Escape' })
	await pump(400)
	check('switcher Escape reports null sheet', !findGtkText('sw-content-a'))
	check('switcher host released', overlayChildren() === 0)

	// Menu sheets: an explicit 'bottom-sheet' presentation renders the menu
	// inside a real sheet panel; 'adaptive' keeps the popover on a fine
	// pointer (no touch seat in the harness).
	await clickAt(findView('mm-sheet'))
	await pump(400)
	check('MoreMenu bottom-sheet opens a layer', overlayChildren() === 1)
	check('MoreMenu sheet lists items', !!findMenuRow('MoreActionOne'))
	await clickAt(findMenuRow('MoreActionOne'))
	await pump(400)
	check('MoreMenu sheet item selects', hasText('picked', 'mm:one'))
	check('MoreMenu sheet closes on select', overlayChildren() === 0)
	await clickAt(findView('dm-sheet'))
	await pump(400)
	check('DropdownMenu bottom-sheet opens a layer', overlayChildren() === 1)
	check('DropdownMenu sheet lists items', !!findMenuRow('SheetActionOne'))
	await clickAt(findMenuRow('SheetActionOne'))
	await pump(400)
	check('DropdownMenu sheet item selects', hasText('picked', 'dm:one'))
	await clickAt(findView('mm-adaptive'))
	await pump(400)
	check('adaptive menu stays a popover', overlayChildren() === 0 && !!findMenuRow('AdaptiveOne'))
	await clickAt(findMenuRow('AdaptiveOne'))
	await pump(350)
	check('adaptive menu item selects', hasText('picked', 'mm:ad'))

	// Imperative service: dedicated root in the bottom layer; close() and
	// closeBottomSheet resolve the handle.
	await clickAt(findView('imp-open'))
	await pump(400)
	check('openBottomSheet presents content', !!findGtkText('imp-sheet-svc'))
	await clickAt(findByName('imp-close'))
	await pump(400)
	check('imperative close resolves the handle', hasText('picked', 'imp:imp-result'))
	check('imperative layer released', overlayChildren() === 0)
	await clickAt(findView('imp-open2'))
	await pump(400)
	check('second service sheet opens', !!findGtkText('imp-sheet-svc2'))
	closeBottomSheet('svc2-result')
	await pump(400)
	check('closeBottomSheet resolves the newest sheet', hasText('picked', 'imp2:svc2-result'))
	check('closeBottomSheet releases the layer', overlayChildren() === 0)

	// useImperativeBottomSheet: content belongs to the declaring tree's outlet.
	await clickAt(findView('uib-open'))
	await pump(400)
	check('useImperativeBottomSheet presents content', !!findGtkText('imp-sheet-uib'))
	await clickAt(findByName('imp-close'))
	await pump(400)
	check('hook imperative close resolves', hasText('picked', 'uib:imp-result'))
	check('all layers released', overlayChildren() === 0)

	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)

	GLib.file_set_contents('/tmp/gtk-sheet-dbg.log', dbg.join('\n'))
	print('GTK_SHEET ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	dbg.push('ERROR ' + String((e && (e.name + ' ' + e.message)) || e))
	dbg.push('STACK ' + String(e && e.stack))
	GLib.file_set_contents('/tmp/gtk-sheet-dbg.log', dbg.join('\n'))
	print('GTK_SHEET_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
