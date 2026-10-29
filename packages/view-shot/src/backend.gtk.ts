import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import Graphene from 'gi://Graphene?version=1.0'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { checkDimensions } from './options'
import type { CaptureBackend } from './backend-types'
import type { NormalizedCaptureOptions } from './types'

interface Widget {
	get_mapped(): boolean
	get_width(): number
	get_height(): number
	get_scale_factor(): number
	get_native(): {
		get_renderer(): {
			render_texture(
				node: object,
				bounds: object,
			): { save_to_png_bytes(): { get_data(): Uint8Array } }
		}
	} | null
	get_first_child(): Widget | null
	get_next_sibling(): Widget | null
}
const owned = new Map<
	string,
	{ delete(cancellable: null): boolean; query_exists(cancellable: null): boolean }
>()
function widget(target: object): Widget {
	if (!(target instanceof Gtk.Widget)) {
		throw new TypeError('GTK capture requires a Gtk.Widget host')
	}
	const view = target as Widget
	if (!view.get_mapped() || !view.get_native()) {
		throw new Error('GTK capture target is detached or hidden')
	}
	if (!(view.get_width() > 0 && view.get_height() > 0)) {
		throw new RangeError('GTK capture target has no laid-out area')
	}
	function protectedSurface(child: Widget): boolean {
		if (
			child instanceof Gtk.Video ||
			child instanceof Gtk.GLArea ||
			child.constructor.name.includes('WebKit')
		) {
			return true
		}
		for (let next = child.get_first_child(); next; next = next.get_next_sibling()) {
			if (protectedSurface(next)) {
				return true
			}
		}
		return false
	}
	if (protectedSurface(view)) {
		throw new UnavailabilityError('Web/video/GPU surfaces in GTK capture')
	}
	return view
}
async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
	if (
		options.format !== 'png' ||
		options.fileName !== undefined ||
		options.snapshotContentContainer ||
		options.useRenderInContext ||
		options.handleGLSurfaceViewOnAndroid
	) {
		throw new UnavailabilityError(
			'Requested format/strategy in GTK capture; use PNG with default strategies',
		)
	}
	const view = widget(target)
	const width = options.width ?? view.get_width() * view.get_scale_factor()
	const height = options.height ?? view.get_height() * view.get_scale_factor()
	checkDimensions(width, height)
	const snapshot = new Gtk.Snapshot()
	const paintable = new Gtk.WidgetPaintable({ widget: view })
	paintable.snapshot(snapshot, width, height)
	const node = snapshot.to_node()
	if (!node) {
		throw new Error('GTK produced no render node for the view')
	}
	const bounds = new Graphene.Rect()
	bounds.init(0, 0, width, height)
	const texture = view.get_native()!.get_renderer().render_texture(node, bounds)
	if (!texture) {
		throw new Error('GTK could not render the capture texture')
	}
	const bytes = texture.save_to_png_bytes().get_data()
	if (options.result !== 'tmpfile') {
		const encoded: string = GLib.base64_encode(bytes)
		return options.result === 'data-uri' ? 'data:image/png;base64,' + encoded : encoded
	}
	const [file, stream] = Gio.File.new_tmp('octane-view-shot-XXXXXX.png')
	try {
		try {
			stream.get_output_stream().write_all(bytes, null)
		} finally {
			stream.close(null)
		}
		const uri: string = file.get_uri()
		owned.set(uri, file)
		return uri
	} catch (error) {
		if (file.query_exists(null)) {
			file.delete(null)
		}
		throw error
	}
}
export const backend: CaptureBackend = {
	capabilities: () => ({ view: true, screen: false, formats: ['png'], scrollContent: false }),
	validate(target) {
		widget(target)
	},
	capture,
	async captureScreen() {
		throw new UnavailabilityError('GTK app-screen capture; pass an explicit widget to captureRef')
	},
	release(uri) {
		const file = owned.get(uri)
		if (!file) {
			return
		}
		if (file.query_exists(null) && !file.delete(null)) {
			throw new Error('Could not release the GTK capture')
		}
		owned.delete(uri)
	},
	async waitForLayout(target, cancelled) {
		const start = GLib.get_monotonic_time()
		while (!cancelled()) {
			try {
				widget(target)
				return
			} catch (error) {
				if (GLib.get_monotonic_time() - start >= 1500000) {
					throw error
				}
			}
			await new Promise<void>((resolve) =>
				GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
					resolve()
					return GLib.SOURCE_REMOVE
				}),
			)
		}
		throw new Error('ViewShot unmounted while waiting for layout')
	},
}
