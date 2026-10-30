import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { UseKeyboardOptions } from '../../internal/keyboard/use-keyboard.types'
import { appKitHost } from '../../internal/platform/host-bridge'
import type { NSView } from '@octane-xplat/platform/macos'

/** Private composed-control attachment to an existing concrete host, without a wrapper. */
export function useAppKitViewKeys(options: UseKeyboardOptions): {
	ref: (view: NSView | null) => void
	isSupported: boolean
} {
	const latest = useRef(options),
		current = useRef<NSView | null>(null),
		release = useRef<(() => void) | null>(null)

	latest.current = options
	const bridge = appKitHost(),
		observe = bridge?.observeViewKeys

	const isSupported = Boolean(bridge?.keyboardEventsSupported && typeof observe === 'function')
	const ref = useCallback(
		(view: NSView | null) => {
			release.current?.()
			release.current = null
			current.current = view
			if (!view || !isSupported) {
				return
			}

			const invoke = (name: 'onKeyDown' | 'onKeyUp', event: NativeKeyboardEvent<NSView>) => {
				// Descendant endContent controls keep their own keys.
				if (current.current === view && event.target === view) {
					latest.current[name]?.(event)
				}
			}

			const off = observe(view, {
				onKeyDown: (event: NativeKeyboardEvent<NSView>) => invoke('onKeyDown', event),
				onKeyUp: (event: NativeKeyboardEvent<NSView>) => invoke('onKeyUp', event),
			})

			if (typeof off !== 'function') {
				throw new Error('AppKit view keyboard ownership unavailable')
			}

			release.current = off
		},
		[observe, isSupported],
	)

	useLayoutEffect(
		() => () => {
			current.current = null
			release.current?.()
			release.current = null
		},
		[],
	)

	return { ref, isSupported }
}
