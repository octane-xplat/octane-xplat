import { createTaggedKeepAwake } from './keep-awake-tags'
export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'

type ProcessActivity = {
	beginActivityWithOptionsReason(options: number, reason: string): unknown
	endActivity(token: unknown): void
}
declare const NSProcessInfo: { processInfo: ProcessActivity }

function processActivity(): ProcessActivity | undefined {
	if (typeof NSProcessInfo === 'undefined' || NSProcessInfo == null) return
	const owner = NSProcessInfo.processInfo
	return owner && typeof owner.beginActivityWithOptionsReason === 'function' &&
		typeof owner.endActivity === 'function' ? owner : undefined
}

// Preserve the 64-bit display flag: JS bitwise operators truncate to 32 bits.
// Foundation's existing options permit idle system sleep.
const displayActivityOptions = 0x00efffff + 2 ** 40
const tokens = new Map<string, { owner: ProcessActivity; token: unknown; release: ProcessActivity['endActivity'] }>()
export const keepAwake = createTaggedKeepAwake({
	available: () => !!processActivity(),
	activate(tag) {
		const owner = processActivity()
		if (!owner) return false
		const release = owner.endActivity
		const token = owner.beginActivityWithOptionsReason(displayActivityOptions, tag)
		if (!token) return false
		tokens.set(tag, { owner, token, release })
		return true
	},
	deactivate(tag) {
		const held = tokens.get(tag)
		if (held) {
			// The activity belongs to the process object/method that created it,
			// even after the global bridge is replaced or disappears.
			held.release.call(held.owner, held.token)
			tokens.delete(tag)
		}
		return true
	},
})
