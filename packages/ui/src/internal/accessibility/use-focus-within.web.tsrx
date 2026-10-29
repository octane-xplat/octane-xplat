import { useRef } from 'octane'
import type { FocusEventPayload } from './use-focus'
import { normalizeFocusWithinEvent, type FocusWithinEvent } from './focus-within-event'
import type { UseFocusWithinOptions, UseFocusWithinResult } from './focus-within-state'
export type { UseFocusWithinOptions, UseFocusWithinResult } from './focus-within-state'

/**
 * Web leaf of useFocusWithin — real subtree semantics via relatedTarget:
 * blur counts as leaving "within" only when the newly focused node falls
 * outside the element the handlers are attached to.
 */
export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
	const latest = useRef(options)
	latest.current = options
	const within = useRef(false)
	const update = (next: boolean, event?: FocusEventPayload) => {
		if (next === within.current) {
			return
		}

		within.current = next
		if (next) {
			latest.current.onFocusWithin?.(event)
		} else {
			latest.current.onBlurWithin?.(event)
		}

		latest.current.onFocusWithinChange?.(next)
	}

	return {
		focusWithinProps: {
			onFocus: (event?: FocusWithinEvent) => update(true, normalizeFocusWithinEvent(event, 'focus')),
			onBlur: (event?: FocusWithinEvent) => {
				const normalized = normalizeFocusWithinEvent(event, 'blur')
				const focusEvent = normalized as FocusEvent | undefined
				const target = focusEvent?.currentTarget as Element | null
				const related = focusEvent?.relatedTarget as Node | null
				if (target && related && typeof target.contains === 'function' && target.contains(related)) {
					return
				}

				update(false, normalized)
			},
		},
		isSubtreeTrackingSupported: true,
	}
}
