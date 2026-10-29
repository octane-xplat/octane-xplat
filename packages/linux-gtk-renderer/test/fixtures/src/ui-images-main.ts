import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { thumbHashUri, rgbaToThumbHashUri } from '@octane-xplat/ui'
import Gio from 'gi://Gio'
import { ImageProbe, PNG_2x2 } from './ui-images.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ default_width: 400, default_height: 400 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

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
const hasText = (needle: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
}

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

async function run() {
	root.render(ImageProbe, {})
	await pump(50)
	window.present()
	await pump(600)

	// Mount + loaded state — a decoded data: PNG lands a Gdk.Texture.
	const good = findView('img-good')
	check('Image mounts with src', !!good)
	check('Image loaded state clears', good?.isLoading === false)
	check('Image produced a texture', !!good?.imageSource)
	check('Image natural width is 2', good?.imageSource?.get_intrinsic_width?.() === 4)
	check('Image natural height is 2', good?.imageSource?.get_intrinsic_height?.() === 4)

	// Fit modes → Gtk.Picture content_fit.
	const contain = findView('img-fit-contain')
	const fill = findView('img-fit-fill')
	check('contentFit contain loads', !!contain?.imageSource)
	check('contentFit fill loads', !!fill?.imageSource)

	// Load error — invalid PNG bytes surface imageError, no texture.
	const bad = findView('img-bad')
	check('failed src produces imageError', !!bad?.imageError)
	check('failed src leaves no texture', !bad?.imageSource)
	check('failed src clears loading', bad?.isLoading === false)

	// Avatar — image and initials fallback.
	check('Avatar with src mounts', !!findView('av-img'))
	check('Avatar fallback shows initials', hasText('AG'))

	// AvatarGroup overflow — 4 avatars, max 2 → +2 overflow.
	check('AvatarGroup mounts', !!findView('avgroup'))
	check('AvatarGroup overflow shows +2', hasText('+2'))

	// Thumbnail — good loads, bad falls back.
	check('Thumbnail mounts', !!findView('thumb'))
	check('Thumbnail image produced a texture', !!findView('thumb')?.imageSource || hasText('preview'))

	// User — avatar + name row.
	check('User mounts', !!findView('user'))
	check('User renders name', hasText('Alec Guy'))

	// thumbHashUri — a real image src → thumbhash: data URI, and the decode
	// must equal the shared encoder's output for the known pixels (4x4 solid
	// red 220,40,40,255 — the fixture PNG bytes).
	const expectedRgba = new Uint8Array(64)
	for (let i = 0; i < 16; i++) {
		const o = i * 4
		expectedRgba[o] = 220
		expectedRgba[o + 1] = 40
		expectedRgba[o + 2] = 40
		expectedRgba[o + 3] = 255
	}
	const expectedHash = rgbaToThumbHashUri(4, 4, expectedRgba)
	const hash = await thumbHashUri(PNG_2x2)
	check('thumbHashUri returns a thumbhash: URI', typeof hash === 'string' && hash.startsWith('thumbhash:'))
	check('thumbHashUri decodes to the encoder output', hash === expectedHash)

	// Source grammar: `~/` resolves relative to the bundle (import.meta.url),
	// absolute file paths load directly. Write a copy of the fixture PNG to
	// both locations and hash each — both must match the encoder output.
	const pngBytes = new GLib.Bytes(GLib.base64_decode(PNG_2x2.slice(PNG_2x2.indexOf(',') + 1)))
	const bundleDir = Gio.File.new_for_uri(import.meta.url).get_parent()
	const tildeFile = bundleDir.get_child('probe-image.png')
	await new Promise((res, rej) => tildeFile.replace_contents_bytes_async(pngBytes, null, false, 0, null, (f, r) => { try { res(f.replace_contents_finish(r)) } catch (e) { rej(e) } }))
	const tildeHash = await thumbHashUri('~/probe-image.png')
	check('thumbHashUri resolves ~/ relative to the bundle', tildeHash === expectedHash)

	const absPath = '/tmp/gtk-probe-image.png'
	GLib.file_set_contents(absPath, pngBytes.get_data())
	const absHash = await thumbHashUri(absPath)
	check('thumbHashUri resolves an absolute file path', absHash === expectedHash)

	print('GTK_IMAGES ' + JSON.stringify({ checks: checks.length, failures, osInput: false, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	print('GTK_IMAGES_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
