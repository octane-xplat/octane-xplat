import { announce } from './announce-service'
/** Requested announcement urgency; native service ignores this preference. */
export type AnnouncePoliteness = 'polite' | 'assertive'
const announceNative = (message: string, _politeness?: AnnouncePoliteness): void => {
	if (message) {
		announce(message)
	}
}

/** Native delivery uses the host announcement service; politeness and clear
 * are not supported by that service. Actual OS delivery requires host checks. */
export function useAnnounce(): (message: string, politeness?: AnnouncePoliteness) => void {
	return announceNative
}
