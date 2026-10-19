import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type {
	FocusedInputState,
	FocusedInputScrollOwner,
} from '@octane-xplat/platform/focused-input-state'

import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'
import { emptyFocus, focusSelection } from './focus-geometry'
import { focusPublisher } from './focus-publish'
import { keyboardNativeScope } from './native-scope'

export const focusRechecks = new Map<object, () => void>()
const parentOf = (view: HTMLElement): HTMLElement | null =>
	view.assignedSlot ??
	view.parentElement ??
	((view.getRootNode() as ShadowRoot).host as HTMLElement | undefined) ??
	null

const rect = (value: DOMRect) => ({
	x: value.x,
	y: value.y,
	width: value.width,
	height: value.height,
})

const focused = (document: Document): Element | null => {
	let input = document.activeElement
	while (input?.shadowRoot?.activeElement) {
		input = input.shadowRoot.activeElement
	}
	return input
}

/** DOM geometry and selection metadata; value/textContent are never accessed. */
export const observeFocusedInput: KeyboardWindowSource<FocusedInputState> = (key, notify) => {
	const document = key as Document,
		window = document.defaultView!
	const scope = keyboardNativeScope(),
		publish = focusPublisher(notify)
	const currentDocument = () => {
		try {
			return !window.closed && window.document === document
		} catch {
			return false
		}
	}
	let active = true,
		frame = 0
	scope.defer(() => {
		active = false
		if (currentDocument()) {
			window.cancelAnimationFrame(frame)
		}
	})
	try {
		const read = () => {
			if (!active) {
				return
			}
			if (!currentDocument()) {
				scope.release()
				publish(unknownFocusedInputState())
				return
			}
			const state = emptyFocus(
				{ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
				'none',
			)
			const input = focused(document) as HTMLElement | null
			const textInput =
				input?.tagName === 'INPUT' &&
				['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(
					(input as HTMLInputElement).type,
				)
			if (
				!input?.isConnected ||
				!(textInput || input.tagName === 'TEXTAREA' || input.isContentEditable)
			) {
				publish(state)
				return
			}
			const control = input as HTMLInputElement | HTMLTextAreaElement
			const selection =
				typeof control.selectionStart === 'number' && typeof control.selectionEnd === 'number'
					? focusSelection(control.selectionStart, control.selectionEnd)
					: null
			let caret: FocusedInputState['caretRect'] = null
			if (input.isContentEditable) {
				const selected = document.getSelection()
				if (selected?.rangeCount && input.contains(selected.focusNode)) {
					const range = selected.getRangeAt(0).cloneRange()
					range.collapse(false)
					const value = range.getBoundingClientRect()
					if (value.height > 0) {
						caret = rect(value)
					}
				}
			}
			const owners: FocusedInputScrollOwner[] = []
			for (let parent = parentOf(input); parent; parent = parentOf(parent)) {
				const overflow = window.getComputedStyle(parent).overflowY
				if (
					!['auto', 'scroll', 'overlay'].includes(overflow) &&
					parent !== document.scrollingElement
				) {
					continue
				}

				const box = parent.getBoundingClientRect()
				owners.push({
					id: parent,
					rect:
						parent === document.scrollingElement
							? { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
							: {
									x: box.x + parent.clientLeft,
									y: box.y + parent.clientTop,
									width: parent.clientWidth,
									height: parent.clientHeight,
								},
					offsetY: parent.scrollTop,
					minOffsetY: 0,
					maxOffsetY: Math.max(0, parent.scrollHeight - parent.clientHeight),
				})
			}
			publish({
				...state,
				input,
				inputRect: rect(input.getBoundingClientRect()),
				caretRect: caret,
				selection,
				scrollOwners: owners,
				capabilities: {
					inputBounds: true,
					caretBounds: caret ? 'native-rect' : 'none',
					selection: !!selection,
				},
			})
		}

		const tick = () => {
			read()
			if (active) {
				frame = window.requestAnimationFrame(tick)
			}
		}

		focusRechecks.set(key, read)
		scope.defer(() => focusRechecks.delete(key))
		read()
		frame = window.requestAnimationFrame(tick)
		return () => scope.release()
	} catch (error) {
		scope.release()
		throw error
	}
}
