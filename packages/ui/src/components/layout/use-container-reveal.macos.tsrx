import './use-container-reveal.macos.css'
import type { UseContainerRevealOptions, UseContainerRevealReturn } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'

/** AppKit CSS pseudo states retain mounted actions and their layout slots.
 * Missing tracking keeps actions visible instead of hiding their only entry. */
export function useContainerReveal(options: UseContainerRevealOptions = {}): UseContainerRevealReturn {
	const enabled = () => options.isEnabled !== false && appKitHost()?.containerRevealSupported === true
	return {
		getContainerProps: () => enabled() ? { className: 'vx-appkit-reveal-container' } : {},
		getContentRevealProps: () => enabled() ? { className: 'vx-appkit-reveal-content' } : {},
	}
}
