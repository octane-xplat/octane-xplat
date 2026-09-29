// Windows — Linux webview leaf. Each openWindow() asks the host for a new
// GTK window + WebKitWebView (its own Octane root) loading options.url
// against the same bundle base; options.data arrives in the new root as
// window.__xplatWindowData (document-start injection — the content resolver
// seam, per #59). The client assigns the id so the controller is available
// synchronously. Unbridged dev degrades to window.open.
import type { OpenWindowOptions } from './props'

export interface LinuxWindowHandle {
	readonly id: string
	readonly closed: Promise<void>
	close(): void
	setTitle(title: string): void
}

const bridge = () => (globalThis as any).__xplatBridge
let seq = 0

export function openWindow(
	options: OpenWindowOptions & {
		kind?: 'regular' | 'dialog'
		title?: string
		size?: { width: number; height: number }
	} = {},
): LinuxWindowHandle | Window | null {
	if (!bridge()?.call) {
		return window.open(options.url ?? window.location.href, '_blank')
	}

	const id = `w${++seq}`
	let resolveClosed: () => void = () => {}
	const closed = new Promise<void>((resolve) => {
		resolveClosed = resolve
	})
	const off = bridge().on('windows', 'closed', (wid: unknown) => {
		if (wid === id) {
			off()
			resolveClosed()
		}
	})

	void bridge()
		.call('windows', 'open', [{ ...options, id }])
		.catch(() => {
			off()
			resolveClosed()
		})

	return {
		id,
		closed,
		close() {
			void bridge().call('windows', 'close', [id]).catch(() => {})
		},
		setTitle(title: string) {
			void bridge().call('windows', 'setTitle', [id, title]).catch(() => {})
		},
	}
}
