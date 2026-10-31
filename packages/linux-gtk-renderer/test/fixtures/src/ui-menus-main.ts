import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { MenuProbe, SheetProbe } from './ui-menus.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Menus test', default_width: 640, default_height: 480, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

// Real-input protocol — the Node driver sends actions over stdin; this runs
// inside GJS and reports where each widget sits in absolute screen coords.
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

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_MENUS_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
// F12 ack from the Node driver after a real input action.
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

async function run() {
	root.render(MenuProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	check('DropdownMenu mounts', !!findView('dd'))
	check('trigger button renders', hasText('Open menu'))
	check('ContextMenu mounts', !!findView('ctx'))
	check('MoreMenu mounts', !!findView('more'))

	// Open the dropdown via the Node driver's real click on the trigger.
	const t = point(findView('dd'))
	await ready({ x: t.x, y: t.y })
	await pump(250)
	check('DropdownMenu opens on press', hasText('Rename') || hasText('Duplicate'))

	// Pick the first item with a real click.
	// Find the Rename row's widget by walking open-menu nodes.
	// Text folds into #text props — walk up to the view-bearing ancestor row.
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
	const clickAt = async (widget: any) => {
		const c = point(widget)
		await ready({ x: c.x, y: c.y })
	}
	let renameView = findLabel('Rename')
	check('menu items render while open', !!renameView)
	check('checkbox item renders', !!findLabel('Show hidden'))
	check('radio group renders', !!findLabel('By name'))
	check('submenu renders', !!findLabel('Submenu group'))
	check('section renders', !!findLabel('Section header'))
	check('section item renders', !!findLabel('Section action'))
	check('disabled item renders', !!findLabel('Disabled action'))
	check('link item renders', !!findLabel('Docs link'))

	// Submenu: click the row, then click its item — fires and closes the menu.
	const subRow = findLabel('Submenu group')
	if (subRow) {
		await clickAt(subRow)
		await pump(250)
	}
	const subItem = findLabel('Sub action')
	check('submenu opens on press', !!subItem)
	if (subItem) {
		await clickAt(subItem)
		await pump(200)
		check('submenu item select fires', hasText('sub'))
		check('submenu select closes the whole menu', !findLabel('Rename'))
	}

	// Reopen and pick the link item.
	await clickAt(findView('dd'))
	await pump(250)
	const linkRow = findLabel('Docs link')
	if (linkRow) { await clickAt(linkRow); await pump(200) }
	check('link item select fires', hasText('link'))

	// Reopen, pick the first item — fires and closes.
	await clickAt(findView('dd'))
	await pump(250)
	renameView = findLabel('Rename')
	if (renameView) {
		await clickAt(renameView)
		await pump(200)
		check('item select records pick', hasText('rename'))
		check('menu closes after select', !findLabel('Duplicate'))
	}

	// Checkbox items keep the menu open (hasCloseOnSelect default), so only
	// click the trigger when the menu is actually closed.
	const ensureMenuOpen = async () => {
		if (!findLabel('Rename')) { await clickAt(findView('dd')); await pump(250) }
	}
	await ensureMenuOpen()
	const cb = findLabel('Show hidden')
	if (cb) { await clickAt(cb); await pump(200) }
	check('checkbox item select fires', hasText('cb'))
	check('menu stays open after checkbox', !!findLabel('Duplicate'))

	// Radio rows close on select by default.
	await ensureMenuOpen()
	const radio = findLabel('By date')
	if (radio) { await clickAt(radio); await pump(200) }
	check('radio option select fires', hasText('radio:date'))

	// A disabled item must not fire its select.
	await ensureMenuOpen()
	const dis = findLabel('Disabled action')
	if (dis) { await clickAt(dis); await pump(200) }
	check('disabled item does not select', !hasText('pick:noop'))
	await ready({ key: 'Escape' })
	await pump(200)
	check('Escape dismisses DropdownMenu', !findLabel('Rename'))
	check('focus returns to trigger after close', !!findView('dd')?.has_focus)

	// Keyboard activation — focused trigger opens the menu on Return.
	findView('dd')?.grab_focus()
	await pump(100)
	await ready({ key: 'Return' })
	await pump(250)
	check('keyboard Enter opens DropdownMenu', !!findLabel('Rename'))
	await ready({ key: 'Escape' })
	await pump(150)

	// Long-press the ContextMenu anchor — a real press-and-hold opens the menu.
	const anchor = point(findView('ctx-anchor'))
	await ready({ x: anchor.x, y: anchor.y, hold: true, holdMs: 900 })
	await pump(300)
	check('ContextMenu opens on long-press', hasText('Rename') || hasText('Duplicate'))

	// Outside-click dismisses (point at the trigger zone far below the popup).
	const corner = point(findView('picked'))
	await ready({ x: corner.x, y: corner.y })
	await pump(200)
	check('outside click dismisses ContextMenu', !findLabel('Duplicate'))

	// A disabled ContextMenu must not open on long-press.
	const offAnchor = point(findView('ctx-off-anchor'))
	await ready({ x: offAnchor.x, y: offAnchor.y, hold: true, holdMs: 900 })
	await pump(300)
	check('disabled ContextMenu stays closed on long-press', !findLabel('Rename'))

	// MoreMenu opens its anchored list from the icon-only trigger.
	const more = findView('more')
	if (more) { await clickAt(more); await pump(250) }
	check('MoreMenu opens on press', !!findLabel('More action'))
	await ready({ key: 'Escape' })
	await pump(150)

	// 'adaptive' resolves to a popover on fine-pointer GTK — it opens.
	const adaptive = findView('more-adaptive')
	if (adaptive) { await clickAt(adaptive); await pump(250) }
	check('adaptive presentation opens a popover', !!findLabel('Adaptive action'))
	await ready({ key: 'Escape' })
	await pump(150)

	// presentation="bottom-sheet" renders the menu in a real BottomSheet.
	root.render(SheetProbe, {})
	await pump(150)
	const sheetTrigger = findView('sheet')
	await clickAt(sheetTrigger)
	await pump(350)
	check('bottom-sheet presentation opens a sheet', !!findLabel('SheetMenuAction'))
	check('bottom-sheet presentation uses an overlay layer', ((container as any).overlayLayers?.size ?? 0) >= 1)
	await ready({ key: 'Escape' })
	await pump(250)
	check('bottom-sheet menu closes on Escape', !findLabel('SheetMenuAction'))

	// Teardown — unmounting releases every node and returns chrome refcounts.
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)
	check('unmount returns popover chrome refcount', ((container as any).popoverChromeUsers?.() ?? 0) === 0)

	print('GTK_MENUS ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	print('GTK_MENUS_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
