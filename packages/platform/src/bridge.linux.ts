// Host bridge — the Linux webview target reaches OS APIs through the single
// `webkit.messageHandlers.xplat` script-message channel that both WebKitGTK
// (the real host) and WKWebView (the dev harness) expose under the same API.
//
// Wire contract:
//   webview → host:  postMessage(JSON.stringify({ id, service, method, args }))
//                    — a string, not an object: WebKitGTK 6.0 delivers a bare
//                    JSCValue to the host, and parsing one string beats
//                    walking JSCValue properties on the GI side.
//   host → webview reply:  evaluate __xplatBridge.resolve(id, value)
//                          or __xplatBridge.reject(id, message)
//   host → webview event:  evaluate __xplatBridge.emit(service, event, payload)
//
// A plain browser pointed at the same dev server has no message handler —
// `bridged` is false and every leaf degrades to its web fallback or reports
// `unsupported`, so browser dev against the linux port keeps working.

type Listener = (payload: unknown) => void

type BridgeRequest = {
	id: number
	service: string
	method: string
	args: unknown[]
}

declare global {
	interface Window {
		webkit?: {
			messageHandlers?: {
				xplat?: { postMessage(req: string): void }
			}
		}
		__xplatBridge?: {
			resolve(id: number, value: unknown): void
			reject(id: number, message: string): void
			emit(service: string, event: string, payload: unknown): void
		}
		// Synchronous state the host injects at document-start (user script),
		// for APIs whose contract can't afford an async round-trip.
		__xplatInitialUrl?: string | null
	}
}

const handler = () =>
	typeof window !== 'undefined' ? window.webkit?.messageHandlers?.xplat : undefined

export const bridged = () => handler() !== undefined

const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
const events = new Map<string, Set<Listener>>()
let seq = 0

export function call<T>(service: string, method: string, ...args: unknown[]): Promise<T> {
	const h = handler()
	if (!h) {
		return Promise.reject(new Error(`xplat host bridge is unavailable (${service}.${method})`))
	}

	const id = ++seq
	h.postMessage(JSON.stringify({ id, service, method, args }))
	return new Promise<T>((resolve, reject) =>
		pending.set(id, { resolve: (v) => resolve(v as T), reject }),
	)
}

export function on(service: string, event: string, listener: Listener): () => void {
	const key = `${service}.${event}`
	let set = events.get(key)
	if (!set) {
		set = new Set()
		events.set(key, set)
	}

	set.add(listener)
	return () => set.delete(listener)
}

if (typeof window !== 'undefined' && !window.__xplatBridge) {
	window.__xplatBridge = {
		resolve(id, value) {
			const p = pending.get(id)
			pending.delete(id)
			p?.resolve(value)
		},
		reject(id, message) {
			const p = pending.get(id)
			pending.delete(id)
			p?.reject(new Error(message))
		},
		emit(service, event, payload) {
			for (const l of events.get(`${service}.${event}`) ?? []) {
				l(payload)
			}

			// Side-channel for packages that must not depend on this module
			// (e.g. @octane-xplat/ui leaves): xplat:<service>.<event> CustomEvent
			// on window, payload in .detail.
			window.dispatchEvent(
				new CustomEvent(`xplat:${service}.${event}`, { detail: payload }),
			)
		},
	}
}
