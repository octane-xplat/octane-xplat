import type { ShortcutEvent, ShortcutPlatform } from './engine/types/public.js'
import { delay, type ShortcutHost } from './host-types.js'

function documentFor(target: object): Document {
	const node = target as Node
	const owner = node.nodeType === 9 ? (node as Document) : node.ownerDocument
	if (!owner || typeof node.addEventListener !== 'function') {
		throw new TypeError('Shortcuts require a Document or DOM element target')
	}
	return owner
}

export const host: ShortcutHost = {
	delay,
	platform(): ShortcutPlatform {
		const platform = typeof navigator === 'undefined' ? '' : navigator.platform.toLowerCase()
		if (/mac|iphone|ipad|ipod/.test(platform)) {
			return 'mac'
		}
		if (platform.includes('win')) {
			return 'windows'
		}
		return platform.includes('linux') ? 'linux' : 'other'
	},
	subscribe(target, callbacks) {
		const owner = documentFor(target)
		const boundary = target as Document | HTMLElement
		let active = true
		const key = (event: Event) => {
			// Use the target's realm: keyboard input may originate in an iframe.
			if (active && event instanceof owner.defaultView!.KeyboardEvent) {
				callbacks.key(event as KeyboardEvent)
			}
		}
		const capture = (event: Event) => {
			if (active && event instanceof owner.defaultView!.KeyboardEvent) {
				callbacks.capture?.(event as KeyboardEvent)
			}
		}
		const reset = () => {
			if (active) {
				callbacks.reset()
			}
		}
		const hidden = () => {
			if (owner.hidden) {
				reset()
			}
		}
		boundary.addEventListener('keydown', key)
		boundary.addEventListener('keyup', key)
		if (callbacks.capture) {
			boundary.addEventListener('keydown', capture, true)
		}
		owner.defaultView?.addEventListener('blur', reset)
		owner.addEventListener('visibilitychange', hidden)
		return () => {
			if (!active) {
				return
			}
			active = false
			boundary.removeEventListener('keydown', key)
			boundary.removeEventListener('keyup', key)
			boundary.removeEventListener('keydown', capture, true)
			owner.defaultView?.removeEventListener('blur', reset)
			owner.removeEventListener('visibilitychange', hidden)
		}
	},
	boundaryDepth(target, event: ShortcutEvent) {
		if (!target || (target as Node).nodeType === 9) {
			return Infinity
		}
		const path = event.composedPath?.() ?? []
		if (path.length) {
			const index = path.indexOf(target)
			return index < 0 ? undefined : index
		}
		let depth = 0
		for (let node = event.target as Node | null; node; node = node.parentNode) {
			if (node === target) {
				return depth
			}
			depth++
		}
		return undefined
	},
	isEditableTarget(target) {
		for (let node = target as HTMLElement | null; node; node = node.parentElement) {
			if (
				/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) ||
				node.isContentEditable ||
				node.getAttribute?.('contenteditable') === '' ||
				node.getAttribute?.('contenteditable') === 'true'
			) {
				return true
			}
			if (node.getAttribute?.('contenteditable') === 'false') {
				return false
			}
		}
		return false
	},
}
