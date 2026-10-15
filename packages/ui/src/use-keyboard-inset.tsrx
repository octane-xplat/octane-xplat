/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useState } from 'octane'
import { subscribeKeyboardInset } from './keyboard-inset'
import type { UseKeyboardInsetOptions } from './props'

/**
 * Software keyboard bottom inset in device-independent pixels (iOS points).
 * iOS shares a screen-bottom frame observer with bottom-anchored overlays.
 * Android reads the foreground Activity window's IME inset minus system bars
 * and leases adjustResize until the last consumer unmounts. Do not add the
 * returned Android inset as padding to a window already resized for the IME.
 * Android returns zero until root window insets are available; if AndroidX
 * inset support is absent, resize avoidance still runs but the value stays zero.
 * Returns zero on web and desktop. Mount before opening the keyboard on iOS;
 * an already-visible frame is retained only while a reader or overlay is bound.
 * Native subscriptions are released on unmount. Activity replacement requires
 * remounting the consumer. Floating keyboards are not an occlusion measurement.
 * `{ enabled: false }` reads 0 without subscribing — no iOS frame observer or
 * Android resize lease runs while disabled.
 * @example
 * const keyboardInset = useKeyboardInset()
 */
export function useKeyboardInset(options: UseKeyboardInsetOptions = {}): number {
	const enabled = options.enabled ?? true
	const [inset, setInset] = useState(0)
	useEffect(() => {
		if (!enabled) {
			setInset(0)
			return
		}

		return subscribeKeyboardInset(setInset)
	}, [enabled])

	return inset
}
