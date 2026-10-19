import {
	focusedInputWindows,
	unknownFocusedInputState,
} from '@octane-xplat/platform/focused-input-state'

import { observeFocusedInput, focusRechecks } from './focus-source'
import type { FocusRuntime } from './focus-runtime-types'

const inactive = unknownFocusedInputState()
const lifecycles = new WeakMap<Document, { readers: number; paused: boolean }>()
const view = (host: any): HTMLElement | undefined => host?.native ?? host
// A WindowProxy survives navigation; the document is its observation generation.
const owner = (host: object): Document | undefined => {
	const element = view(host),
		document = element?.ownerDocument,
		window = document?.defaultView
	try {
		return element?.isConnected &&
			window &&
			!window.closed &&
			window.document === document &&
			!lifecycles.get(document!)?.paused
			? document
			: undefined
	} catch {
		return undefined
	}
}

const watchWindow = (document: Document, rebind: () => void) => {
	const window = document.defaultView!
	let state = lifecycles.get(document)
	if (!state) {
		state = { readers: 0, paused: false }
		lifecycles.set(document, state)
	}
	const owned = state
	owned.readers++
	let active = true
	const hide = () => {
		if (active) {
			owned.paused = true
			rebind()
		}
	}
	const show = () => {
		if (active) {
			owned.paused = false
			rebind()
		}
	}
	window.addEventListener('pagehide', hide)
	window.addEventListener('pageshow', show)
	return () => {
		if (!active) {
			return
		}
		active = false
		window.removeEventListener('pagehide', hide)
		window.removeEventListener('pageshow', show)
		if (!--owned.readers) {
			lifecycles.delete(document)
		}
	}
}

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
		let key: Document | undefined,
			document: Document | undefined,
			initialized = false
		let observer: MutationObserver | undefined
		let offWindow = () => {}
		let off = () => {}
		const rebind = () => {
			if (!active) {
				return
			}
			const nextDocument = view(host)?.ownerDocument
			if (nextDocument !== document) {
				observer?.disconnect()
				offWindow()
				offWindow = () => {}
				document = nextDocument
				const Observer = document?.defaultView?.MutationObserver
				observer = Observer ? new Observer(rebind) : undefined
				if (document) {
					observer?.observe(document, { childList: true, subtree: true })
				}

				if (document?.defaultView) {
					offWindow = watchWindow(document, rebind)
				}
			}
			const next = owner(host)
			if (initialized && key === next) {
				return
			}
			initialized = true
			off()
			off = () => {}
			key = next
			if (next) {
				off = focusedInputWindows.subscribe(next, listener)
			} else {
				listener(inactive)
			}
		}
		try {
			rebind()
		} catch (error) {
			observer?.disconnect()
			offWindow()
			off()
			throw error
		}
		return () => {
			if (!active) {
				return
			}
			active = false
			observer?.disconnect()
			offWindow()
			off()
		}
	},
}
