// Linux keeps its GJS host adapter, while using the shared desktop message
// protocol for calls, replies, events, and capability discovery.
import {
	createHostClient,
	type HostCapabilities,
	type HostClient,
	type HostTransport,
} from './host-protocol'

import type {
	FrameworkHostEvents,
	FrameworkHostServices,
	HostBootstrapState,
} from './host-services'

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
		__xplatHostSnapshot?: HostBootstrapState
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

let client: HostClient<FrameworkHostServices, FrameworkHostEvents> | null | undefined
const hostClient = () => {
	if (client !== undefined) {
		return client
	}

	const transport = createTransport()
	client = transport
		? createHostClient<FrameworkHostServices, FrameworkHostEvents>(transport)
		: null

	return client
}

export const bridged = () => handler() !== undefined

const eventName = (service: string, event: string) =>
	(service === 'deepLinks' || service === 'deep-links') && event === 'open'
		? 'app.deep-link'
		: `${service}.${event}`

export const call: HostClient<FrameworkHostServices, FrameworkHostEvents>['call'] = (
	service,
	method,
	...args
) => {
	const host = hostClient()
	if (!host) {
		return Promise.reject(new Error(`xplat host bridge is unavailable (${service}.${method})`))
	}

	return host.call(service, method, ...args)
}

export function onHostEvent<Event extends keyof FrameworkHostEvents & string>(
	name: Event,
	listener: (payload: FrameworkHostEvents[Event]) => void,
): () => void {
	const host = hostClient()
	return host ? host.on(name, listener) : () => {}
}

export function bootstrap(): HostBootstrapState | null {
	return typeof window === 'undefined' ? null : (window.__xplatHostSnapshot ?? null)
}

export function on(service: string, event: string, listener: Listener): () => void {
	const host = hostClient()
	return host
		? host.on(eventName(service, event) as keyof FrameworkHostEvents & string, listener)
		: () => {}
}

export function capabilities(): Promise<HostCapabilities<FrameworkHostServices>> {
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
		call: (service, method, args) => {
			const host = hostClient()
			if (!host) {
				return Promise.reject(new Error(`xplat host bridge is unavailable (${service}.${method})`))
			}

			const legacyCall = host.call as (
				service: string,
				method: string,
				...args: unknown[]
			) => Promise<unknown>

			return legacyCall(service, method, ...(args ?? []))
		},
		on,
		capabilities,
	}
}
