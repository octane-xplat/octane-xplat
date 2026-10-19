import {
	focusedInputWindows,
	unknownFocusedInputState,
} from '@octane-xplat/platform/focused-input-state'

import {
	keyboardWindowForHost,
	subscribeKeyboardState,
} from '@octane-xplat/ui/nativescript/keyboard'

import { observeFocusedInput, focusRechecks } from './focus-source'
import type { FocusRuntime } from './focus-runtime-types'

const inactive = unknownFocusedInputState()
const unwrap = (host: any) => host?.native ?? host

export const focusRuntime: FocusRuntime = {
	activate: () => focusedInputWindows.install(observeFocusedInput),
	getSnapshot(host) {
		const key = keyboardWindowForHost(unwrap(host))
		return key ? focusedInputWindows.getSnapshot(key) : inactive
	},
	recheck(host) {
		const key = keyboardWindowForHost(unwrap(host))
		if (key) {
			focusRechecks.get(key)?.()
		}
	},
	subscribe(host, listener) {
		let key: object | undefined
		let offFocus = () => {}
		let initialized = false
		const offWindow = subscribeKeyboardState(
			(_state, next) => {
				if (initialized && key === next) {
					return
				}
				initialized = true
				offFocus()
				key = next
				offFocus = next ? focusedInputWindows.subscribe(next, listener) : () => {}
				if (!next) {
					listener(inactive)
				}
			},
			unwrap(host),
			false,
		)
		return () => {
			try {
				offWindow()
			} finally {
				offFocus()
			}
		}
	},
}
