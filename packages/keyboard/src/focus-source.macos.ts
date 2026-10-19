import { NSScrollView } from '@octane-xplat/platform/macos'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type {
	FocusedInputState,
	FocusedInputScrollOwner,
} from '@octane-xplat/platform/focused-input-state'

import { emptyFocus, focusRect, focusSelection } from './focus-geometry'
import { focusPublisher } from './focus-publish'
import { keyboardNativeScope } from './native-scope'
import { startFocusClock } from './focus-clock'

export const focusRechecks = new Map<object, () => void>()
const flipped = (view: any): boolean =>
	typeof view?.isFlipped === 'function' ? view.isFlipped() : !!view?.isFlipped

/** AppKit input/field-editor geometry, normalized to content-window top-left. */
export const observeFocusedInput: KeyboardWindowSource<FocusedInputState> = (key, notify) => {
	const window = key as any,
		scope = keyboardNativeScope(),
		publish = focusPublisher(notify)
	let active = true
	scope.defer(() => {
		active = false
	})
	try {
		const read = () => {
			if (!active) {
				return
			}
			const root = window.contentView
			const box = focusRect(root?.bounds)
			const state = emptyFocus(box && { ...box, x: 0, y: 0 }, 'native-rect')
			const editor = window.firstResponder
			if (!root || !editor || typeof editor.firstRectForCharacterRangeActualRange !== 'function') {
				publish(state)
				return
			}
			const candidate = editor.delegate
			const input =
				candidate?.window === window && typeof candidate.convertRectToView === 'function'
					? candidate
					: editor
			if (input.window !== window) {
				publish(state)
				return
			}
			const normalize = (value: any) => {
				const rect = focusRect(value)
				return (
					rect &&
					(flipped(root) ? rect : { ...rect, y: root.bounds.size.height - rect.y - rect.height })
				)
			}
			const range = editor.selectedRange
			const selection = range
				? focusSelection(Number(range.location), Number(range.location) + Number(range.length))
				: null
			const caretScreen = selection
				? editor.firstRectForCharacterRangeActualRange({ location: selection.end, length: 0 }, null)
				: null
			const caret = caretScreen
				? normalize(root.convertRectFromView(window.convertRectFromScreen(caretScreen), null))
				: null
			const owners: FocusedInputScrollOwner[] = []
			for (let parent = input; parent; parent = parent.superview) {
				if (!(parent instanceof NSScrollView) || !parent.documentView) {
					continue
				}

				const clip = parent.contentView,
					content = parent.documentView

				const rect = normalize(clip.convertRectToView(clip.bounds, root))
				if (!rect) {
					continue
				}

				const max = Math.max(0, content.bounds.size.height - clip.bounds.size.height)
				owners.push({
					id: parent,
					rect,
					offsetY: flipped(content) ? clip.bounds.origin.y : max - clip.bounds.origin.y,
					minOffsetY: 0,
					maxOffsetY: max,
				})
			}
			const inputRect = normalize(input.convertRectToView(input.bounds, root))
			publish({
				...state,
				input,
				inputRect,
				caretRect: caret?.height ? caret : null,
				selection,
				scrollOwners: owners,
				capabilities: {
					inputBounds: !!inputRect,
					caretBounds: caret?.height ? 'native-rect' : 'none',
					selection: !!selection,
				},
			})
		}

		scope.defer(startFocusClock(read))
		focusRechecks.set(key, read)
		scope.defer(() => focusRechecks.delete(key))
		read()
		return () => scope.release()
	} catch (error) {
		scope.release()
		throw error
	}
}
