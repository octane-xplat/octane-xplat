// Deep links — web leaf. The URL IS the link: consumeInitialUrl returns the
// current path; onDeepLink listens for popstate (back/forward = link events).
import { desktopHostBootstrap, desktopHostClient } from './host-runtime.web'

type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false
const bootstrap = desktopHostBootstrap()
let hasInitialHostUrl = bootstrap !== null
let initialHostUrl = bootstrap?.initialUrl ?? null

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

	const host = desktopHostClient()
	host?.on('app.deep-link', (url) => {
		for (const handler of handlers) {
			handler(url)
		}
	})
}

export function onDeepLink(cb: LinkHandler): () => void {
	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

export function consumeInitialUrl(): string | null {
	if (hasInitialHostUrl) {
		hasInitialHostUrl = false
		const url = initialHostUrl
		initialHostUrl = null
		return url
	}

	return location.pathname === '/' ? null : location.pathname + location.search
}
