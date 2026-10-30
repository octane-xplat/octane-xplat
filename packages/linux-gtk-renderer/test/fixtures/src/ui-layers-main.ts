import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { positionPopover } from '../../../../ui/src/popover-position'
import { LayersProbe } from './ui-layers.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Layers test', default_width: 640, default_height: 480, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

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
				// The counter renders as a #text child whose value is the count.
				const probe = (node: any): boolean => {
					if (!node) { return false }
					if (JSON.stringify(node.props).includes(text)) { return true }
					for (const c of node.children ?? []) {
						if (probe(c)) { return true }
					}
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
// Popup surfaces chain-position; match ui-popover's proven coordinate walk.
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
const boundsOf = (widget: any): { left: number; top: number; width: number; height: number } | null => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { return null }
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx
	let y = rect.origin.y - ty
	for (let surface = native.get_surface(); typeof surface.get_parent === 'function'; surface = surface.get_parent()) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	return { left: x + wx, top: y + wy, width: rect.size.width, height: rect.size.height }
}
const near = (a: number, b: number, eps = 2) => Math.abs(a - b) <= eps

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_LAYERS_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const clickAt = async (widget: any) => { const c = point(widget); await ready({ x: c.x, y: c.y }) }

async function run() {
	root.render(LayersProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	// Breadcrumbs.
	check('Breadcrumbs mounts', !!findView('crumbs'))
	check('Breadcrumbs renders current crumb', !!findLabel('Book'))
	check('Breadcrumbs renders link crumbs', !!findLabel('Home') && !!findLabel('Library'))
	check('Breadcrumbs overflow mounts', !!findView('overflow'))

	// usePopover.
	await clickAt(findView('pop-trigger'))
	await pump(250)
	check('usePopover opens on trigger press', !!findLabel('Popover body'))
	check('popover session registered', ((container as any).popoverChromeUsers?.() ?? 0) > 0)
	await ready({ key: 'Escape' })
	await pump(200)
	check('usePopover dismisses on Escape', !findLabel('Popover body'))

	// useLayer context mode — uncontrolled show/hide + geometry per probe.
	for (const [id, placement, alignment] of [
		['geo-bs', 'bottom', 'start'],
		['geo-te', 'top', 'end'],
		['geo-rc', 'right', 'center'],
		['geo-ls', 'left', 'start'],
	] as const) {
		const anchor = findView(id + '-trigger')
		await clickAt(anchor)
		await pump(250)
		const bodyText = 'Context: from-declaring'
		const panel = findLabel(bodyText)
		check('useLayer context opens ' + placement + '/' + alignment, !!panel)
		if (panel && anchor) {
			const a = boundsOf(anchor)
			const b = boundsOf(panel)
			if (a && b) {
				const expected = positionPopover(
					{ left: a.left, top: a.top, width: a.width, height: a.height },
					{ width: b.width, height: b.height },
					{ left: 0, top: 0, width: host.get_width(), height: host.get_height() },
					placement, 8, alignment,
				)
				check('useLayer geometry ' + placement + '/' + alignment,
					near(b.left, expected.left, 6) && near(b.top, expected.top, 6))
			}
		}
		await clickAt(anchor)
		await pump(200)
		check('useLayer closes on hide ' + placement, !findLabel('Context: from-declaring'))
	}
	// Controlled isOpen — the parent toggles it; onShow/onHide fire.
	await clickAt(findView('ctl-toggle'))
	await pump(250)
	check('controlled layer opens on isOpen', !!findLabel('Controlled layer'))
	await clickAt(findView('ctl-toggle'))
	await pump(250)
	check('controlled layer closes on isOpen', !findLabel('Controlled layer'))
	// Context reaches the layer content through the portal.
	await clickAt(findView('geo-bs-trigger'))
	await pump(250)
	check('declaring context reaches layer content', !!findLabel('Context: from-declaring'))
	await clickAt(findView('geo-bs-trigger'))
	await pump(200)

	// lightDismiss true — the popover session CAPTUREs the outside press and
	// claims it (like the mobile backdrop): the layer hides and the background
	// control does NOT receive the tap.
	const lightTrig = findView('layer-light-trigger')
	await clickAt(lightTrig)
	await pump(250)
	check('lightDismiss layer opens', !!findLabel('Context: from-declaring'))
	check('useLayer onShow fires on show()', !!findLabel('layer-light:shown'))
	await clickAt(findView('bg'))
	await pump(250)
	check('lightDismiss true: outside click hides', !findLabel('Context: from-declaring'))
	check('useLayer onHide fires on hide()', !!findLabel('layer-light:hidden'))
	check('lightDismiss true: outside tap is claimed', !!findLabel('lightbg') && hasText('lightbg-count', '0'))

	// lightDismiss false — the outside press is not claimed: the layer stays
	// open and the background control receives the tap.
	const noLightTrig = findView('layer-nolight-trigger')
	await clickAt(noLightTrig)
	await pump(250)
	check('no-lightDismiss layer opens', !!findLabel('Context: from-declaring'))
	await clickAt(findView('bg-nolight'))
	await pump(250)
	check('lightDismiss false: outside click does not hide', !!findLabel('Context: from-declaring'))
	check('lightDismiss false: background receives the tap', !!findLabel('nolightbg') && hasText('nolightbg-count', '1'))
	await clickAt(noLightTrig)
	await pump(200)
	check('no-lightDismiss layer closes on hide', !findLabel('Context: from-declaring'))

	// dismissOnEscape false — Escape does not dismiss.
	const noEscTrig = findView('layer-noesc-trigger')
	await clickAt(noEscTrig)
	await pump(250)
	await ready({ key: 'Escape' })
	await pump(200)
	check('dismissOnEscape false: Escape does not dismiss', !!findLabel('Context: from-declaring'))
	await clickAt(noEscTrig)
	await pump(200)
	check('dismissOnEscape false: layer closes on hide', !findLabel('Context: from-declaring'))

	// Fixed mode at two x/y coordinates — panel bounds asserted.
	for (const [id, fx, fy] of [['layer-fixed', 40, 60], ['layer-fixed2', 300, 200]] as const) {
		await clickAt(findView(id + '-trigger'))
		await pump(250)
		check('fixed layer session at ' + fx + ',' + fy, ((container as any).popoverChromeUsers?.() ?? 0) > 0)
		const body = findView(id + '-body')
		check('fixed layer opens at ' + fx + ',' + fy, !!body)
		if (body) {
			const b = boundsOf(body)
			if (b) {
				check('fixed layer at ' + fx + ',' + fy + ' bounds',
					near(b.left, fx, 6) && near(b.top, fy, 6))
			}
		}
		await clickAt(findView(id + '-trigger'))
		await pump(200)
		check('fixed layer closes ' + id, !findView(id + '-body'))
	}

	// HoverCard — real pointer enter/leave via xdotool motion.
	const hc = findView('hc')
	if (hc) {
		const c = point(hc)
		await ready({ x: c.x, y: c.y, hover: true })
		await pump(60)
		check('HoverCard not open before delay', !findLabel('Card body'))
		await pump(250)
		check('HoverCard opens after hover delay', !!findLabel('Card body'))

		const card = (() => {
			for (const n of (container as any).nodes.values()) {
				try {
					const cls = n.props?.className
					const cs = Array.isArray(cls) ? cls.join(' ') : String(cls ?? '')
					if (n.view && cs.includes('vx-hovercard')) { return n.view }
				} catch { }
			}
			return findLabel('Card body')
		})()
		if (card) {
			const cc = point(card)
			await ready({ x: cc.x, y: cc.y, hover: true })
			await pump(200)
			check('HoverCard stays open over the card', !!findLabel('Card body'))
		}
		const away = point(findView('picked'))
		await ready({ x: away.x, y: away.y, hover: true })
		await pump(60)
		check('HoverCard still open just after leaving', !!findLabel('Card body'))
		await pump(250)
		check('HoverCard hides after leave delay', !findLabel('Card body'))
	}

	// Disabled HoverCard does not open on hover.
	const hcOff = findView('hc-off')
	if (hcOff) {
		const c = point(hcOff)
		await ready({ x: c.x, y: c.y, hover: true })
		await pump(400)
		check('disabled HoverCard does not open on hover', !findLabel('Disabled card'))
	}

	// Teardown.
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)

	print('GTK_LAYERS ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	print('GTK_LAYERS_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
