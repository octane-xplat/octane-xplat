// Deep links — Linux leaf. The host owns the app scheme registration and
// pushes 'deep-links.open' events through the bridge; the cold-start URL
// arrives synchronously as window.__xplatInitialUrl (injected by a
// document-start user script — the contract is sync, so it can't afford a
// round-trip). Browser dev keeps the popstate fallback.
import { bridged, on } from './bridge'

type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false

function wire() {
	if (wired) {
		return
	}

	wired = true
	window.addEventListener('popstate', () => {
		for (const h of handlers) {
			h(location.pathname + location.search)
		}
	})
}

export function onDeepLink(cb: LinkHandler): () => void {
	if (bridged()) {
		return on('deep-links', 'open', (url) => cb(String(url)))
	}

	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

export function consumeInitialUrl(): string | null {
	if (bridged()) {
		const url = window.__xplatInitialUrl ?? null
		window.__xplatInitialUrl = null
		return url
	}

	return location.pathname === '/' ? null : location.pathname + location.search
}
