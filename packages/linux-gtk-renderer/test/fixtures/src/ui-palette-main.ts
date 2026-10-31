import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import Graphene from 'gi://Graphene?version=1.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PaletteProbe } from './ui-palette.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const dbg: string[] = []

const window = new Gtk.Window({ title: 'Octane GTK Palette test', default_width: 640, default_height: 700, decorated: false })
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
/** The palette's Gtk.Entry — labels expose get/set_text too, so match the
 *  concrete widget class rather than duck-typing the text API. */
const findEntry = (): any => {
	let found: any = null
	const walk = (w: any) => {
		if (found || !w) { return }
		try {
			if (w instanceof Gtk.Entry) { found = w; return }
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
const bounds = (w: any): { x: number; y: number; w: number; h: number } | null => {
	const [ok, pt] = w.compute_point(window, new Graphene.Point({ x: 0, y: 0 }))
	const [okB, rect] = w.compute_bounds(w)
	if (!ok || !okB) { return null }
	return { x: pt.x, y: pt.y, w: rect.size.width, h: rect.size.height }
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_PALETTE_READY ' + JSON.stringify(payload))
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
	root.render(PaletteProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	check('probe mounts', !!findView('pal-open'))

	// Open → centered modal palette: entry + item rows.
	await clickAt(findView('pal-open'))
	await pump(350)
	const entry = findEntry()
	check('palette presents its search entry', !!entry)
	check('palette lists the commands', !!findGtkText('Alpha command') && !!findGtkText('Beta command') && !!findGtkText('Gamma command'))
	const eb = entry && bounds(entry)
	dbg.push('entry ' + JSON.stringify(eb))
	check('palette centers near the window middle', !!eb && eb.x > 40 && eb.y > 60)

	// Type a query — the list filters.
	await ready({ type: 'bet' })
	await pump(350)
	check('typed query filters the list', !findGtkText('Alpha command') && !findGtkText('Gamma command'))
	check('filter keeps the match', !!findGtkText('Beta command'))

	// Down highlights the only match; Enter selects it → value + close.
	await ready({ key: 'Down' })
	await pump(250)
	await ready({ key: 'Return' })
	await pump(350)
	check('Enter selects the highlighted result', hasText('picked', 'selected:b'))
	check('select dismisses the palette', !findGtkText('Beta command'))

	// Reopen → Escape dismisses.
	await clickAt(findView('pal-open'))
	await pump(350)
	check('palette reopens', !!findGtkText('Alpha command'))
	await ready({ key: 'Escape' })
	await pump(300)
	check('Escape dismisses the palette', !findGtkText('Alpha command'))
	check('Escape reports via onOpenChange', hasText('closed', 'pal-closed'))

	// Reopen → the previous selection owns the highlight, so Down moves to
	// 'c' and Enter selects it.
	await clickAt(findView('pal-open'))
	await pump(350)
	await ready({ key: 'Down' })
	await pump(250)
	await ready({ key: 'Return' })
	await pump(350)
	check('arrow + Enter selects the next row', hasText('picked', 'selected:c'))

	// Reopen → scrim click dismisses.
	await clickAt(findView('pal-open'))
	await pump(350)
	await ready({ x: 10, y: 10 })
	await pump(350)
	check('scrim press dismisses the palette', !findGtkText('Alpha command'))

	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)

	GLib.file_set_contents('/tmp/gtk-palette-dbg.log', dbg.join('\n'))
	print('GTK_PALETTE ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	dbg.push('ERROR ' + String((e && (e.name + ' ' + e.message)) || e))
	dbg.push('STACK ' + String(e && e.stack))
	GLib.file_set_contents('/tmp/gtk-palette-dbg.log', dbg.join('\n'))
	print('GTK_PALETTE_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
