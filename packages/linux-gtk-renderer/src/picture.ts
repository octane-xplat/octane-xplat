import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { evaluateCssVariables, type CssHostNode } from '@octane-xplat/css-engine'
import type { ElementNode, GtkView } from './index.js'

let soup: Promise<any> | undefined
function httpBytes(uri: string, cancellable: any): Promise<any> {
	return (soup ??= import('gi://Soup?version=3.0').then(({ default: Soup }) => ({
		Soup,
		session: new Soup.Session({ timeout: 30 }),
	}))).then(
		({ Soup, session }) =>
			new Promise((resolve, reject) => {
				if (cancellable.is_cancelled()) {
					reject(new Error('Cancelled'))
					return
				}
				const message = Soup.Message.new('GET', uri)
				if (!message) {
					reject(new Error('Invalid image URI'))
					return
				}
				session.send_and_read_async(
					message,
					GLib.PRIORITY_DEFAULT,
					cancellable,
					(_session: any, result: any) => {
						try {
							const bytes = session.send_and_read_finish(result)
							const status = message.get_status()
							if (status < 200 || status >= 300) throw new Error('Image HTTP status ' + status)
							resolve(bytes)
						} catch (error) {
							reject(error)
						}
					},
				)
			}),
	)
}

function dataBytes(body: string): Uint8Array {
	const raw = new TextEncoder().encode(body)
	const bytes: number[] = []
	for (let i = 0; i < raw.length; i++) {
		if (raw[i] !== 37) {
			bytes.push(raw[i])
			continue
		}
		const pair = String.fromCharCode(raw[i + 1] ?? 0, raw[i + 2] ?? 0)
		if (!/^[0-9a-f]{2}$/i.test(pair)) throw new Error('Invalid image data URI escape')
		bytes.push(Number.parseInt(pair, 16))
		i += 2
	}
	return new Uint8Array(bytes)
}

async function sourceBytes(source: string, cancellable: any, bundleUrl: string): Promise<any> {
	if (/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(source))
		return new GLib.Bytes(new TextEncoder().encode(source))
	if (source.startsWith('data:')) {
		const comma = source.indexOf(',')
		if (comma < 0) throw new Error('Invalid image data URI')
		const header = source.slice(0, comma)
		const body = source.slice(comma + 1)
		return new GLib.Bytes(/;base64$/i.test(header) ? GLib.base64_decode(body) : dataBytes(body))
	}
	if (/^https?:\/\//i.test(source)) return httpBytes(source, cancellable)
	let file: any
	if (source.startsWith('~/')) {
		file = Gio.File.new_for_uri(bundleUrl).get_parent().resolve_relative_path(source.slice(2))
	} else if (source.startsWith('res://')) {
		file = Gio.File.new_for_uri('resource:///' + source.slice(6).replace(/^\/+/, ''))
	} else if (/^[a-z][a-z0-9+.-]*:/i.test(source)) {
		file = Gio.File.new_for_uri(source)
	} else {
		file = Gio.File.new_for_path(source)
	}
	return new Promise((resolve, reject) => {
		file.load_bytes_async(cancellable, (loaded: any, result: any) => {
			try {
				resolve(loaded.load_bytes_finish(result)[0])
			} catch (error) {
				reject(error)
			}
		})
	})
}

/** Own a picture's asynchronous source, including cancellation and SVG tint.
 * No DOM or process-wide fetch polyfill is needed by a GTK image leaf. */
export function bindPicture(node: ElementNode, bundleUrl: string) {
	const view = node.view as GtkView
	let disposed = false
	let generation = 0
	let source: unknown
	let cancellable: any
	let markup: string | null = null
	let rendered: string | null = null
	const renderSvg = () => {
		if (!markup || disposed) return
		const color = String(node.computedStyle?.color ?? '#000000')
		const resolved = evaluateCssVariables(node as unknown as CssHostNode, markup).replace(
			/currentColor\b/gi,
			color,
		)
		if (resolved === rendered) return
		const texture = Gdk.Texture.new_from_bytes(new GLib.Bytes(new TextEncoder().encode(resolved)))
		view.set_paintable(texture)
		view.imageSource = texture
		rendered = resolved
	}
	const setSource = (next: unknown) => {
		if (disposed || next === source) return
		source = next
		const version = ++generation
		cancellable?.cancel()
		cancellable = new Gio.Cancellable()
		markup = rendered = null
		view.set_paintable(null)
		view.imageSource = null
		view.imageError = null
		view.isLoading = next != null && next !== ''
		if (!view.isLoading) return
		const cancellation = cancellable
		Promise.resolve(next)
			.then((value) => {
				if (disposed || version !== generation) return null
				if (typeof value !== 'string') throw new Error('Image source must be a string')
				return sourceBytes(value, cancellation, bundleUrl)
			})
			.then((bytes) => {
				if (!bytes || disposed || version !== generation) return
				const text = new TextDecoder().decode(bytes.get_data())
				if (/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/i.test(text)) {
					markup = text
					renderSvg()
				} else {
					const texture = Gdk.Texture.new_from_bytes(bytes)
					view.set_paintable(texture)
					view.imageSource = texture
				}
				view.isLoading = false
				view.queue_resize()
			})
			.catch((error) => {
				if (disposed || version !== generation) return
				view.isLoading = false
				view.imageError = error
				console.warn('[linux-gtk] image source could not be loaded')
			})
	}
	return {
		setSource,
		restyle: renderSvg,
		setStretch(value: unknown) {
			const modes: Record<string, number> = {
				aspectFit: Gtk.ContentFit.CONTAIN,
				aspectFill: Gtk.ContentFit.COVER,
				fill: Gtk.ContentFit.FILL,
			}
			const fit = modes[String(value)]
			if (fit === undefined)
				throw new Error('linux-gtk picture: unsupported stretch ' + String(value))
			view.set_content_fit(fit)
		},
		dispose() {
			disposed = true
			generation++
			cancellable?.cancel()
			markup = rendered = null
			view.set_paintable(null)
			view.imageSource = null
			view.isLoading = false
		},
	}
}
