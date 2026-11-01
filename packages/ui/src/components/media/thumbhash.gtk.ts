// thumbHashUri — GTK/GJS leaf. Decodes `src` through GdkPixbuf (the host
// image stack behind the `image` element), scales to ≤100px, extracts RGBA,
// and encodes via the vendored reference port (./hash-image — pure JS).
// GJS modules import gi:// directly; the ambient declarations live in
// type-support/gi.d.ts so the shared typecheck resolves them.
import GdkPixbuf from 'gi://GdkPixbuf'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Soup from 'gi://Soup?version=3.0'
import { rgbaToThumbHashUri, thumbHashTargetSize, unpremultiplyRGBA } from './hash-image'

function dataBytes(body: string): Uint8Array {
	const raw = new TextEncoder().encode(body)
	const bytes: number[] = []
	for (let i = 0; i < raw.length; i++) {
		if (raw[i] !== 37) {
			bytes.push(raw[i])
			continue
		}
		const pair = String.fromCharCode(raw[i + 1] ?? 0, raw[i + 2] ?? 0)
		if (!/^[0-9a-f]{2}$/i.test(pair)) {
			throw new Error('Invalid image data URI escape')
		}
		bytes.push(Number.parseInt(pair, 16))
		i += 2
	}
	return new Uint8Array(bytes)
}

/** `src` → image bytes — mirrors the renderer's `picture.ts` sourceBytes
 *  exactly: SVG markup, data: (base64 and percent-escaped), http(s) via
 *  Soup, `~/` relative to the single-file bundle (import.meta.url, same
 *  base bindPicture receives), `res://` → resource:///, other URIs and
 *  plain file paths through Gio. */
async function sourceBytes(src: string): Promise<any> {
	if (/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(src)) {
		return new GLib.Bytes(new TextEncoder().encode(src))
	}
	if (src.startsWith('data:')) {
		const comma = src.indexOf(',')
		if (comma < 0) {
			throw new Error('Invalid image data URI')
		}
		const header = src.slice(0, comma)
		const body = src.slice(comma + 1)
		return new GLib.Bytes(/;base64$/i.test(header) ? GLib.base64_decode(body) : dataBytes(body))
	}

	if (/^https?:\/\//i.test(src)) {
		const session = new Soup.Session({ timeout: 30 })
		return await new Promise((resolve, reject) => {
			const message = Soup.Message.new('GET', src)
			if (!message) {
				reject(new Error('thumbHashUri: invalid image URI'))
				return
			}
			session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_s: any, result: any) => {
				try {
					const bytes = session.send_and_read_finish(result)
					const status = message.get_status()
					if (status < 200 || status >= 300) {
						reject(new Error('thumbHashUri: HTTP ' + status))
						return
					}
					resolve(bytes)
				} catch (error) {
					reject(error)
				}
			})
		})
	}

	let file: any
	if (src.startsWith('~/')) {
		file = Gio.File.new_for_uri(import.meta.url).get_parent().resolve_relative_path(src.slice(2))
	} else if (src.startsWith('res://')) {
		file = Gio.File.new_for_uri('resource:///' + src.slice(6).replace(/^\/+/, ''))
	} else if (/^[a-z][a-z\d+.-]*:/i.test(src)) {
		file = Gio.File.new_for_uri(src)
	} else {
		file = Gio.File.new_for_path(src)
	}
	return await new Promise((resolve, reject) => {
		file.load_bytes_async(null, (f: any, result: any) => {
			try {
				resolve(f.load_bytes_finish(result)[0])
			} catch (error) {
				reject(error)
			}
		})
	})
}

/** `src` → `thumbhash:<base64>` URI — decode, ≤100px scale, RGBA extract,
 *  encode. Same src grammar as `Image`. Compute at pick/upload time and
 *  store the string beside the image; `Image.placeholder` accepts it. */
export async function thumbHashUri(src: string): Promise<string> {
	const bytes = await sourceBytes(src)
	const stream = Gio.MemoryInputStream.new_from_bytes(bytes)
	let pixbuf: any
	try {
		pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null)
	} catch (error) {
		throw new Error('thumbHashUri: could not decode image source')
	}
	if (!pixbuf || !(pixbuf.get_width() > 0 && pixbuf.get_height() > 0)) {
		throw new Error('thumbHashUri: could not decode image source')
	}

	const [w, h] = thumbHashTargetSize(pixbuf.get_width(), pixbuf.get_height())
	const scaled = pixbuf.scale_simple(w, h, GdkPixbuf.InterpType.BILINEAR)
	const channels = scaled.get_n_channels()
	const stride = scaled.get_rowstride()
	const raw: Uint8Array = scaled.get_pixels()

	// Normalize to straight-alpha RGBA8 rows — Pixbuf rows are unpremultiplied
	// already, but rowstride may pad and non-alpha pixbufs carry 3 channels.
	const rgba = new Uint8Array(w * h * 4)
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const si = y * stride + x * channels
			const di = (y * w + x) * 4
			rgba[di] = raw[si]
			rgba[di + 1] = raw[si + 1]
			rgba[di + 2] = raw[si + 2]
			rgba[di + 3] = channels === 4 ? raw[si + 3] : 255
		}
	}
	unpremultiplyRGBA(rgba)
	return rgbaToThumbHashUri(w, h, rgba)
}
