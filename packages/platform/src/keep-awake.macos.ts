import { createTaggedKeepAwake } from './keep-awake-tags'
export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'

declare const NSProcessInfo: {
	processInfo: {
		beginActivityWithOptionsReason(options: number, reason: string): unknown
		endActivity(token: unknown): void
	}
}

// Foundation's display-only options; permit idle system sleep.
const tokens = new Map<string, unknown>()
export const keepAwake = createTaggedKeepAwake({
	available: () => typeof NSProcessInfo !== 'undefined',
	activate(tag) {
		const token = NSProcessInfo.processInfo.beginActivityWithOptionsReason(
			0x00efffff + 2 ** 40,
			tag,
		)

		if (!token) {
			return false
		}

		tokens.set(tag, token)
		return true
	},
	deactivate(tag) {
		const token = tokens.get(tag)
		if (token) {
			NSProcessInfo.processInfo.endActivity(token)
		}

		tokens.delete(tag)
		return true
	},
})
