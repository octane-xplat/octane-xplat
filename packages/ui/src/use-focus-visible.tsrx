/** Input modality observed by the focus-visible tracker. The default mobile
 * leaf reports unknown; web and AppKit have dedicated input trackers. */
export type FocusInputModality = 'keyboard' | 'pointer' | 'unknown'

/** Result of `useFocusVisible` on every target. Check isSupported before
 * relying on modality; default mobile leaves report false and unknown. */
export interface UseFocusVisibleResult {
	isFocusVisible: boolean
	inputModality: FocusInputModality
	isSupported: boolean
}

/**
 * Default mobile counterpart of use-focus-visible.web.tsrx. This leaf has
 * no shared hardware-input observer and reports false/unknown. AppKit uses
 * its own leaf; physical keyboard/pointer input is meaningful on desktop.
 */
export function useFocusVisible(): UseFocusVisibleResult {
	return { isFocusVisible: false, inputModality: 'unknown', isSupported: false }
}

/**
 * Global modality check — whether focus should show the visible-focus ring right now (keyboard modality).
 *
 * @see useFocusRing.
 */
export function isFocusVisible(): boolean {
	return false
}
