import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { OverlaysProbe } from './ui-overlays.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Overlays test', default_width: 640, default_height: 480, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const findText = (text: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(text)) { continue }
			// Text nodes are often viewless — climb to the nearest view-bearing
			// ancestor so the click lands on the owning control.
			for (let cur: any = n; cur; cur = cur.parent) {
				const v = cur.view
				if (v && typeof v.compute_bounds === 'function') { return v }
			}
		} catch { }
	}
	return null
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
const point = (widget: any): { x: number; y: number } => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds for ' + (widget?.id ?? widget?.props?.id ?? JSON.stringify(widget && Object.keys(widget).slice(0,6)))) }
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

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_OVERLAYS_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const clickAt = async (widget: any) => { const c = point(widget); await ready({ x: c.x, y: c.y }) }
const overlayChildren = () => ((container as any).overlayLayers?.size ?? 0)

async function run() {
	root.render(OverlaysProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	// Uncontrolled — opens on defaultOpen; its scrim claims outside presses
	// and dismisses when allowed.
	check('uncontrolled dialog opens on defaultOpen', !!findLabel('Uncontrolled dialog'))
	check('overlay layer added', overlayChildren() > 0)
	// The modal scrim claims the outside press — the background counter does
	// not advance — and a dismissable dialog closes on the scrim press.
	await clickAt(findView('bg'))
	await pump(250)
	check('scrim claims outside click', hasText('bg-count', '0'))
	check('scrim press dismisses dialog', !findLabel('Uncontrolled dialog'))

	// Controlled dialog — isOpen drives open/close.
	await clickAt(findView('ctl-toggle'))
	await pump(250)
	check('controlled dialog opens', !!findLabel('Controlled dialog'))
	await clickAt(findView('ctl-toggle'))
	await pump(250)
	check('controlled dialog closes', !findLabel('Controlled dialog'))

	// Escape closes a dialog.
	await clickAt(findView('ctl-toggle'))
	await pump(250)
	check('dialog reopened for Escape', !!findLabel('Controlled dialog'))
	await ready({ key: 'Escape' })
	await pump(200)
	check('Escape closes dialog', !findLabel('Controlled dialog'))

	// Shaded overlay — scrim press dismisses (open=uncontrolled + onDismiss).
	await clickAt(findView('ov-trigger'))
	await pump(250)
	check('shaded overlay opens', !!findLabel('Shaded overlay'))
	await clickAt(findView('bg'))
	await pump(250)
	check('shaded overlay scrim dismisses', !findLabel('Shaded overlay'))

	// Imperative — show() mounts the hook-owned element; no declaring node.
	await clickAt(findView('imp-trigger'))
	await pump(300)
	check('imperative dialog opens', !!findLabel('Imperative dialog'))
	check('imperative show resolves', !!findLabel('imp:shown'))
	await clickAt(findView('bg'))
	await pump(250)
	check('imperative dialog scrim closes', !findLabel('Imperative dialog'))

	// AlertDialog — declarative API resolves onAction on the action button.
	await clickAt(findView('alert-trigger'))
	await pump(300)
	check('AlertDialog opens', !!findLabel('Alert title') && !!findLabel('Confirm'))
	await clickAt(findText('Confirm'))
	await pump(250)
	check('AlertDialog action resolves', !!findLabel('action:ok'))
	check('AlertDialog closed after action', !findLabel('Alert title'))

	// Imperative AlertDialog — show(options) mounts + onAction resolves.
	await clickAt(findView('ia-trigger'))
	await pump(300)
	check('imperative AlertDialog opens', !!findLabel('Imperative alert'))
	await clickAt(findText('Go'))
	await pump(250)
	check('imperative AlertDialog action resolves', !!findLabel('ia:ok'))

	// LayerContext resolves in the probe.
	check('LayerContext resolves', !!findLabel('ctx:'))

	// FocusScope mounted.
	check('FocusScope mounts', !!findView('fs-btn'))

	// Teardown — overlay children removed, chrome refcount back to 0.
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)
	check('teardown clears overlay layers', overlayChildren() === 0)

	print('GTK_OVERLAYS ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	print('GTK_OVERLAYS_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
