import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import Graphene from 'gi://Graphene?version=1.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { DrawerProbe } from './ui-drawer.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const dbg: string[] = []

const window = new Gtk.Window({ title: 'Octane GTK Drawer test', default_width: 640, default_height: 700, decorated: false })
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
/** Widget-tree lookup by the renderer's widget name (id/accessibilityLabel
 *  mirror) — reaches portal-mounted children regardless of node bookkeeping. */
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
/** First ancestor of `w` (inclusive) that fills the window height — the
 *  drawer panel's mason container, not the label inside it. */
const fillAncestor = (w: any): any => {
	for (let cur = w; cur; cur = cur.get_parent?.()) {
		const b = bounds(cur)
		if (b && b.h >= 640) { return cur }
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
const bounds = (w: any): { x: number; y: number; w: number; h: number } | null => {
	const [ok, pt] = w.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	const [okB, rect] = w.compute_bounds(w)
	if (!ok || !okB) { return null }
	return { x: pt.x, y: pt.y, w: rect.size.width, h: rect.size.height }
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_DRAWER_READY ' + JSON.stringify(payload))
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

async function run() {
	root.render(DrawerProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	check('drawer main content renders', !!findView('dr-main-btn'))
	check('closed drawer hides the panel', !findGtkText('drawer-panel-label'))

	// Uncontrolled drawer: defaultOpen presents it, and a scrim tap dismisses
	// without any parent state update.
	check('uncontrolled drawer opens by default', !!findGtkText('unctl-panel-label'))
	await ready({ x: 500, y: 350 })
	await pump(350)
	check('uncontrolled drawer self-dismisses on scrim', !findGtkText('unctl-panel-label'))

	// Open → left-docked panel over a scrim. Measure the panel container (the
	// ancestor that fills the window), not the label inside it.
	await clickAt(findView('dr-open'))
	await pump(350)
	const panelLabel = findGtkText('drawer-panel-label')
	check('open drawer presents the panel', !!panelLabel)
	const panelBox = panelLabel && fillAncestor(panelLabel)
	dbg.push('panel ' + JSON.stringify(panelBox && bounds(panelBox)))
	check('drawer panel docks at the start edge', !!panelBox && bounds(panelBox)!.x < 90)
	check('drawer panel fills the window height', !!panelBox)

	// A panel item is still clickable while the scrim holds input.
	await clickAt(findByName('dr-item'))
	await pump(250)
	check('drawer panel items stay clickable', hasText('picked', 'item'))

	// A press on the main button's center lands on the modal scrim: the button
	// does not receive it and the press doubles as the dismiss gesture.
	await clickAt(findView('dr-main-btn'))
	await pump(350)
	check('modal drawer blocks main clicks', !hasText('main-count', '1'))
	check('scrim press dismisses the drawer', !findGtkText('drawer-panel-label'))
	check('scrim dismiss reports via onDismiss', hasText('picked', 'dismissed'))

	// Reopen → Escape dismisses.
	await clickAt(findView('dr-open'))
	await pump(350)
	check('drawer reopens', !!findGtkText('drawer-panel-label'))
	await ready({ key: 'Escape' })
	await pump(300)
	check('Escape dismisses the drawer', !findGtkText('drawer-panel-label'))

	// Main content is interactive again after close.
	await clickAt(findView('dr-main-btn'))
	await pump(250)
	check('main interactive after close', hasText('main-count', '1'))

	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)

	GLib.file_set_contents('/tmp/gtk-drawer-dbg.log', dbg.join('\n'))
	print('GTK_DRAWER ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	dbg.push('ERROR ' + String((e && (e.name + ' ' + e.message)) || e))
	dbg.push('STACK ' + String(e && e.stack))
	GLib.file_set_contents('/tmp/gtk-drawer-dbg.log', dbg.join('\n'))
	print('GTK_DRAWER_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
