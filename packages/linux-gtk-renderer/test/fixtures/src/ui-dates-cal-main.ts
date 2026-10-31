import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { CalProbe, InputsProbe, state } from './ui-dates.gtk'

Gtk.init()

const diags: string[] = []
const diag = (tag: string, data: any) => { diags.push(tag + ' ' + JSON.stringify(data)) }
const dumpDiags = () => {
	try {
		GLib.file_set_contents('/tmp/gtk-dates-cal-diag.json', JSON.stringify({ checks: checks.length, failures, diags }))
	} catch (e) { print('DIAG_WRITE_FAIL ' + e) }
}

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Dates test', default_width: 700, default_height: 720, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

// A full GC while JS controls the stack keeps incremental sweeps from
// straddling GTK dispatch — a blocked source/handler is dropped, not retried.
const settle = () => { try { (globalThis as any).imports.system.gc() } catch { } }
const pump = (ms: number) => new Promise<void>((resolve) => {
	settle()
	let done = false
	const finish = () => { if (!done) { done = true; resolve() } }
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { finish(); return false })
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms + 800, () => { finish(); return false })
})

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const findByTypeUnder = (type: string, ancestorId: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.type !== type) { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (cur?.props?.id === ancestorId) { return n.view }
		}
	}
	return null
}
const hasText = (needle: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
}
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
// A calendar day cell is a masonview (vx-calendar-day) with onTap — the label
// inside it is viewless. Find the CELL view, not the label.
const findDayCell = (needle: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes('vx-calendar-day') && !cur.props.className.includes('--empty') && !cur.props.className.includes('--outside')) {
				const v = cur.view
				if (v && v.get_mapped?.()) { return v }
			}
		}
	}
	return null
}
// Prefer a day cell that is mapped AND inside the window bounds — skips
// stale popup subtrees that still exist in the node map.
const pickDayCell = (needle: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes('vx-calendar-day') && !cur.props.className.includes('--empty') && !cur.props.className.includes('--outside')) {
				const v = cur.view
				if (!v || !v.get_mapped?.()) { continue }
				const c = point(v)
				if (c.x >= 0 && c.x <= 700 && c.y >= 0 && c.y <= 720) { return v }
			}
		}
	}
	return findDayCell(needle)
}
const findUnder = (needle: string, ancestorId?: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		let hit = false
		for (let cur = n; cur; cur = cur.parent) {
			if (ancestorId === undefined || cur?.props?.id === ancestorId) { hit = true; break }
		}
		if (!hit) { continue }
		let cur = n
		while (cur && !cur.view) { cur = cur.parent }
		if (cur?.view) { return cur.view }
	}
	return null
}
// Popover/layer content is portalled — scope by an ancestor's className.
const findInClass = (needle: string, classSub: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		let hit = false
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes(classSub)) {
				hit = true
				break
			}
		}
		if (!hit) { continue }
		let cur = n
		while (cur && !cur.view) { cur = cur.parent }
		if (cur?.view) { return cur.view }
	}
	return null
}
const point = (widget: any): { x: number; y: number } => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds') }
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
const describePoint = (tag: string, widget: any) => {
	try {
		const native = widget.get_native()
		const [ok, rect] = widget.compute_bounds(native)
		const [tx, ty] = native.get_surface_transform()
		const chain: any[] = []
		for (let s = native.get_surface(); s && typeof s.get_parent === 'function'; s = s.get_parent()) {
			chain.push({ name: s.constructor?.name, pos: [s.get_position_x?.(), s.get_position_y?.()] })
		}
		const [wx, wy] = window.get_surface_transform()
		diag('GEOM', { tag, native: native?.constructor?.name, ok, rect: ok ? { x: rect.origin.x, y: rect.origin.y, w: rect.size.width, h: rect.size.height } : null, tx, ty, chain, wx, wy, root: widget.get_root?.()?.constructor?.name })
	} catch (e) { diag('GEOM-ERR', { tag, e: String(e) }) }
}
const clickAt = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y })
}

