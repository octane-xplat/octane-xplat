import type { HostTransport } from './host-protocol'
import type { HostBootstrapState } from './host-services'

type MessageHandler = { postMessage(message: string): void }

declare global {
	interface Window {
		webkit?: { messageHandlers?: { xplat?: MessageHandler } }
		__xplatHostTransport?: {
			receive(message: string): void
			listen(listener: (message: string) => void): () => void
		}
		__xplatHostSnapshot?: HostBootstrapState
	}
}

/** Return the native message channel when this page is hosted by a desktop app. */
export function createWebKitTransport(): HostTransport | null {
	if (typeof window === 'undefined') {
		return null
	}

	const handler = window.webkit?.messageHandlers?.xplat
	const host = window.__xplatHostTransport
	if (!handler || !host) {
		return null
	}

	return {
		postMessage(message) {
			handler.postMessage(message)
		},
		listen(listener) {
			return host.listen(listener)
		},
	}
}
