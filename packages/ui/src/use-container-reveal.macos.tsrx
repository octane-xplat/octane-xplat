import type { UseContainerRevealOptions, UseContainerRevealReturn } from './props'
import { appKitHost } from './host-bridge'

/** AppKit CSS pseudo states retain mounted actions and their layout slots.
 * Missing tracking keeps actions visible instead of hiding their only entry. */
export function useContainerReveal(options: UseContainerRevealOptions = {}): UseContainerRevealReturn {
	const enabled = () => options.isEnabled !== false && appKitHost()?.containerRevealSupported === true
	return {
		getContainerProps: () => enabled() ? { className: 'vx-appkit-reveal-container' } : {},
		getContentRevealProps: () => enabled() ? { className: 'vx-appkit-reveal-content' } : {},
	}
}
<style>
	.vx-appkit-reveal-container { --vx-appkit-reveal-opacity: 0; }
	.vx-appkit-reveal-container:hover { --vx-appkit-reveal-opacity: 1; }
	.vx-appkit-reveal-container:focus-within { --vx-appkit-reveal-opacity: 1; }
	.vx-appkit-reveal-content { opacity: var(--vx-appkit-reveal-opacity, 1); }
</style>