let readyResolve: (() => void) | null = null
// Popovers live in their own Gdk surfaces and take keyboard focus; the F12
// ack must be armed on every root, not just the window.
const armed = new Set<any>()
const onKey = (_c: any, keyval: number) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
}
const armAcks = () => {
	for (const n of (container as any).nodes.values()) {
		const r = n?.view?.get_root?.()
		if (r && !armed.has(r)) {
			armed.add(r)
			const ctl = new Gtk.EventControllerKey()
			ctl.connect('key-pressed', onKey)
			r.add_controller(ctl)
		}
	}
}
const ready = (payload: any) => {
	armAcks()
	settle()
	print('GTK_DATES_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => {
		readyResolve = resolve
		// Fallbacks: popup surfaces can swallow the ack key, and a GC sweep can
		// eat a source dispatch — stagger retries so neither wedges the run.
		for (const ms of [350, 900, 1800, 3000]) {
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
				if (readyResolve === resolve) { readyResolve = null; resolve() }
				return false
			})
		}
	})
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', onKey)

async function run() {
	root.render(CalProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	check('Calendar mounts', !!findView('cal'))
	check('range Calendar mounts', !!findView('cal-range'))
	check('calendar month title renders', !!findUnder('June 2025', 'cal'))

	// Calendar hooks — navigation flips the derived month grid.
	check('hook month June', state.hookMonth === '2025-06')
	check('hook grid has days', state.hookDays >= 35)
	check('constraint disables outside date', state.hookDisabledOut === true)
	check('constraint allows in-range date', state.hookDisabledIn === false)
	const hookNext = findView('hook-next')
	if (hookNext) { await clickAt(hookNext); await pump(200) }
	check('navigateMonths advances grid', state.hookMonth === '2025-07')

	// Calendar — real click on a day cell writes the ISO date.
	check('day cell present', !!pickDayCell('June 15'))
	for (let attempt = 0; attempt < 4 && state.calPick !== '2025-06-15'; attempt++) {
		const day15 = pickDayCell('June 15')
		if (!day15) { await pump(200); continue }
		await clickAt(day15)
		await pump(200)
	}
	check('day pick fires ISO date', state.calPick === '2025-06-15')

	// Month navigation via the chevron Pressable.
	const next = findUnder('Next month', 'cal')
	if (next) { await clickAt(next); await pump(200) }
	check('next month navigates', !!findUnder('July 2025', 'cal'))

	// Range calendar — anchored 'August 2025' — two clicks complete a range.
	check('range day cells present', !!pickDayCell('August 10') && !!pickDayCell('August 20'))
	// Two-click range: click start then end ONCE per attempt — re-clicking the
	// anchor commits a single-day range (applyRangePick same-day semantics).
	for (let attempt = 0; attempt < 6 && !(state.rangePick?.start === '2025-08-10' && state.rangePick?.end === '2025-08-20'); attempt++) {
		const r10 = pickDayCell('August 10')
		diag('r10', { attempt, found: !!r10, pt: r10 ? point(r10) : null, state: state.rangePick ?? null })
		if (r10) { await clickAt(r10); await pump(300) }
		const r20 = pickDayCell('August 20')
		diag('r20', { attempt, found: !!r20, pt: r20 ? point(r20) : null, state: state.rangePick ?? null })
		if (r20) { await clickAt(r20); await pump(300) }
	}
	diag('range', state.rangePick ?? null)
	check('range pick fires start+end', state.rangePick?.start === '2025-08-10' && state.rangePick?.end === '2025-08-20')

	settle()
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	dumpDiags()
	print('GTK_DATES ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	window.destroy()
	loop.quit()
}

run().catch((e) => {
	diags.push('ERROR ' + String(e && (e.stack || e)))
	dumpDiags()
	print('GTK_DATES_ERROR ' + String(e && (e.stack || e)))
	window.destroy()
	loop.quit()
})
loop.run()
