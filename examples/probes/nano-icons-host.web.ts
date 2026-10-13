/** Inspect the actual inline SVG host without screenshots. */
export function iconSnapshot(view: any) {
	return {
		body: view?.outerHTML ?? '',
		width: Number(view?.getAttribute('width')),
		height: Number(view?.getAttribute('height')),
		label: view?.getAttribute('aria-label'),
		decorative: view?.getAttribute('aria-hidden') === 'true',
	}
}

// Inline SVG shares the page's id space, so live instances still receive
// unique definition IDs — markup differs between equal instances on web.
export const instancesShareMarkup = false
