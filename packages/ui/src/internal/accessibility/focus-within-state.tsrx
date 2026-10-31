import { useRef } from 'octane'
import type { FocusEventPayload } from './use-focus'
import { normalizeFocusWithinEvent, type FocusWithinEvent } from './focus-within-event'

/** Default mobile leaf: a single-element focus toggle. Web and AppKit
 * provide subtree containment through their platform leaves. */
export interface UseFocusWithinOptions {
	/** Fires when focus moves inside the bound subtree. */
	onFocusWithin?: (event?: FocusEventPayload) => void
	/** Fires when focus leaves the bound subtree. */
	onBlurWithin?: (event?: FocusEventPayload) => void
	/** Fires on every containment transition with the new value. */
	onFocusWithinChange?: (isFocusWithin: boolean) => void
}

/**
 * `useFocusWithin` handlers and subtree capability.
 */
export interface UseFocusWithinResult {
	/** Bound focus/blur handlers to spread on the subtree root. */
	focusWithinProps: {
		onFocus: (event?: FocusWithinEvent) => void
		onBlur: (event?: FocusWithinEvent) => void
	}
	/** Whether the attachment tracks focus moving between descendants.
	 * AppKit requires a raw native container; shared View does not forward it. */
	isSubtreeTrackingSupported: boolean
}

/**
 * Focus-within state — true while focus is inside the bound subtree.
 *
 * @see UseFocusWithinResult.
 */
export function useFocusWithinState(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
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
			onBlur: (event?: FocusWithinEvent) => update(false, normalizeFocusWithinEvent(event, 'blur')),
		},
		isSubtreeTrackingSupported: false,
	}
}
