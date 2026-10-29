import { announce } from '../../internal/accessibility/announce.web'
/** DOM live-region delivery; actual speech depends on assistive technology. */
export function useAnnounce() {
	return announce
}

export type { AnnouncePoliteness } from '../../internal/accessibility/announce.web'
