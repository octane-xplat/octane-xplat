/** DOM-side inspection: one absolutely-positioned glyph span per color layer. */
export function glyphSnapshot(view: any) {
	const layers = [...(view?.children ?? [])]
		.filter((child: any) => child?.tagName === 'SPAN')
		.map((child: any) => ({
			codePoint: child.textContent?.codePointAt(0),
			fontFamily: child.style?.fontFamily?.replace(/^"|"$/g, ''),
			color: child.style?.color,
		}))
	return {
		layers,
		label: view?.getAttribute?.('aria-label'),
		width: view?.getBoundingClientRect?.().width,
		height: view?.getBoundingClientRect?.().height,
	}
}

/** Verify the family through the document's FontFace registry. */
export async function fontReady(family: string) {
	try {
		await document.fonts.ready
		return document.fonts.check(`12px "${family}"`) ? 'ready' : 'missing'
	} catch {
		return 'unavailable'
	}
}
