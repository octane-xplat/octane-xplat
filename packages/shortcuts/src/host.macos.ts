import type { ShortcutEvent } from './engine/types/public.js'
import { cleanupAll, delay, pathDepth, pathFrom, unwrap, type ShortcutHost } from './host-types.js'

// The renderer owns AppKit's shared monitor, field-editor routing and FocusScope ordering.
const bridge = () => (globalThis as any).__xplatAppKit

export const host: ShortcutHost = {
	delay,
	platform: () => 'mac',
	boundaryDepth: pathDepth,
	isEditableTarget(target) {
		const view = target as any
		return Boolean(
			view &&
			(typeof view.currentEditor === 'function' ||
				view.isEditable === true ||
				(typeof view.isEditable === 'function' && view.isEditable())),
		)
	},
	subscribe(target, callbacks) {
		const view = unwrap(target)
		const api = bridge()
		if (!view?.window || !api?.keyboardEventsSupported || !api.observeViewKeys) {
			throw new Error('Shortcuts require an attached AppKit renderer view and its keyboard bridge')
		}
		const releases: (() => void)[] = []
		let active = true
		const receive = (type: string, input: any) => {
			if (!active) {
				return
			}
			const path = pathFrom(input.target, (node) => node.superview ?? node.window)
			const event: ShortcutEvent = {
				type,
				key: input.key,
				code: input.code,
				target: input.target,
				altKey: input.altKey,
				ctrlKey: input.ctrlKey,
				metaKey: input.metaKey,
				shiftKey: input.shiftKey,
				repeat: input.repeat,
				isComposing: input.isComposing,
				get defaultPrevented() {
					return input.defaultPrevented
				},
				preventDefault: () => input.preventDefault(),
				stopPropagation: () => input.stopPropagation(),
				composedPath: () => [...path],
			}
			if (type === 'keydown') {
				callbacks.capture?.(event)
			}
			callbacks.key(event)
		}
		try {
			releases.push(
				api.observeViewKeys(view, {
					onKeyDown: (event: unknown) => receive('keydown', event),
					onKeyUp: (event: unknown) => receive('keyup', event),
				}),
			)
			const native = globalThis as any
			const center = native.NSNotificationCenter?.defaultCenter
			if (center) {
				for (const name of ['NSWindowDidResignKeyNotification', 'NSWindowWillCloseNotification']) {
					const token = center.addObserverForNameObjectQueueUsingBlock(
						name,
						view.window,
						null,
						() => {
							if (active) {
								callbacks.reset()
							}
						},
					)
					releases.push(() => center.removeObserver(token))
				}
			}
		} catch (error) {
			active = false
			cleanupAll(releases)
			throw error
		}
		return () => {
			if (active) {
				active = false
				cleanupAll(releases)
			}
		}
	},
}
