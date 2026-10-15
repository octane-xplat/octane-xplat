import { useRef, useState } from 'octane';
import { useFocusVisible } from './use-focus-visible';

/**
 * Focus-event composition — React Aria's useFocus/useFocusRing family.
 * Returned props spread onto any component or element that forwards
 * onFocus/onBlur (web receives the DOM FocusEvent; native input leaves
 * fire their focus callbacks with no event).
 *
 * useFocusWithin differs by leaf: the web variant inspects relatedTarget
 * for real subtree semantics (use-focus-within.web.tsrx); the shared leaf
 * approximates within as a single-element focus toggle, which is the only
 * focus model native inputs have, and reports
 * `isSubtreeTrackingSupported: false` so callers can tell.
 */

export interface UseFocusOptions {
	isDisabled?: boolean
	onFocus?: (event?: unknown) => void
	onBlur?: (event?: unknown) => void
	onFocusChange?: (isFocused: boolean) => void
}

/**
 * Focus a host element on demand or mount — returns the ref callback + focused state.
 *
 * @see useFocusWithin, useFocusRing.
 */
export function useFocus(options: UseFocusOptions = {}) {
	const latest = useRef(options);
	latest.current = options;
	return {
		focusProps: latest.current.isDisabled
			? {}
			: {
					onFocus: (event?: unknown) => {
						latest.current.onFocus?.(event);
						latest.current.onFocusChange?.(true);
					},
					onBlur: (event?: unknown) => {
						latest.current.onBlur?.(event);
						latest.current.onFocusChange?.(false);
					},
				},
	};
}

/**
 * `useFocusRing` result — `isFocusVisible`/`isFocused`/`focusProps`.
 */
export interface UseFocusRingResult {
	isFocused: boolean
	/** Focused AND the last input was keyboard-modality (web); always false on native. */
	isFocusVisible: boolean
	focusProps: { onFocus: () => void; onBlur: () => void }
}

/**
 * Focus-visible ring state for a host element (RA parity) — `isFocusVisible` only for keyboard focus.
 *
 * @see UseFocusRingResult.
 */
export function useFocusRing(): UseFocusRingResult {
	const [isFocused, setFocused] = useState(false);
	const { isFocusVisible } = useFocusVisible();
	return {
		isFocused,
		isFocusVisible: isFocused && isFocusVisible,
		focusProps: {
			onFocus: () => setFocused(true),
			onBlur: () => setFocused(false),
		},
	};
}
