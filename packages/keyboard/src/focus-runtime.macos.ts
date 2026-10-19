import {
	focusedInputWindows,
	unknownFocusedInputState,
} from '@octane-xplat/platform/focused-input-state'

import { observeFocusedInput, focusRechecks } from './focus-source'
import { startFocusClock } from './focus-clock'
import type { FocusRuntime } from './focus-runtime-types'

const inactive = unknownFocusedInputState()
const owner = (host: any): object | undefined => (host?.native ?? host)?.window ?? undefined

export const focusRuntime: FocusRuntime = {
	activate: () => focusedInputWindows.install(observeFocusedInput),
	getSnapshot(host) {
		const key = owner(host)
		return key ? focusedInputWindows.getSnapshot(key) : inactive
	},
	recheck(host) {
		const key = owner(host)
		if (key) {
			focusRechecks.get(key)?.()
		}
	},
	subscribe(host, listener) {
		let active = true
		let key: object | undefined,
			initialized = false
		let off = () => {}
		const rebind = () => {
			if (!active) {
				return
			}
			const next = owner(host)
			if (initialized && key === next) {
				return
			}
			initialized = true
			key = next
			off()
			off = () => {}
			if (next) {
				off = focusedInputWindows.subscribe(next, listener)
			} else {
				listener(inactive)
			}
		}
		rebind()
		let stop: () => void
		try {
			stop = startFocusClock(rebind)
		} catch (error) {
			off()
			throw error
		}
		return () => {
			active = false
			stop()
			off()
		}
	},
}
