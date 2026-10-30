import type { NativeEvent } from '@octane-xplat/jsx/intrinsics'
import type { FocusEventPayload } from './use-focus'

/** Input accepted by focus-within attachments on DOM and native hosts. */
export type FocusWithinEvent = FocusEventPayload | NativeEvent<object>

/** Keep existing DOM/AppKit payloads; normalize a minimal native event into
 * the portable callback shape without inventing related-target information. */
export function normalizeFocusWithinEvent(event: FocusWithinEvent | undefined, type: 'focus' | 'blur'): FocusEventPayload | undefined {
	if (!event || 'type' in event) {return event}
	return { type, target: event.object, currentTarget: event.object, relatedTarget: null, preventDefault() {}, stopPropagation() {} }
}
