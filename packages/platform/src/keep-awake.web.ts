import { desktopHostClient, desktopHostSupports } from './host-runtime.web'
import { KeepAwakeDefaultTag, type KeepAwakeImpl } from './keep-awake.types'
export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'

const tags = new Set<string>()
const sentinels = new Map<string, WakeLockSentinel>()
const hostTags = new Set<string>()
const listeners = new Set<(tag: string) => void>()
let pending = Promise.resolve(true)
const enqueue = (operation: () => Promise<boolean>) => {
	const next = pending.then(operation, operation).catch(() => false)
	pending = next
	return next
}

const browserAvailable = () => typeof navigator !== 'undefined' && !!navigator.wakeLock
async function acquire(tag: string): Promise<boolean> {
	if (sentinels.has(tag) || hostTags.has(tag)) {
		return true
	}

	if (await desktopHostSupports('keepAwake', 'activate')) {
		const result = await desktopHostClient()!.call('keepAwake', 'activate', tag)
		if (result) {
			hostTags.add(tag)
		}

		return result
	}

	if (!browserAvailable() || document.visibilityState !== 'visible') {
		return false
	}

	const sentinel = await navigator.wakeLock.request('screen')
	sentinels.set(tag, sentinel)
	sentinel.addEventListener('release', () => {
		if (sentinels.get(tag) !== sentinel) {
			return
		}

		sentinels.delete(tag)
		for (const listener of listeners) {
			listener(tag)
		}
	})

	return true
}

const visible = () => {
	if (document.visibilityState === 'visible') {
		void enqueue(async () => {
			for (const tag of tags) {
				try {
					await acquire(tag)
				} catch {
					/* retry on next visibility change */
				}
			}

			return true
		})
	}
}

export const keepAwake: KeepAwakeImpl = {
	activate: (tag = KeepAwakeDefaultTag) =>
		enqueue(async () => {
			if (!(await keepAwake.isAvailable())) {
				return false
			}

			if (!tags.size && typeof document !== 'undefined') {
				document.addEventListener('visibilitychange', visible)
			}

			tags.add(tag)
			// Keep the request on failure: visibility changes can retry it.
			return acquire(tag)
		}),
	deactivate: (tag = KeepAwakeDefaultTag) =>
		enqueue(async () => {
			if (hostTags.has(tag)) {
				if (!(await desktopHostClient()!.call('keepAwake', 'deactivate', tag))) {
					return false
				}

				hostTags.delete(tag)
			}

			const sentinel = sentinels.get(tag)
			if (sentinel) {
				await sentinel.release()
				sentinels.delete(tag)
			}

			tags.delete(tag)
			if (!tags.size && typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', visible)
			}

			return keepAwake.isAvailable()
		}),
	isActivated: () => pending.then(() => sentinels.size > 0 || hostTags.size > 0),
	isAvailable: async () =>
		browserAvailable() || (await desktopHostSupports('keepAwake', 'activate')),
	onRelease(listener) {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	},
}
