import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PowerSearchProbe, state } from './ui-powersearch.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK PowerSearch test', default_width: 680, default_height: 420, decorated: false })
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
// Find a node whose own text prop equals `text`, then return the view of the
// ancestor carrying a className containing `classSub` (for popover rows).
const findTextInClass = (text: string, classSub: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.text !== text) { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes(classSub)) {
				return cur.view ?? null
			}
		}
	}
	return null
}
const describePoint = (tag: string, widget: any) => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	const [tx, ty] = native.get_surface_transform()
	const chain: any[] = []
	for (let s = native.get_surface(); s && typeof s.get_parent === 'function'; s = s.get_parent()) {
		chain.push({ name: s.constructor?.name, pos: [s.get_position_x?.(), s.get_position_y?.()] })
	}
	const [wx, wy] = window.get_surface_transform()
	print('GTK_PS_GEOM ' + JSON.stringify({ tag, native: native?.constructor?.name, ok, rect: ok ? { x: rect.origin.x, y: rect.origin.y, w: rect.size.width, h: rect.size.height } : null, tx, ty, chain, wx, wy, root: widget.get_root?.()?.constructor?.name }))
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
	print('GTK_PS_READY ' + JSON.stringify(payload))
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
	root.render(PowerSearchProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	check('PowerSearch mounts', !!findView('ps'))
	check('usePowerSearchConfig builds fields', state.hookFields === 3)

	// Type into the search field — suggestions popover lists field matches.
	const input = (() => {
		for (const n of (container as any).nodes.values()) {
			if (n?.type !== 'textfield') { continue }
			for (let cur = n; cur; cur = cur.parent) {
				if (cur?.props?.id === 'ps') { return n.view }
			}
		}
		return null
	})()
	check('search input present', !!input)
	if (input) { input.focus?.(); await pump(100) }
	await ready({ type: 'na' })
	await pump(400)
	const nameItem = findTextInClass('Name', 'vx-power-search-result')
	check('suggestion popover lists field', !!nameItem)

	// Pick the 'Name' field → editor popover opens.
	if (nameItem) { await clickAt(nameItem); await pump(500) }
	const valueField = findLabel('Value')
	check('editor opens for field', !!valueField)
	check('apply button present', !!findTextInClass('Apply', 'vx-power-search-edit') || !!findLabel('Apply'))
	if (valueField) { describePoint('value', valueField) }

	// Type the value and press Apply.
	if (valueField) { await clickAt(valueField); await pump(150) }
	await ready({ type: 'alice' })
	await pump(150)
	print('GTK_PS_TYPED ' + JSON.stringify({ alice: hasText('alice') }))
	// Diag: enumerate 'Apply'-labelled nodes and their ancestor classes.
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.text !== 'Apply' && !(typeof n?.props?.label === 'string' && n.props.label === 'Apply')) { continue }
		const chain: string[] = []
		for (let cur = n; cur; cur = cur.parent) {
			if (cur?.props?.className) { chain.push(String(cur.props.className)) }
		}
		print('GTK_PS_APPLYNODE ' + JSON.stringify({ type: n.type, chain }))
	}
	print('GTK_PS_VALUETEXT ' + JSON.stringify(valueField?.get_text?.() ?? null))
	const apply = findTextInClass('Apply', 'vx-button') ?? findLabel('Apply')
	if (apply) { describePoint('apply', apply); await clickAt(apply); await pump(300) }
	print('GTK_PS_CHANGES ' + JSON.stringify(state.changes))
	check('filter add fires', state.changes.some((c) => c.type === 'add' && c.field === 'name'))
	check('token renders', hasText('alice'))

	// Click the token → editor reopens in edit mode.
	await ready({ key: 'Escape' })
	await pump(250)
	for (let attempt = 0; attempt < 4 && !findLabel('Apply'); attempt++) {
		const token = findTextInClass('alice', 'vx-power-search-token') ?? findLabel('alice')
		if (token) { await clickAt(token) }
		await pump(450)
	}
	check('token press reopens editor', !!findLabel('Apply'))
	await ready({ key: 'Escape' })
	await pump(250)

	// Remove the token via its × affordance.
	const remove = findLabel('Remove filter')
	if (remove) { await clickAt(remove); await pump(250) }
	check('filter remove fires', state.changes.some((c) => c.type === 'remove'))

	// Teardown.
	settle()
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	print('GTK_PS ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	window.destroy()
	loop.quit()
}

run().catch((e) => {
	print('GTK_PS_ERROR ' + String(e && (e.stack || e)))
	window.destroy()
	loop.quit()
})
loop.run()
