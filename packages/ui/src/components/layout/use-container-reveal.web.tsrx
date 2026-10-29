import type { UseContainerRevealOptions, UseContainerRevealReturn } from '../../props'

/** CSS-scoped hover/focus reveal. Children remain mounted and tabbable.
 * Touch pointers always show actions; nested containers own their own state.
 * Import the shared UI stylesheet, as for other shared components. */
export function useContainerReveal(
	options: UseContainerRevealOptions = {},
): UseContainerRevealReturn {
	return {
		getContainerProps: () =>
			options.isEnabled === false ? {} : { className: 'xds-reveal-container' },
		getContentRevealProps: () =>
			options.isEnabled === false ? {} : { className: 'xds-reveal-content' },
	}
}
