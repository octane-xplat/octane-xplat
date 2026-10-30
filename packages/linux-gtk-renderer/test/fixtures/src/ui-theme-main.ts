import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	copyText,
	getColorScheme,
	getThemePreference,
	getThemeScheme,
	themeSchemeClasses,
	applyThemeClasses,
} from '@octane-xplat/ui'
import { ThemeProbe } from './ui-theme.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const dbg: string[] = []
const flush = () => {
	try { GLib.file_set_contents('/tmp/gtk-theme-dbg.log', dbg.join('\n')) } catch { }
}
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	dbg.push((ok ? 'PASS ' : 'FAIL ') + name)
	flush()
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Theme test', default_width: 700, default_height: 500, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const settings = Gtk.Settings.get_default()

// Spy on the AT announcement delivery point — the bridge announces on the
// app root's host widget, so a wrapper proves the call reaches a real
// GtkAccessible.announce without needing an AT client.
const announced: Array<[string, any]> = []
const origAnnounce = (host as any).announce?.bind(host)
if (origAnnounce) {
	;(host as any).announce = (message: string, priority: any) => {
		announced.push([message, priority])
		return origAnnounce(message, priority)
	}
}

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const findNode = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n }
	}
	return null
}
/** Label content lives on the text child node, not the element — walk the
 *  logical subtree under the id like the other fixtures do. */
