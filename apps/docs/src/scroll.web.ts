// The doc pane is one persistent ScrollView — reset it on every nav path.
// Octane passives are post-paint (rAF-deferred) no matter what triggered the
// commit, so a slug-keyed useEffect would paint one frame at the stale
// scrollTop before resetting — and popstate also races the browser's own
// scrollRestoration. Imperative reset keeps it synchronous with the nav write.
export function resetDocScroll() {
	const el = document.getElementById('doc-content')
	if (el) {
		el.scrollTop = 0
	}

	// The destination's headings appear after the route commit. Also covers
	// direct fragment loads and back/forward into a section.
	requestAnimationFrame(() => {
		if (!location.hash) {
			return
		}

		try {
			document
				.getElementById(decodeURIComponent(location.hash.slice(1)))
				?.scrollIntoView?.({ block: 'start' })
		} catch {
			// Malformed URL escapes must not break page navigation.
		}
	})
}

window.addEventListener('popstate', resetDocScroll)
window.addEventListener('hashchange', resetDocScroll)
