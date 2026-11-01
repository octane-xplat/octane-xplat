import type { OpenWindowOptions, WindowHandle } from '../../props'
import { hostGlobal } from './host-bridge'

// The handles this module minted, keyed to the host controller each wraps —
// `parent` accepts a `WindowHandle` and forwards its controller to the
// host's own openWindow (which accepts Gtk.Window or controller objects).
const controllers = new WeakMap<WindowHandle, any>()
let seq = 0

/** Open a GTK window through the renderer's window service
 *  (`__octaneGtkHost.openWindow`). Each call gets its own Gtk.Window +
 *  universal root; content resolves from `options.component` or the
 *  app-installed `__octaneGtkHost.setWindowContentResolver` — the same seam
 *  as the macOS host. Returns `null` when the host has no window service;
 *  invalid options (bad `kind`, a closed `parent`) throw. */
export function openWindow(options: OpenWindowOptions = {}): WindowHandle | null {
	const open = hostGlobal('__octaneGtkHost')?.openWindow
	if (typeof open !== 'function') {
		console.warn('[octane-xplat] Window creation is unsupported by the current GTK host.')
		return null
	}

	const parent = controllers.get(options.parent as WindowHandle) ?? options.parent
	const controller = open({ ...options, parent })

	const handle: WindowHandle = {
		id: `w${++seq}`,
		closed: controller.closed,
		get isClosed() {
			return !!controller.isClosed
		},
		close() {
			controller.close()
		},
		...(typeof controller.setTitle === 'function'
			? { setTitle: (title: string) => controller.setTitle(title) }
			: {}),
		...(typeof controller.setSize === 'function'
			? { setSize: (size: { width: number; height: number }) => controller.setSize(size) }
			: {}),
		// The GTK controller carries an assignable onCloseRequested slot —
		// the close-request signal routes through it before GTK destroys the
		// window.
		...('onCloseRequested' in controller
			? {
					onCloseRequested(callback: () => boolean) {
						controller.onCloseRequested = callback
						return () => {
							if (controller.onCloseRequested === callback) {
								controller.onCloseRequested = null
							}
						}
					},
				}
			: {}),
	}

	controllers.set(handle, controller)
	return handle
}
