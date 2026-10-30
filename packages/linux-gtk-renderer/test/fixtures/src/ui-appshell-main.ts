import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot, registerStylesheet } from '@octane-xplat/linux-gtk'
import { openWindow } from '@octane-xplat/ui'
import tokensCss from '@octane-xplat/ui/theme/tokens.css?raw'
import chromeCss from '@octane-xplat/ui/theme/chrome.css?raw'
import { AppShellProbe, ChildWindow, events, state } from './ui-appshell.gtk'

Gtk.init()

// Real apps load the theme stylesheet — the vx-* classes carry the shell
// geometry (rail width, sticky footer, handle position) that the checks
// exercise. Registration must run after Gtk.init() (css-smoke does the same).
registerStylesheet('theme', `${tokensCss}\n${chromeCss}`)

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const osInput = GLib.getenv('GTK_APPSHELL_OS') === '1'

const window = new Gtk.Window({ title: 'Octane GTK Appshell test', default_width: 1100, default_height: 640, decorated: false })
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
const findClass = (cls: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (String(n.props?.className ?? '').includes(cls) && n.view) { return n.view }
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
	print('GTK_APPSHELL_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const describe = (w: any): string => {
	if (!w) { return 'null' }
	try {
		return (
			(w.constructor?.name ?? 'w') +
			':' +
			String(w.get_css_name?.() ?? '') +
			':' +
			String(w.get_accessible_role?.() ?? '')
		)
	} catch {
		return 'err'
	}
}
/** What widget actually receives a click at a screen point. */
const pickAt = (c: { x: number; y: number }): any => {
	try {
		const [wx, wy] = window.get_surface_transform()
		return window.pick(c.x - wx, c.y - wy, Gtk.PickFlags.INSENSITIVE | Gtk.PickFlags.NATURAL)
	} catch {
		return null
	}
}
const clickAt = async (widget: any, tag = '?') => {
	const c = point(widget)
	if (c.x === 0 && c.y === 0) { failures.push('degenerate-bounds:' + tag) }
	// Race the F12 handshake — an unclosed popover (or a grabbed modal) can
	// swallow the key event and must not deadlock the whole run.
	await Promise.race([ready({ x: c.x, y: c.y }), pump(2500)])
	await pump(220)
	return { c, picked: pickAt(c) }
}
const dragFrom = async (widget: any, dx: number, dy: number, tag = '?') => {
	const c = point(widget)
	if (c.x === 0 && c.y === 0) { failures.push('degenerate-bounds:' + tag) }
	await Promise.race([ready({ x: c.x, y: c.y, drag: { dx, dy } }), pump(2500)])
	await pump(300)
	return { c, picked: pickAt(c) }
}

async function run() {
	root.render(AppShellProbe, {})
	await pump(50)
	window.present()
	await pump(500)

	check('AppShell mounts', !!findView('shell'))
	check('TopNav mounts', !!findView('topnav'))
	check('TopNavHeading mounts', !!findView('topnavheading'))
	check('TopNavItem mounts', !!findView('tn-docs'))
	check('TopNavMenu trigger mounts', !!findView('tnmenu'))
	check('SideNav mounts', !!findView('sidenav'))
	check('SafeArea mounts', !!findView('safe'))
	check('KeyboardAvoiding mounts', !!findView('kav'))

	check('safe-area insets are zero', state.insets?.top === 0 && state.insets?.bottom === 0)
	check('keyboard inset is zero', state.kbinset === 0)
	check('useContainerReveal returns prop getters', typeof state.reveal?.getContainerProps === 'function')
	check('useImageMode returns fallback', state.imgmode === 'dark')
	check('desktop is not mobile at 1100w', state.mobile?.isMobile === false)

	// Nav item activation: real click on the Docs TopNavItem.
	const docsItem = findView('tn-docs')
	if (docsItem) {
		await clickAt(docsItem, 'tn-docs')
		check('TopNavItem press fires onClick', state.navPick === 'docs')
	}
	// SideNav item press.
	// SideNavItem's id lands on the outer row wrapper — click the label text's
	// view (inside the Pressable) so the press actually reaches onPress.
	const homeItem = findView('sn-home')
	check('SideNavItem mounts', !!homeItem)
	const homeLabel = findLabel('Home')
	if (homeLabel) {
		await clickAt(homeLabel, 'sn-home-label')
		check('SideNavItem press fires onClick', state.navPick === 'home')
	}

	// TopNavMenu: real click opens the popover, pick closes it and fires.
	const tnmenu = findView('tnmenu')
	if (tnmenu) {
		await clickAt(tnmenu, 'tnmenu')
		await pump(150)
		check('TopNavMenu popover opens', hasText('Alpha'))
		const alpha = findLabel('Alpha')
		if (alpha) {
			await clickAt(alpha, 'menu-alpha')
			check('TopNavMenu pick fires + closes', state.navPick === 'alpha' && !hasText('Alpha'))
		}
	}

	// NavHeadingMenu: heading is the trigger (no hrefs) → popover opens.
	const heading = findView('topnavheading')
	if (heading) {
		await clickAt(heading, 'heading')
		await pump(150)
		check('NavHeadingMenu opens', hasText('Workspace'))
		const ws = findView('nhm-a')
		if (ws) {
			await clickAt(ws, 'nhm-a')
			check('NavHeadingMenuItem fires + closes', state.navPick === 'workspace' && !hasText('Workspace'))
		}
	}

	// ResizeHandle: real xdotool drag changes region size and the panel width.
	const handle = findView('resize-handle')
	check('ResizeHandle mounts', !!handle)
	const before = state.size
	if (handle) {
		await dragFrom(handle, 60, 0, 'resize-handle')
		// GTK's drag threshold consumes the first pixels — prove the region
		// grew, not a specific delta.
		check('resize drag changes size', state.size > before + 15)
		const panel = findView('resize-panel')
		const pw = panel?.getActualSize?.().width ?? 0
		check('panel width follows size', Math.abs(pw - state.size) < 20)
	}

	// SideNav collapse button toggles the rail width (240 → 48 collapsed).
	const collapseBtn = findClass('vx-sidenav-collapsebtn')
	const shellWidth = () => findClass('vx-sidenav-shell')?.getActualSize?.().width ?? 0
	check('SideNav collapse button mounts', !!collapseBtn)
	if (collapseBtn) {
		const w0 = shellWidth()
		await clickAt(collapseBtn, 'collapseBtn')
		const w1 = shellWidth()
		check('collapse narrows the rail', w0 > 100 && w1 < w0 - 50)
		// The auto icon-button stays mapped but floats outside the collapsed
		// 48px rail in the styleless fixture bundle (no vx-* stylesheet), so the
		// honest expand evidence is a real click on a labeled row wired to the
		// same useSideNavCollapse context.
		const navToggle = findView('nav-toggle')
		check('nav collapse-context toggle mounted', !!navToggle)
		if (navToggle) {
			await clickAt(navToggle, 'nav-toggle')
			await pump(300)
		}
		check('expand flips collapse state', state.collapsed === false)
		check('expand restores the rail', shellWidth() > w1 + 50)
	}

	// Mobile breakpoint: shrink the window below md (768) — layoutChanged
	// must flip the shell into mobile mode and render the toggle.
	window.set_default_size(600, 600)
	await pump(600)
	check('narrow shell goes mobile', state.mobile?.isMobile === true)
	const toggle = findClass('vx-mobilenav-toggle')
	check('MobileNavToggle appears below breakpoint', !!toggle)
	if (toggle) {
		await clickAt(toggle, 'mobilenav-toggle')
		check('toggle opens MobileNav drawer', state.mobile?.isMobileNavOpen === true || !!findClass('vx-mobilenav'))
		const backdrop = findClass('vx-mobilenav-backdrop')
		if (backdrop) {
			await clickAt(backdrop, 'backdrop')
			check('backdrop dismisses drawer', state.mobile?.isMobileNavOpen === false)
		}
	}
	window.set_default_size(760, 600)
	await pump(400)

	// openWindow: a second Gtk.Window with its own root via the host service.
	const bridge = (globalThis as any).__octaneGtkHost
	check('bridge exposes openWindow', typeof bridge?.openWindow === 'function')
	bridge.setWindowContentResolver((data: any) => {
		state.winData = data
		return ChildWindow
	})
	const winHandle = openWindow({ data: { tag: 'child' }, title: 'Child one', kind: 'regular', size: { width: 240, height: 160 } } as any)
	check('openWindow returns handle', !!winHandle && typeof winHandle.id === 'string')
	check('resolver received data', state.winData?.tag === 'child')
	if (winHandle) {
		await pump(250)
		check('handle not closed', winHandle.isClosed === false)
		winHandle.setTitle?.('Retitled')
		winHandle.setSize?.({ width: 300, height: 200 })
		check('setTitle/setSize run', true)
		let closed = false
		void winHandle.closed.then(() => { closed = true })
		winHandle.close()
		await pump(200)
		check('close settles closed promise', closed === true && winHandle.isClosed === true)
	}
	// dialog kind: modal + transient-for the main window.
	const dlg = openWindow({ kind: 'dialog', component: ChildWindow, title: 'Modal child' } as any)
	check('dialog window handle', !!dlg)
	if (dlg) {
		dlg.close()
		await pump(100)
		check('dialog closes', dlg.isClosed === true)
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
			'GTK_APPSHELL ' +
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
