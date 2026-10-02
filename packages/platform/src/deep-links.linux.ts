// Deep links — Linux leaf. The host owns the app scheme registration and
// pushes 'app.deep-link' events through the bridge; the cold-start URL
// arrives synchronously in __xplatHostSnapshot (with __xplatInitialUrl kept
// for older hosts) because the consume contract is synchronous. Browser dev keeps the popstate fallback.
import { bootstrap, bridged, onHostEvent } from './bridge'

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
		return onHostEvent('app.deep-link', (url) => cb(String(url)))
	}

	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

export function consumeInitialUrl(): string | null {
	if (bridged()) {
		const url = bootstrap()?.initialUrl ?? window.__xplatInitialUrl ?? null
		if (window.__xplatHostSnapshot) {
			window.__xplatHostSnapshot.initialUrl = null
		}

		window.__xplatInitialUrl = null
		return url
	}

	return location.pathname === '/' ? null : location.pathname + location.search
}
