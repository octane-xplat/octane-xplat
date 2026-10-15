import { useRef } from 'octane';
import type { FocusEventPayload } from './use-focus'

/**
 * Shared leaf of React Aria's useFocusWithin. Fires onFocusWithin on the
 * first focus entry and onBlurWithin when focus fully leaves — approximated
 * here as a single-element focus toggle, the only focus granularity native
 * inputs expose. The web variant (use-focus-within.web.tsrx) inspects
 * relatedTarget for real subtree containment.
 */

export interface UseFocusWithinOptions {
	onFocusWithin?: (event?: FocusEventPayload) => void
	onBlurWithin?: (event?: FocusEventPayload) => void
	onFocusWithinChange?: (isFocusWithin: boolean) => void
}

/**
 * `useFocusWithin` result — `isFocusWithin` + handlers to spread.
 */
export interface UseFocusWithinResult {
	focusWithinProps: {
		onFocus: (event?: FocusEventPayload) => void
		onBlur: (event?: FocusEventPayload) => void
	}
	/** Whether "within" tracks focus moving between subtree descendants.
	 *  Native has no subtree focus model — handlers attached to a focusable
	 *  element report that element's own focus (equivalent to `useFocus`),
	 *  so the leaf reports false. */
	isSubtreeTrackingSupported: boolean
}

/**
 * Focus-within state — true while focus is inside the bound subtree.
 *
 * @see UseFocusWithinResult.
 */
export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
	const latest = useRef(options);
	latest.current = options;
	const within = useRef(false);
	const update = (next: boolean, event?: FocusEventPayload) => {
		if (next === within.current) {
			return;
		}

		within.current = next;
		if (next) {
			latest.current.onFocusWithin?.(event);
		} else {
			latest.current.onBlurWithin?.(event);
		}

		latest.current.onFocusWithinChange?.(next);
	};

	return {
		focusWithinProps: {
			onFocus: (event?: FocusEventPayload) => update(true, event),
			onBlur: (event?: FocusEventPayload) => update(false, event),
		},
		isSubtreeTrackingSupported: false,
	};
}
