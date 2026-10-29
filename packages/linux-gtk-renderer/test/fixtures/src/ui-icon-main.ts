import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import { createGtkRoot, registerStylesheet } from '@octane-xplat/linux-gtk'
import { Icons, left } from './ui-icon.gtk'
Gtk.init()
Gio.resources_register(Gio.Resource.load(GLib.getenv('GTK_ICON_RESOURCE')!))
const window = new Gtk.Window({ default_width: 320, default_height: 360 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 100) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) {
		throw new Error(name)
	}
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const picture = (id: string) => node(id).view!
const loaded = async (id: string) => {
	for (let i = 0; i < 100 && picture(id).isLoading; i++) {
		await pause(30)
	}
	check(
		id + ' loaded: ' + String(picture(id).imageError?.message ?? ''),
		!picture(id).isLoading && !!picture(id).get_paintable(),
	)
}
const svg = (width: number, height: number) =>
	'<svg xmlns="http://www.w3.org/2000/svg" width="' +
	width +
	'" height="' +
	height +
	'"><path fill="currentColor" d="M0 0h' +
	width +
	'v' +
	height +
	'H0z"/></svg>'
const remote = GLib.getenv('GTK_ICON_HTTP')!
let version = 1
let source: any = svg(12, 8)
let showRaw = true
let dropRaw = false
const render = () => root.render(Icons, { version, remote, source, showRaw, dropRaw })
async function run() {
	render()
	window.present()
	await pause(250)
	await loaded('builtin')
	await loaded('scoped')
	await loaded('override')
	await loaded('remote-icon')
	await loaded('raw-picture')
	const builtin = picture('builtin')
	check('SVG uses real Gtk.Picture', builtin instanceof Gtk.Picture)
	check(
		'declared icon size reaches border box',
		Math.abs(builtin.getActualSize().width - 20) < 1 &&
			Math.abs(builtin.getActualSize().height - 20) < 1,
	)
	check(
		'scoped glyph aspect ratio',
		picture('scoped').get_paintable().get_intrinsic_width() === 12 &&
			picture('scoped').get_paintable().get_intrinsic_height() === 8,
	)
	check(
		'icon accessible label stored',
		Gtk.test_accessible_has_property(picture('scoped'), Gtk.AccessibleProperty.LABEL),
	)
	check(
		'decorative icon hidden state stored',
		Gtk.test_accessible_has_state(builtin, Gtk.AccessibleState.HIDDEN),
	)
	check(
		'text/font fallbacks use native labels',
		picture('text-icon').get_label() === '✓' && picture('font-icon').get_label() === '+',
	)
	check('missing registry name renders nothing', !node('missing-icon'))
	const firstTexture = builtin.get_paintable()
	version = 2
	render()
	await pause(180)
	await loaded('builtin')
	await loaded('scoped')
	check('updates retain widget identity', builtin === picture('builtin'))
	check('icon source updates replace paintable', builtin.get_paintable() !== firstTexture)
	check('updated icon size reaches allocation', Math.abs(builtin.getActualSize().width - 32) < 1)
	check(
		'provider switch changes glyph source',
		picture('scoped').get_paintable().get_intrinsic_width() === 8 &&
			picture('scoped').get_paintable().get_intrinsic_height() === 12,
	)
	check(
		'explicit registry overrides provider',
		picture('override').get_paintable().get_intrinsic_width() === 12,
	)
	const themedTexture = builtin.get_paintable()
	registerStylesheet('icon-theme-test', '#icons-root { color: #ff00ff; }')
	await pause()
	check('authored inline color retains priority', builtin.get_paintable() === themedTexture)
	const scopedTexture = picture('scoped').get_paintable()
	registerStylesheet('icon-accent-test', ':root { --color-accent: #abcdef; }')
	await pause()
	check(
		'custom-property tint restyles picture: ' +
			node('scoped').computedCustomProps?.get('--color-accent'),
		picture('scoped').get_paintable() !== scopedTexture,
	)
	const inheritedTexture = builtin.get_paintable()
	registerStylesheet('icon-current-color-test', '#builtin { color: #aa0000; }')
	check(
		'currentColor follows cascade without a source write',
		node('builtin').computedStyle?.color === '#aa0000' &&
			builtin.get_paintable() !== inheritedTexture,
	)
	left.registerIcon('svg-data', { src: 'data:image/svg+xml,' + encodeURIComponent(svg(9, 7)) })
	// Exercise the intrinsic's URI grammar and asynchronous ownership directly.
	const raw = picture('raw-picture')
	source = 'data:image/svg+xml;base64,' + GLib.base64_encode(new TextEncoder().encode(svg(15, 10)))
	render()
	await pause()
	await loaded('raw-picture')
	check('base64 SVG decoded without atob', raw.get_paintable().get_intrinsic_width() === 15)
	source = 'data:image/svg+xml,' + encodeURIComponent(svg(18, 11))
	render()
	await pause()
	await loaded('raw-picture')
	check('percent encoded SVG decoded', raw.get_paintable().get_intrinsic_width() === 18)
	for (const path of [
		GLib.getenv('GTK_ICON_FILE')!,
		Gio.File.new_for_path(GLib.getenv('GTK_ICON_FILE')!).get_uri(),
		'~/fixture-icon.svg',
		'res://icons/fixture-icon.svg',
	]) {
		source = path
		render()
		await pause()
		await loaded('raw-picture')
		check(
			'file, bundle and GResource source dimensions: ' + path,
			raw.get_paintable().get_intrinsic_width() === 13,
		)
	}
	// A one-pixel fixture is decoded for dimensions only; no pixel inspection.
	source =
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII='
	render()
	await pause()
	await loaded('raw-picture')
	check(
		'raster source uses the same native picture',
		raw.get_paintable().get_intrinsic_width() === 1 &&
			raw.get_paintable().get_intrinsic_height() === 1,
	)
	source = remote + '/slow.svg'
	render()
	await pause(20)
	source = svg(7, 5)
	render()
	await pause(350)
	check(
		'late HTTP response cannot replace newer source',
		raw.get_paintable().get_intrinsic_width() === 7,
	)
	let finish: (value: string) => void = () => {}
	source = new Promise<string>((resolve) => {
		finish = resolve
	})
	render()
	await pause(30)
	source = svg(6, 4)
	render()
	await pause()
	finish(svg(30, 20))
	await pause()
	check(
		'late promised source cannot replace newer source',
		raw.get_paintable().get_intrinsic_width() === 6,
	)
	dropRaw = true
	render()
	await pause()
	check(
		'dropping src clears texture and loading state',
		raw.get_paintable() === null && raw.imageSource === null && raw.isLoading === false,
	)
	dropRaw = false
	source = remote + '/missing.svg'
	render()
	for (let i = 0; i < 100 && raw.isLoading; i++) {
		await pause(30)
	}
	check(
		'HTTP failure reaches explicit error state',
		raw.get_paintable() === null && raw.imageError != null && !raw.isLoading,
	)
	source = svg(8, 6)
	render()
	await pause()
	await loaded('raw-picture')
	check('new source clears prior load failure', raw.imageError === null)
	source = remote + '/slow.svg'
	render()
	await pause(20)
	showRaw = false
	render()
	await pause(350)
	check(
		'disposed picture cancels pending load',
		raw.get_paintable() === null && raw.imageSource === null && !raw.isLoading,
	)
	root.unmount()
	await pause()
	check('all widget nodes disposed', container.nodes.size === 0 && builtin.get_paintable() === null)
	print(
		'GTK_UI_ICON ' +
			JSON.stringify({
				checks,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
		printerr(error.stack ?? String(error))
	})
	.finally(() => {
		root.unmount()
		window.destroy()
		loop.quit()
	})
loop.run()
if (failure) {
	throw failure
}
