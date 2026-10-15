import { useRef } from 'octane';
import type { FocusEventPayload } from './use-focus'

/**
 * Web leaf of useFocusWithin — real subtree semantics via relatedTarget:
 * blur counts as leaving "within" only when the newly focused node falls
 * outside the element the handlers are attached to.
 */
export interface UseFocusWithinOptions {
	onFocusWithin?: (event?: FocusEventPayload) => void;
	onBlurWithin?: (event?: FocusEventPayload) => void;
	onFocusWithinChange?: (isFocusWithin: boolean) => void;
}

export interface UseFocusWithinResult {
	focusWithinProps: {
		onFocus: (event?: FocusEventPayload) => void;
		onBlur: (event?: FocusEventPayload) => void;
	};
	/** Whether "within" tracks focus moving between subtree descendants —
	 *  true on web via `relatedTarget` containment. */
	isSubtreeTrackingSupported: boolean;
}

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
			onBlur: (event?: FocusEventPayload) => {
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
