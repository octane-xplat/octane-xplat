import { keyboardWindows } from '@octane-xplat/platform/keyboard-state'
import { installKeyboardViewportAdapter } from '@octane-xplat/platform/keyboard-viewport'
import {
	keyboardHostDisplacement,
	keyboardSnapshotForHost,
	observeKeyboardDestination,
	subscribeKeyboardState,
} from '@octane-xplat/ui/nativescript/keyboard'

import { observeKeyboardMotion } from './source'
import type { KeyboardRuntime } from './runtime-types'
import { leaseKeyboardViewport } from './viewport'

export const keyboardRuntime: KeyboardRuntime = {
	activate() {
		const offViewport = installKeyboardViewportAdapter(leaseKeyboardViewport)
		let offSource: () => void
		try {
			offSource = keyboardWindows.install(observeKeyboardMotion ?? observeKeyboardDestination)
		} catch (error) {
			offViewport()
			throw error
		}
		let active = true
		return () => {
			if (!active) {
				return
			}
			active = false
			try {
				offSource()
			} finally {
				offViewport()
			}
		}
	},
	subscribe: (host, listener) => subscribeKeyboardState(listener, host, false),
	getSnapshot: keyboardSnapshotForHost,
	property(host: any) {
		return host?.nativeViewProtected
			? {
					read: () => Number(host.translateY) || 0,
					write: (value) => {
						host.translateY = value
					},
				}
			: null
	},
	overlap: keyboardHostDisplacement,
}
