/**
 * Native counterpart of use-focus-visible.web.tsrx. There is no
 * pointer-vs-keyboard modality on native — focus-visible is a web input
 * concept — so the hook reports a constant false. The API shape is
 * identical; the divergence is intrinsic to the platform, not silent.
 */
export function useFocusVisible(): { isFocusVisible: boolean } {
	return { isFocusVisible: false };
}

/**
 * Global modality check — whether focus should show the visible-focus ring right now (keyboard modality).
 *
 * @see useFocusRing.
 */
export function isFocusVisible(): boolean {
	return false;
}
