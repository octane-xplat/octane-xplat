import type { IntersectionObserverEntry } from './types'

/** Field-equality for delivered entries — lets hooks skip a re-render when
 *  a new entry carries identical values. */
export function sameEntry(
	a: IntersectionObserverEntry | null,
	b: IntersectionObserverEntry,
): boolean {
	return (
		a != null &&
		a.isIntersecting === b.isIntersecting &&
		a.intersectionRatio === b.intersectionRatio &&
		a.boundingClientRect.x === b.boundingClientRect.x &&
		a.boundingClientRect.y === b.boundingClientRect.y &&
		a.boundingClientRect.width === b.boundingClientRect.width &&
		a.boundingClientRect.height === b.boundingClientRect.height
	)
}
