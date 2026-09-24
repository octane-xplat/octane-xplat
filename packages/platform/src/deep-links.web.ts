// Deep links — web leaf. The URL IS the link: consumeInitialUrl returns the
// current path; onDeepLink listens for popstate (back/forward = link events).
type LinkHandler = (url: string) => void
const handlers = new Set<LinkHandler>()
let wired = false

function wire() {
	if (wired) return
	wired = true
	window.addEventListener('popstate', () => {
		for (const h of handlers) h(location.pathname + location.search)
	})
}

export function onDeepLink(cb: LinkHandler): () => void {
	wire()
	handlers.add(cb)
	return () => handlers.delete(cb)
}

export function consumeInitialUrl(): string | null {
	return location.pathname === '/' ? null : location.pathname + location.search
}
