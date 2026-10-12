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
 * below approximates within as a single-element focus toggle, which is
 * the only focus model native inputs have.
 */

export interface UseFocusOptions {
	isDisabled?: boolean
	onFocus?: (event?: unknown) => void
	onBlur?: (event?: unknown) => void
	onFocusChange?: (isFocused: boolean) => void
}

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

export interface UseFocusRingResult {
	isFocused: boolean
	/** Focused AND the last input was keyboard-modality (web); always false on native. */
	isFocusVisible: boolean
	focusProps: { onFocus: () => void; onBlur: () => void }
}

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
