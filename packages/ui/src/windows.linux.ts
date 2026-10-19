// Windows — Linux webview leaf. Each openWindow() asks the host for a new
// GTK window + WebKitWebView (its own Octane root) loading options.url
// against the same bundle base; options.data arrives in the new root as
// window.__xplatWindowData (document-start injection — the content resolver
// seam, per #59). The client assigns the id so the controller is available
// synchronously. Unbridged dev degrades to the web window path.
import type { OpenWindowOptions, WindowHandle } from './props'
import { appKitHost, hostGlobal } from './host-bridge'
import { openWebWindow } from './windows.web'

/** LinuxWindowHandle is the shared `WindowHandle` — retitled through the
 *  host bridge. Retained as the `/linux` subpath's former export name. */
export type LinuxWindowHandle = WindowHandle

const bridge = () => hostGlobal('__xplatBridge')
let seq = 0

export function openWindow(options: OpenWindowOptions = {}): WindowHandle | null {
	if (!bridge()?.call) {
		return openWebWindow(options)
	}

	const id = `w${++seq}`
	let isClosed = false
	let resolveClosed: () => void = () => {}
	const closed = new Promise<void>((resolve) => {
		resolveClosed = resolve
	})

	const finish = () => {
		if (isClosed) {
			return
		}

		isClosed = true
		resolveClosed()
	}

	const off = bridge()?.on('windows', 'closed', (wid: unknown) => {
		if (wid === id) {
			off()
			finish()
		}
	})

	void bridge()
		.call('windows', 'open', [{ ...options, id }])
		.catch(() => {
			off()
			finish()
		})

	return {
		id,
		closed,
		get isClosed() {
			return isClosed
		},
		close() {
			void bridge()
				.call('windows', 'close', [id])
				.catch(() => {})
		},
		setTitle(title: string) {
			void bridge()
				.call('windows', 'setTitle', [id, title])
				.catch(() => {})
		},
	}
}
