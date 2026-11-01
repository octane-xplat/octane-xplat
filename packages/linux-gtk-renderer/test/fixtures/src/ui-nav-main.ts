import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { NavProbe, events, initNav, seedRoute, state } from './ui-nav.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const osInput = GLib.getenv('GTK_NAV_OS') === '1'

const window = new Gtk.Window({ title: 'Octane GTK Nav test', default_width: 640, default_height: 560, decorated: false })
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

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_NAV_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const clickAt = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y })
	await pump(200)
}

// Record external-URI requests at the bridge seam — the seam itself is
// Gtk.show_uri_full; the request reaching it is the evidence (Xvfb has no
// browser to prove the OS-side open).
const hostBridge = (globalThis as any).__octaneGtkHost
const openedUris: string[] = []
if (hostBridge) { hostBridge.openUri = (uri: string) => { openedUris.push(String(uri)); return true } }

async function run() {
	await initNav()
	root.render(NavProbe, {})
	await pump(50)
	window.present()
	await pump(200)
	// The pane host starts with no history entry — navigate after the outlet
	// mounts so the commit lands on the live subscription.
	const seedResult = await seedRoute()
	state.seedStatus = (seedResult as any)?.status ?? 'none'
	await pump(300)

	check('Screen mounts', !!findView('screen'))
	check('NavigationMenu renders', !!findView('navmenu'))
	check('NavIcon mounts', !!findView('navicon'))
	check('route outlet shows initial route', hasText('HOME ROUTE'))
	check('route href reports /', state.route === '/')
	if (!hasText('HOME ROUTE') || state.route !== '/') {
		failures.push('DBG seed events=' + JSON.stringify(events.slice(0, 6)) + ' route=' + String(state.route))
	}
	check('TabList mounts', !!findView('tl'))
	check('Tabs mounts', !!findView('tabs'))
	check('first pane visible', hasText('PANE A'))
	check('second pane mounted hidden', hasText('SECOND PANE'))

	const tabB = findView('tab-b')
	check('Beta tab view', !!tabB)
	if (tabB) {
		await clickAt(tabB)
		check('Beta selects on click', events.includes('strip:b') && state.strip === 'b')
	}

	const tm = findView('tabmenu')
	check('TabMenu trigger', !!tm)
	if (tm) {
		await clickAt(tm)
		check('TabMenu popover opens', hasText('Gamma'))
		const gamma = findLabel('Gamma')
		check('Gamma row found', !!gamma)
		if (gamma) {
			await clickAt(gamma)
			check('TabMenu pick selects', events.includes('strip:c') && state.strip === 'c')
		}
	}

	// Pane A is visible: bump its counter, then switch to Second and back.
	const inc = findView('paneA-inc')
	check('pane A increment view', !!inc)
	if (inc) {
		await clickAt(inc)
		check('pane A counter increments', state.paneACount === 1)
	}
	const second = findLabel('Second')
	check('Second tab found', !!second)
	if (second) {
		await clickAt(second)
		check('Tabs onSelectionChange fires', events.includes('tabsel:b'))
	}
	const first = findLabel('First')
	if (first) {
		await clickAt(first)
		check('switch back to First', events.includes('tabsel:a'))
		check('pane A state retained across tab switch', state.paneACount === 1)
	}

	const docsItem = findLabel('Docs')
	check('nav Docs item found', !!docsItem)
	if (docsItem) {
		await clickAt(docsItem)
		await pump(250)
		check('menu Docs navigates route', hasText('DOCS ROUTE') && state.route === '/docs')
		// Retention contract: the covered entry's logical nodes stay mounted
		// but own no visible views — nothing labeled HOME ROUTE may render.
		let homeVisible = false
		for (const n of (container as any).nodes.values()) {
			try {
				if (JSON.stringify(n.props).includes('HOME ROUTE')) {
					let cur = n
					while (cur && !cur.view) { cur = cur.parent }
					if (!cur?.view) { continue }
					// Any invisible ancestor (the RoutePane wrapper) means hidden;
					// children keep visible=true under a hidden parent on GTK.
					let anyHidden = false
					for (let w = cur.view; w; w = w.get_parent?.()) {
						if (w.visible === false || w.get_visible?.() === false) { anyHidden = true; break }
					}
					if (!anyHidden) { homeVisible = true }
				}
			} catch { }
		}
		check('home pane hidden under docs', !homeVisible)
	}
	check('NavLink mounts', !!findView('nlto'))
	const nlext = findLabel('External')
	check('external item found', !!nlext)
	if (nlext) {
		await clickAt(nlext)
		check('external href reaches openUri seam', openedUris.includes('https://example.com/x'))
	}
	const homeItem = findLabel('Home')
	if (homeItem) {
		await clickAt(homeItem)
		await pump(250)
		check('menu Home navigates back', hasText('HOME ROUTE') && state.route === '/')
	}

	root.unmount()
	await pump(100)
	check('teardown releases nodes', (container as any).nodes.size === 0)
}

let failure: unknown
run()
	.catch((error) => {
		failure = error
		printerr(error.stack ?? String(error))
	})
	.finally(() => {
		print(
			'GTK_NAV ' +
				JSON.stringify({
					checks: checks.length,
					failures,
					osInput,
					gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
				}),
		)
		try { root.unmount() } catch { }
		window.destroy()
		loop.quit()
	})
loop.run()
if (failure) {
	throw failure
}
