import type { WebBrowser } from './types'

export interface AppKitBrowserNative { open(url: string): boolean | number; close(): void }
export interface AppKitBrowserFactory { accepts(url: string): boolean | number; create(): AppKitBrowserNative }

/** Presentation ownership only. `opened` does not establish a network load. */
export function createAppKitWebBrowser(bridge: () => AppKitBrowserFactory | undefined): WebBrowser {
	let active: AppKitBrowserNative | undefined, revision = 0
	const close = (view: AppKitBrowserNative | undefined) => { try { view?.close() } catch { console.warn('[macos-web-browser] native close failed') } }
	return {
		get supported() { try { const factory = bridge(); return typeof factory?.create === 'function' && typeof factory.accepts === 'function' } catch { return false } },
		async openBrowser(address, _options) {
			let candidate: AppKitBrowserNative | undefined
			const own = ++revision
			try {
				const factory = bridge(); if (!factory || typeof factory.create !== 'function' || typeof factory.accepts !== 'function') return { type: 'cancel' }
				const valid = factory.accepts(address)
				if ((valid !== true && valid !== 1) || revision !== own) return { type: 'cancel' }
				candidate = factory.create()
				if (revision !== own) { close(candidate); return { type: 'cancel' } }
				const previous = active; active = candidate; close(previous)
				if (revision !== own || active !== candidate) { close(candidate); return { type: 'cancel' } }
				const shown = candidate.open(address)
				if (revision !== own || active !== candidate) { close(candidate); return { type: 'cancel' } }
				if (shown !== true && shown !== 1) { active = undefined; close(candidate); return { type: 'cancel' } }
				return { type: 'opened' }
			} catch {
				if (active === candidate) active = undefined
				close(candidate)
				return { type: 'cancel' }
			}
		},
		dismissBrowser() { revision++; const previous = active; active = undefined; close(previous) },
		warmUp: () => Promise.resolve(), coolDown: () => Promise.resolve(), mayInitWithUrl: () => Promise.resolve(),
	}
}
