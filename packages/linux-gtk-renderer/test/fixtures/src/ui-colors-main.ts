import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { ColorsProbe, state } from './ui-colors.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Colors test', default_width: 560, default_height: 640, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

// A full GC while JS controls the stack keeps incremental sweeps from
// straddling GTK dispatch — a blocked source/handler is dropped, not retried.
const settle = () => { try { (globalThis as any).imports.system.gc() } catch { } }
const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const hasText = (needle: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
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
const clickAt = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y })
}
const dragOn = async (widget: any, dx: number, dy: number) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y, drag: { dx, dy } })
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_COL_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => {
		readyResolve = resolve
		// Long wedge guard only — the window key ack resolves well inside it.
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
			if (readyResolve === resolve) { readyResolve = null; resolve() }
			return false
		})
	})
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

async function run() {
	root.render(ColorsProbe, {})
	await pump(50)
	window.present()
	await pump(350)

	check('ColorArea mounts', !!findView('area'))
	check('ColorSlider mounts', !!findView('hue'))
	check('ColorField mounts', !!findView('cfield'))
	check('ColorPicker mounts', !!findView('picker'))
	check('RichText mounts', !!findView('rich'))

	// RichText — folded text + markup path.
	const rich = findView('rich')
	check('rich text folds all runs', (rich?.get_text?.() ?? rich?.label ?? '').includes('PLAIN STYLED UPPER TAPPABLE'))
	check('rich text uses markup', rich?.use_markup === true || String(rich?.label ?? '').includes('<span'))

	// Tap the link span — activate-link fires the span's onPress. Find the
	// 'TAPPABLE' run's x position inside the label via pango layout index.
	if (rich) {
		const layout = rich.get_layout?.()
		const text = rich.get_text?.() ?? ''
		const idx = text.indexOf('TAPPABLE')
		if (layout && idx >= 0) {
			// index_to_pos: single out-param → GJS returns the Pango.Rectangle.
			const res = layout.index_to_pos(idx)
			const pos = Array.isArray(res) ? res[res.length - 1] : res
			const c = point(rich)
			const t = rich.get_layout_offsets?.()
			const lx = (pos?.x ?? 0) / 1024 + (Array.isArray(t) ? t[0] : 0)
			const ly = (pos?.y ?? 0) / 1024 + (Array.isArray(t) ? t[1] : 0)
			const [okb, bounds] = rich.compute_bounds(rich.get_native())
			await ready({ x: c.x - (okb ? bounds.size.width / 2 : 0) + lx + 4, y: c.y - (okb ? bounds.size.height / 2 : 0) + ly + 4 })
			await pump(200)
		}
	}
	check('link span tap fires onPress', state.linkTaps >= 1)

	// ColorArea — drag horizontally changes saturation; drag-end commits.
	const area = findView('area')
	print('GTK_COL_AREA ' + JSON.stringify({
		bounds: area?.getActualSize?.() ?? null,
		mapped: area?.get_mapped?.() ?? null,
	}))
	if (area) {
		await dragOn(area, -60, 0)
		await pump(250)
	}
	print('GTK_COL_PAN ' + JSON.stringify({
		states: state.dbgPan ?? null,
		moved: state.dbgMoved ?? 0,
		changes: state.areaChanges,
	}))
	check('area drag changes value', state.areaChanges.length >= 1 && state.areaChanges.some((h: string) => h !== '#ff0000'))
	check('area drag end commits', typeof state.areaEnd === 'string' && state.areaEnd !== null)

	// ColorSlider — drag moves the hue thumb → hex changes.
	const slider = findView('hue')
	if (slider) {
		await dragOn(slider, 80, 0)
		await pump(250)
	}
	check('slider drag changes hue', state.sliderChanges.some((h: string) => h !== '#ff0000'))

	// ColorField — type a hex value and commit with Return.
	const cfield = findView('cfield')
	const entry = (() => {
		for (const n of (container as any).nodes.values()) {
			for (let cur = n; cur; cur = cur.parent) {
				if (cur?.props?.id === 'cfield' && n?.type === 'textfield') { return n.view }
			}
		}
		return null
	})()
	check('color field entry present', !!entry)
	if (entry) { await clickAt(entry); await pump(150) }
	await ready({ key: 'ctrl+a' })
	await ready({ type: '#00ff00' })
	await pump(150)
	await ready({ key: 'Return' })
	await pump(250)
	check('field commit parses hex', state.fieldCommit === '#00ff00')

	// ColorPicker — type into its internal ColorField; the composite value moves.
	const pickerField = (() => {
		for (const n of (container as any).nodes.values()) {
			if (n?.type !== 'textfield') { continue }
			for (let cur = n; cur; cur = cur.parent) {
				if (cur?.props?.id === 'picker') { return n.view }
			}
		}
		return null
	})()
	check('picker field present', !!pickerField)
	if (pickerField) { await clickAt(pickerField); await pump(150) }
	await ready({ key: 'ctrl+a' })
	await ready({ type: '#00ff00' })
	await ready({ key: 'Return' })
	await pump(250)
	check('picker field commit propagates', state.pickerChanges.length >= 1)

	// Teardown.
	settle()
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	print('GTK_COL ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	window.destroy()
	loop.quit()
}

run().catch((e) => {
	print('GTK_COL_ERROR ' + String(e && (e.stack || e)))
	window.destroy()
	loop.quit()
})
loop.run()
