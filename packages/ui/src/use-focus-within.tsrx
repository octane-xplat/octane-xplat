import { useRef } from 'octane';

/**
 * Shared leaf of React Aria's useFocusWithin. Fires onFocusWithin on the
 * first focus entry and onBlurWithin when focus fully leaves — approximated
 * here as a single-element focus toggle, the only focus granularity native
 * inputs expose. The web variant (use-focus-within.web.tsrx) inspects
 * relatedTarget for real subtree containment.
 */

export interface UseFocusWithinOptions {
	onFocusWithin?: (event?: unknown) => void
	onBlurWithin?: (event?: unknown) => void
	onFocusWithinChange?: (isFocusWithin: boolean) => void
}

export interface UseFocusWithinResult {
	focusWithinProps: {
		onFocus: (event?: unknown) => void
		onBlur: (event?: unknown) => void
	}
	/** Whether "within" tracks focus moving between subtree descendants.
	 *  Native has no subtree focus model — handlers attached to a focusable
	 *  element report that element's own focus (equivalent to `useFocus`),
	 *  so the leaf reports false. */
	isSubtreeTrackingSupported: boolean
}

export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
	const latest = useRef(options);
	latest.current = options;
	const within = useRef(false);
	const update = (next: boolean, event?: unknown) => {
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
			onFocus: (event?: unknown) => update(true, event),
			onBlur: (event?: unknown) => update(false, event),
		},
		isSubtreeTrackingSupported: false,
	};
}
