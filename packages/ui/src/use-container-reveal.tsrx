import type { UseContainerRevealOptions, UseContainerRevealReturn } from './props'

/** Touch-host equivalent: secondary actions stay visible. Desktop native
 * hover/focus reveal is not implemented; never hide an unavailable action. */
export function useContainerReveal(
	_options: UseContainerRevealOptions = {},
): UseContainerRevealReturn {
	return { getContainerProps: () => ({}), getContentRevealProps: () => ({}) }
}
