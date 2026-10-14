import { useRef } from 'octane';

/**
 * Web leaf of useFocusWithin — real subtree semantics via relatedTarget:
 * blur counts as leaving "within" only when the newly focused node falls
 * outside the element the handlers are attached to.
 */
export interface UseFocusWithinOptions {
	onFocusWithin?: (event?: unknown) => void;
	onBlurWithin?: (event?: unknown) => void;
	onFocusWithinChange?: (isFocusWithin: boolean) => void;
}

export interface UseFocusWithinResult {
	focusWithinProps: {
		onFocus: (event?: unknown) => void;
		onBlur: (event?: unknown) => void;
	};
	/** Whether "within" tracks focus moving between subtree descendants —
	 *  true on web via `relatedTarget` containment. */
	isSubtreeTrackingSupported: boolean;
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
			onBlur: (event?: unknown) => {
				const focusEvent = event as FocusEvent | undefined;
				const target = focusEvent?.currentTarget as Element | null;
				const related = focusEvent?.relatedTarget as Node | null;
				if (target && related && target.contains(related)) {
					return;
				}

				update(false, event);
			},
		},
		isSubtreeTrackingSupported: true,
	};
}
