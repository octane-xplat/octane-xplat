/** Input modality observed by the focus-visible tracker. Native targets use
 *  `unknown` because they do not track keyboard/pointer modality. */
export type FocusInputModality = 'keyboard' | 'pointer' | 'unknown'

/** Result of `useFocusVisible` on every target. Native targets report
 *  `isSupported: false`, `inputModality: 'unknown'`, and no visible ring. */
export interface UseFocusVisibleResult {
	isFocusVisible: boolean
	inputModality: FocusInputModality
	isSupported: boolean
}

/**
 * Native counterpart of use-focus-visible.web.tsrx. There is no
 * pointer-vs-keyboard modality on native — focus-visible is a web input
 * concept — so the hook reports a constant false and an unsupported
 * modality instead of implying that pointer input was observed.
 */
export function useFocusVisible(): UseFocusVisibleResult {
	return { isFocusVisible: false, inputModality: 'unknown', isSupported: false };
}

/**
 * Global modality check — whether focus should show the visible-focus ring right now (keyboard modality).
 *
 * @see useFocusRing.
 */
export function isFocusVisible(): boolean {
	return false;
}
