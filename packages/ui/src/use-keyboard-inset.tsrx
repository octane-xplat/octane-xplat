/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import { subscribeKeyboardInset } from './keyboard-inset'
import type { UseKeyboardInsetOptions } from './props'

/**
 * Software keyboard bottom inset in device-independent pixels (iOS points).
 * iOS converts the keyboard destination into the active window and reports
 * full-width bottom overlap; a floating or narrow keyboard reports zero.
 * Android reads the foreground Activity window's IME inset minus system bars
 * and leases adjustResize until the last consumer unmounts. Do not add the
 * returned Android inset as padding to a window already resized for the IME.
 * Android returns zero until root window insets are available; if AndroidX
 * inset support is absent, resize avoidance still runs but the value stays zero.
 * Returns zero on web and desktop. An already-visible iOS keyboard is read
 * from the public keyboard guide when available; older hosts without that
 * guide need a reader mounted before the frame notification.
 * Native subscriptions are released on unmount. Activity resume rebinds to the
 * current foreground window. This scalar is not a focused-input occlusion test.
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
