import type { OpenWindowOptions, WindowHandle } from '../../props'
import { appKitHost, hostGlobal } from './host-bridge'

// The handles this module minted, keyed to the host controller each wraps —
// `parent` accepts a `WindowHandle` and forwards its controller to the
// host's own `openWindow` (which accepts NSWindow or controller objects).
const controllers = new WeakMap<WindowHandle, any>()
let seq = 0

/** Open an AppKit window through the host-installed window service
 *  (`__xplatAppKitOpenWindow`). Returns `null` when the host has no window
 *  service; invalid options (bad `kind`, a closed `parent`) throw. */
export function openWindow(options: OpenWindowOptions = {}): WindowHandle | null {
	const open = hostGlobal('__xplatAppKitOpenWindow')
	if (typeof open !== 'function') {
		console.warn('[octane-xplat] Window creation is unsupported by the current AppKit host.')
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
		// The AppKit controller carries an assignable onCloseRequested slot;
		// hosts without one (the workshop shell) expose no veto hook.
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
