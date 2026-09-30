// Linux keeps its GJS host adapter, while using the shared desktop message
// protocol for calls, replies, events, and capability discovery.
import {
	createHostClient,
	type HostCapabilities,
	type HostClient,
	type HostEventMap,
	type HostServiceMap,
	type HostTransport,
} from './host-protocol'

type Listener = (payload: unknown) => void

declare global {
	interface Window {
		webkit?: {
			messageHandlers?: {
				xplat?: { postMessage(message: string): void }
			}
		}
		__xplatHostTransport?: {
			receive(message: string): void
			listen(listener: (message: string) => void): () => void
		}
		__xplatBridge?: {
			// Legacy response hooks remain for the Linux development self-test and
			// direct hosts that still send the pre-protocol request shape.
			resolve(id: number, value: unknown): void
			reject(id: number, message: string): void
			emit(service: string, event: string, payload: unknown): void
			call(service: string, method: string, args?: unknown[]): Promise<unknown>
			on(service: string, event: string, listener: Listener): () => void
			capabilities(): Promise<HostCapabilities>
		}
		__xplatInitialUrl?: string | null
	}
}

const handler = () =>
	typeof window !== 'undefined' ? window.webkit?.messageHandlers?.xplat : undefined

const createTransport = (): HostTransport | null => {
	const post = handler()
	const host = typeof window !== 'undefined' ? window.__xplatHostTransport : undefined
	if (!post || !host) {
		return null
	}

	return {
		postMessage(message) {
			post.postMessage(message)
		},
		listen(listener) {
			return host.listen(listener)
		},
	}
}

let client: HostClient<HostServiceMap, HostEventMap> | null | undefined
const hostClient = () => {
	if (client !== undefined) {
		return client
	}

	const transport = createTransport()
	client = transport ? createHostClient<HostServiceMap, HostEventMap>(transport) : null
	return client
}

export const bridged = () => handler() !== undefined

const eventName = (service: string, event: string) =>
	(service === 'deepLinks' || service === 'deep-links') && event === 'open'
		? 'app.deep-link'
		: `${service}.${event}`

export function call<T>(service: string, method: string, ...args: unknown[]): Promise<T> {
	const host = hostClient()
	if (!host) {
		return Promise.reject(new Error(`xplat host bridge is unavailable (${service}.${method})`))
	}

	return host.call(service, method, ...args) as Promise<T>
}

export function on(service: string, event: string, listener: Listener): () => void {
	const host = hostClient()
	return host ? host.on(eventName(service, event), listener) : () => {}
}

export function capabilities(): Promise<HostCapabilities> {
	return hostClient()?.capabilities() ?? Promise.resolve({})
}

// Compatibility surface for framework leaves and consumers that access the
// Linux adapter without importing this module. Calls and subscriptions still
// travel over the shared typed protocol.
if (typeof window !== 'undefined' && !window.__xplatBridge) {
	window.__xplatBridge = {
		resolve() {},
		reject() {},
		emit(service, event, payload) {
			window.dispatchEvent(new CustomEvent(`xplat:${service}.${event}`, { detail: payload }))
		},
		call: (service, method, args) => call(service, method, ...(args ?? [])),
		on,
		capabilities,
	}
}