const hasText = (id: string, text: string): boolean => {
	const start = findNode(id)
	if (!start) { return false }
	const probe = (node: any): boolean => {
		if (!node) { return false }
		try {
			if (JSON.stringify(node.props).includes(text)) { return true }
		} catch { }
		for (const c of node.children ?? []) { if (probe(c)) { return true } }
		return false
	}
	return probe(start)
}
const themeScopeNode = (): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (n?.cssClasses?.has?.('xds-theme-probe')) { return n }
		} catch { }
	}
	return null
}
const readClipboard = (): Promise<string | null> => new Promise((resolve) => {
	try {
		Gdk.Display.get_default()?.get_clipboard()?.read_text_async(null, (cb: any, res: any) => {
			try { resolve(cb.read_text_finish(res) ?? null) } catch { resolve(null) }
		})
	} catch {
		resolve(null)
	}
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => { resolve(null); return false })
})

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	dbg.push('READY ' + JSON.stringify(payload))
	flush()
	print('GTK_THEME_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})
const point = (widget: any) => {
	const native = widget?.get_native?.()
	if (!native) { return null }
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { return null }
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
const clickAt = async (widget: any, what?: string) => {
	const p = widget && point(widget)
	if (!p) { dbg.push('MISSING widget ' + String(what)); return }
	await ready(p)
}
const setPreferDark = (value: boolean) => {
	settings.gtk_application_prefer_dark_theme = value
}

async function run() {
	root.render(ThemeProbe, {})
	await pump(50)
	window.present()
	await pump(400)

	// --- Baseline: light system scheme, system preference, landscape 700x500.
	check('system scheme reads light', hasText('system', 'light'))
	check('resolved scheme follows system', hasText('scheme', 'light'))
	check('preference reads system', hasText('pref', 'system'))
	check('getColorScheme matches hook', getColorScheme() === 'light')
	check('getThemeScheme resolves system', getThemeScheme() === 'light')
	check('getThemePreference reads system', getThemePreference() === 'system')
	check('width query false at 700px', hasText('mq-width', 'false'))
	check('landscape orientation matches', hasText('mq-orient', 'true'))
	check('scheme media query false when light', hasText('mq-scheme', 'false'))

	// --- Scoped theme: classes, tokens, and generated CSS reach the cascade.
	check('useThemeName resolves probe theme', hasText('theme-name', 'probe'))
	check('useTheme mode resolves light', hasText('theme-mode', 'light'))
	check('useTheme token resolves light value', hasText('theme-token', '#123456'))
	const scope = themeScopeNode()
	check('theme scope class stamps the subtree root', !!scope)
	check(
		'generated scope rule feeds the cascade',
		scope?.computedStyle?.color === 'rgb(17, 34, 51)',
	)
	const themedText = findNode('theme-primary')
	check(
		'scope color inherits into themed text',
		themedText?.computedStyle?.color === 'rgb(17, 34, 51)',
	)
	check('themeSchemeClasses carries the scope class', themeSchemeClasses().includes('xds-theme-probe'))
	const imperative: { className: string } = { className: '' }
	const unbindTheme = applyThemeClasses(imperative, 'vx-probe-host')
	check(
		'applyThemeClasses stamps base + scope',
		imperative.className.includes('vx-probe-host') && imperative.className.includes('xds-theme-probe'),
	)
	check('applyThemeClasses omits dark while light', !imperative.className.includes('ns-dark'))

	// --- OS scheme flip: Gtk.Settings prefer-dark is the scheme source.
	setPreferDark(true)
	await pump(400)
	check('system scheme flips to dark', hasText('system', 'dark'))
	check('resolved scheme follows OS flip', hasText('scheme', 'dark'))
	check('scheme media query flips', hasText('mq-scheme', 'true'))
	check('onThemeSchemeChange fired on OS flip', !hasText('events', 'ev-0'))
	check('theme token resolves dark value', hasText('theme-token', '#ABCDEF'))
	const darkScope = themeScopeNode()
	check(
		'dark scope rule restamps themed widget',
		darkScope?.computedStyle?.color === 'rgb(221, 238, 255)',
	)
	check(
		'theme view restamps dark classes',
		(darkScope?.cssClasses?.has?.('ns-dark') ?? false) || (darkScope?.cssClasses?.has?.('dark') ?? false),
	)
	check(
		'applyThemeClasses re-stamps dark live',
		imperative.className.includes('ns-dark dark'),
	)

	// --- App preference: explicit light wins over a dark system source.
	await clickAt(findView('pref-light'), 'pref-light')
	await pump(400)
	check('preference reports light', hasText('pref', 'light'))
	setPreferDark(true)
	await pump(400)
	check('system reads dark under explicit light', hasText('system', 'dark'))
	check('explicit preference wins resolution', hasText('scheme', 'light'))
	check('getThemeScheme honors preference', getThemeScheme() === 'light')
	check('getColorScheme stays system', getColorScheme() === 'dark')

	// --- Dark preference pins the app flag and resolves dark.
	await clickAt(findView('pref-dark'), 'pref-dark')
	await pump(400)
	check('preference reports dark', hasText('pref', 'dark'))
	check('resolved scheme is dark', hasText('scheme', 'dark'))
	check('dark preference pins the app flag', settings.gtk_application_prefer_dark_theme === true)

	// --- System preference clears the pin; the OS signal shows through.
	await clickAt(findView('pref-system'), 'pref-system')
	await pump(400)
	check('preference reports system', hasText('pref', 'system'))
	check('pin cleared on system preference', settings.gtk_application_prefer_dark_theme === false)
	check('resolved scheme follows system again', hasText('scheme', 'light'))
	setPreferDark(true)
	await pump(400)
	check('system preference re-follows OS', hasText('scheme', 'dark'))
	setPreferDark(false)
	await pump(400)
	check('system back to light before resize', hasText('system', 'light'))

	// --- Media queries re-evaluate on a real window resize.
	window.set_default_size(420, 700)
	await pump(500)
	check('width query flips at 420px', hasText('mq-width', 'true'))
	check('orientation flips to portrait', hasText('mq-orient', 'false'))
	window.set_default_size(700, 500)
	await pump(500)
	check('width query restores at 700px', hasText('mq-width', 'false'))
	check('orientation restores landscape', hasText('mq-orient', 'true'))

	// --- Clipboard: hook press writes the X11 selection; content reads back.
	await clickAt(findView('clip-btn'), 'clip-btn')
	await pump(400)
	check('clipboard press reports copied', hasText('copied', 'true'))
	check('onCopy reports success', hasText('copy-ok', 'copy-true'))
	const clipText = await readClipboard()
	dbg.push('clip=' + JSON.stringify(clipText))
	check('clipboard round-trips payload', clipText === 'gtk-clip-payload')
	check(
		'copy announcement posted to GtkAccessible',
		announced.some(([m]) => m === 'text copied'),
	)

	// --- copyText direct write + useAnnounce delivery.
	const direct = await copyText('direct-payload')
	check('copyText resolves true', direct === true)
	const directText = await readClipboard()
	check('direct write round-trips', directText === 'direct-payload')
	await clickAt(findView('ann-btn'), 'ann-btn')
	await pump(300)
	check(
		'useAnnounce posts to GtkAccessible.announce',
		announced.some(([m]) => m === 'gtk announcement'),
	)
	dbg.push('announced=' + JSON.stringify(announced))
	check(
		'announcement maps to a real priority',
		announced.some(([m, p]) => m === 'gtk announcement' && typeof p === 'number'),
	)

	// --- Imperative unsubscribe: host stops tracking after unbind.
	const beforeUnbind = imperative.className
	unbindTheme()
	setPreferDark(true)
	await pump(400)
	check('applyThemeClasses unsubscribe stops restamping', imperative.className === beforeUnbind)
	setPreferDark(false)
	await pump(300)

	root.unmount()
	await pump(200)
	check('unmount releases all nodes', container.nodes.size === 0)

	print('GTK_THEME ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((error) => {
	printerr('theme fixture failed', error)
	print('GTK_THEME ' + JSON.stringify({ checks: checks.length, failures: [...failures, 'run crashed'], osInput: true, gtk: '4.14.5' }))
	loop.quit()
})
loop.run()
