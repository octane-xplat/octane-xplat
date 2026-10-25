/** Persistent screen-reader live regions, mirroring Astryx's `useAnnounce`.
 *  A live region mounted together with its content is not reliably spoken,
 *  so field status (usually conditionally rendered) is announced through two
 *  document-level regions that stay mounted: assertive for errors, polite
 *  otherwise. Text clears after a short delay so a repeat is spoken again. */
export type AnnouncePoliteness = 'polite' | 'assertive'

const HIDDEN_CSS =
	'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
	'clip:rect(0,0,0,0);white-space:nowrap;border:0;inset-block-start:0;' +
	'inset-inline-start:0;pointer-events:none;user-select:none;'
const CLEAR_DELAY_MS = 2000

let regions: Record<AnnouncePoliteness, HTMLElement> | undefined
const clearTimers: Record<AnnouncePoliteness, ReturnType<typeof setTimeout> | undefined> = {
	polite: undefined,
	assertive: undefined,
}

function createRegion(politeness: AnnouncePoliteness): HTMLElement {
	const el = document.createElement('div')
	el.setAttribute('data-xplat-live-region', politeness)
	el.setAttribute('aria-live', politeness)
	el.setAttribute('aria-atomic', 'true')
	el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status')
	el.style.cssText = HIDDEN_CSS
	document.body.appendChild(el)
	return el
}

function getRegions(): Record<AnnouncePoliteness, HTMLElement> | undefined {
	if (typeof document === 'undefined') {
		return undefined
	}
	regions ??= { polite: createRegion('polite'), assertive: createRegion('assertive') }
	for (const el of Object.values(regions)) {
		if (!el.isConnected) {
			document.body.appendChild(el)
		}
	}
	return regions
}

export function announce(message: string, politeness: AnnouncePoliteness = 'polite'): void {
	const target = getRegions()?.[politeness]
	if (!target || message === '') {
		return
	}
	target.textContent = ''
	requestAnimationFrame(() => {
		target.textContent = message
		clearTimeout(clearTimers[politeness])
		clearTimers[politeness] = setTimeout(() => {
			target.textContent = ''
		}, CLEAR_DELAY_MS)
	})
}
