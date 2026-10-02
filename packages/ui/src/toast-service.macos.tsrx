/** @jsxImportSource @xplat/macos/renderer */
import { useCallback } from 'octane'
import type { ShowToastFn } from './props'

/** macOS coverage: the AppKit target has no toast stack service — calls
 *  warn and no-op (same coverage class as the previous toast stub). */
export const showToast: ShowToastFn = () => {
	console.warn('[octane-xplat] Toast display is unsupported by the experimental AppKit target.')
	return () => {}
}

export function useToast(): ShowToastFn {
	return useCallback(
		() => {
			console.warn('[octane-xplat] Toast display is unsupported by the experimental AppKit target.')
			return () => {}
		},
		[],
	)
}
