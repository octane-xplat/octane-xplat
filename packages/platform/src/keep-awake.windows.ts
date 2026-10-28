import { Application, Utils } from '@nativescript/core'
import { Windows } from '@octane-xplat/platform/windows'
import { KeepAwakeDefaultTag, type KeepAwakeImpl } from './keep-awake.types'

export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'

type DisplayRequest = { RequestActive(): void; RequestRelease(): void }
const tags = new Set<string>()
let request: DisplayRequest | null = null
let listening = false
let removeApp: (() => void) | null = null
let suspended = false
let exited = false
let pending = Promise.resolve(false)

function available(): boolean {
	try {
		return (
			typeof Windows?.System?.Display?.DisplayRequest === 'function' &&
			typeof Utils.dispatchToMainThread === 'function'
		)
	} catch {
		return false
	}
}

/** DisplayRequest is apartment-bound; serialize creation and calls on the UI thread. */
function enqueue(operation: () => boolean): Promise<boolean> {
	const result = pending.then(
		() =>
			new Promise<boolean>((resolve) => {
				try {
					Utils.dispatchToMainThread(() => {
						try {
							resolve(operation())
						} catch {
							resolve(false)
						}
					})
				} catch {
					resolve(false)
				}
			}),
	)
	pending = result
	return result
}

function acquire(): boolean {
	if (request) {
		return true
	}
	try {
		const next = new Windows.System.Display.DisplayRequest()
		if (typeof next.RequestActive !== 'function' || typeof next.RequestRelease !== 'function') {
			return false
		}

		next.RequestActive()
		request = next
		return true
	} catch {
		return false
	}
}

function release(): boolean {
	if (!request) {
		return true
	}
	try {
		request.RequestRelease()
		request = null
		return true
	} catch {
		// Keep the owned request so a failed release can be retried.
		return false
	}
}

const suspend = () => {
	if (!listening) {
		return
	}
	suspended = true
	void enqueue(release)
}

const resume = () => {
	if (!listening || exited) {
		return
	}
	suspended = false
	void enqueue(() => !tags.size || suspended || exited || acquire())
}

const exit = () => {
	if (!listening) {
		return
	}
	exited = true
	suspended = true
	void enqueue(() => {
		if (!release()) {
			return false
		}
		tags.clear()
		unlisten()
		return true
	})
}

function listen(): boolean {
	if (listening) {
		return true
	}
	suspended = Application.suspended === true
	let owned = true
	const guard = (callback: () => void) => () => {
		if (owned) {
			callback()
		}
	}
	const events: [string, () => void][] = [
		[Application.suspendEvent, guard(suspend)],
		[Application.resumeEvent, guard(resume)],
		[Application.exitEvent, guard(exit)],
	]
	removeApp = () => {
		owned = false
		for (const [name, callback] of events) {
			try {
				Application.off(name, callback)
			} catch {}
		}
	}
	listening = true
	try {
		for (const [name, callback] of events) {
			Application.on(name, callback)
		}

		return true
	} catch {
		unlisten()
		return false
	}
}

function unlisten() {
	if (!listening) {
		return
	}
	listening = false
	removeApp?.()
	removeApp = null
}

/** Deduplicated tags share one foreground display request, never a CPU wake lock. */
export const keepAwake: KeepAwakeImpl = {
	activate: (tag = KeepAwakeDefaultTag) =>
		enqueue(() => {
			if (exited || !available()) {
				return false
			}
			if (!listen()) {
				return false
			}
			if (!suspended && !acquire()) {
				if (!tags.size) {
					unlisten()
				}

				return false
			}
			tags.add(tag)
			return true
		}),
	deactivate: (tag = KeepAwakeDefaultTag) =>
		enqueue(() => {
			if (!tags.has(tag)) {
				return available()
			}
			if (tags.size === 1 && !release()) {
				return false
			}
			tags.delete(tag)
			if (!tags.size) {
				unlisten()
			}
			return true
		}),
	isActivated: () => pending.then(() => request !== null && !suspended && !exited),
	isAvailable: async () => available(),
}
