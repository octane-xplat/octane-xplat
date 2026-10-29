import type { UseContainerRevealOptions, UseContainerRevealReturn } from '../../props'

/** Fallback for native hosts without hover/focus reveal: secondary actions
 * stay visible. AppKit selects its dedicated CSS-state leaf. */
export function useContainerReveal(
	_options: UseContainerRevealOptions = {},
): UseContainerRevealReturn {
	return { getContainerProps: () => ({}), getContentRevealProps: () => ({}) }
}
