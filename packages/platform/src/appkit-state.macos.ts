import type { AppKitHost } from './appkit-host'
import type { AppState, WindowSize } from './types'

type Source<T> = { getSnapshot(): T; subscribe(listener: () => void): () => void }
type Event = 'onWindowResize' | 'onAppStateChange'
type SourceRecord<T> = { method: AppKitHost[Event]; source: Source<T>; failed: boolean }
const currentHost = () => (globalThis as { __xplatAppKit?: AppKitHost }).__xplatAppKit
const emptyWindow: WindowSize = Object.freeze({ width: 0, height: 0, orientation: 'landscape' })

/** Stable stores per installed host and event hook, without polling globals. */
function sourceFor<T>(event: Event, fallback: T, read: (owner: AppKitHost) => T, equal: (a: T, b: T) => boolean) {
	const missing: Source<T> = { getSnapshot: () => fallback, subscribe: () => () => {} }
	const sources = new WeakMap<AppKitHost, SourceRecord<T>>()
	return (): Source<T> => {
		const owner = currentHost()
		if (!owner || typeof owner !== 'object') return missing
		const method = typeof owner[event] === 'function' ? owner[event] : undefined
		const previous = sources.get(owner)
		if (previous && previous.method === method && !previous.failed) return previous.source
		let value = fallback
		const record: SourceRecord<T> = { method, failed: false, source: {
			getSnapshot(): T {
				if (currentHost() !== owner) return fallback
				try {
					const next = read(owner)
					if (!equal(value, next)) value = next
				} catch { value = fallback }
				return value
			},
			subscribe(listener: () => void): () => void {
				if (!method || currentHost() !== owner || owner[event] !== method) return () => {}
				let active = true, acquired = false, pending = false
				let remove: (() => void) | undefined
				const stop = () => {
					if (!active) return
					active = false
					const release = remove
					remove = undefined
					try { release?.() } catch { /* Retired callbacks remain inert. */ }
				}
				const notify = () => {
					if (!active || currentHost() !== owner || owner[event] !== method) return
					if (!acquired) { pending = true; return }
					try { listener() } catch { /* Keep other native readers observable. */ }
				}
				try {
					remove = method.call(owner, notify)
					acquired = true
					if (currentHost() !== owner || owner[event] !== method) stop()
					else if (pending) notify()
				} catch (error) {
					record.failed = true
					stop()
					throw error
				}
				return stop
			},
		} }
		sources.set(owner, record)
		return record.source
	}
}

export const appKitWindowSource = sourceFor<WindowSize>('onWindowResize', emptyWindow, (owner) => {
	const size = owner.windowSize
	const width = size?.width, height = size?.height
	if (typeof width !== 'number' || typeof height !== 'number' || !Number.isFinite(width) ||
		!Number.isFinite(height) || width < 0 || height < 0) return emptyWindow
	return Object.freeze({ width, height, orientation: width >= height ? 'landscape' : 'portrait' })
}, (a, b) => a.width === b.width && a.height === b.height && a.orientation === b.orientation)

export const appKitActivitySource = sourceFor<AppState>('onAppStateChange', 'active', (owner) => {
	const state = owner.appState
	return state === 'active' || state === 'inactive' || state === 'background' ? state : 'active'
}, Object.is)
