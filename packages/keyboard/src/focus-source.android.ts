import { Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type {
	FocusedInputState,
	FocusedInputScrollOwner,
} from '@octane-xplat/platform/focused-input-state'

import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import { emptyFocus, focusSelection } from './focus-geometry'
import { focusPublisher } from './focus-publish'
import { keyboardNativeScope } from './native-scope'

export const focusRechecks = new Map<object, () => void>()
const dip = (value: number) => Utils.layout.toDeviceIndependentPixels(value)
const location = (view: any) => {
	const xy = (Array as any).create('int', 2)
	view.getLocationOnScreen(xy)
	return { x: xy[0], y: xy[1] }
}

const bounds = (
	view: any,
	decor: any,
	box = { x: 0, y: 0, width: view.getWidth(), height: view.getHeight() },
): KeyboardRect | null => {
	const origin = location(decor)
	if (typeof view.transformMatrixToGlobal === 'function') {
		const matrix = new android.graphics.Matrix()
		view.transformMatrixToGlobal(matrix)
		const rect = new android.graphics.RectF(box.x, box.y, box.x + box.width, box.y + box.height)
		matrix.mapRect(rect)
		return {
			x: dip(rect.left - origin.x),
			y: dip(rect.top - origin.y),
			width: dip(rect.width()),
			height: dip(rect.height()),
		}
	}
	for (let parent = view; parent?.getMatrix; parent = parent.getParent?.()) {
		if (!parent.getMatrix().isIdentity()) {
			return null
		}
	}
	const at = location(view)
	return {
		x: dip(at.x - origin.x + box.x),
		y: dip(at.y - origin.y + box.y),
		width: dip(box.width),
		height: dip(box.height),
	}
}

/** Own multicast draw listeners; selection/layout changes never require text reads. */
export const observeFocusedInput: KeyboardWindowSource<FocusedInputState> = (key, notify) => {
	const decor = key as any,
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
			const state = emptyFocus(
				{ x: 0, y: 0, width: dip(decor.getWidth()), height: dip(decor.getHeight()) },
				'insertion-line',
			)
			const input = decor.findFocus?.()
			if (
				!input ||
				!(input instanceof android.widget.EditText) ||
				typeof input.getSelectionEnd !== 'function' ||
				input.getRootView() !== decor ||
				!input.isAttachedToWindow()
			) {
				publish(state)
				return
			}
			const selection = focusSelection(input.getSelectionStart(), input.getSelectionEnd())
			const layout = input.getLayout?.()
			let caret: KeyboardRect | null = null
			if (selection && layout?.getLineCount() > 0) {
				const end = Math.min(selection.end, layout.getLineEnd(layout.getLineCount() - 1))
				const line = layout.getLineForOffset(end)
				caret = bounds(input, decor, {
					x: layout.getPrimaryHorizontal(end) + input.getTotalPaddingLeft() - input.getScrollX(),
					y: layout.getLineTop(line) + input.getTotalPaddingTop() - input.getScrollY(),
					width: 1,
					height: layout.getLineBottom(line) - layout.getLineTop(line),
				})
			}
			const owners: FocusedInputScrollOwner[] = []
			for (let parent: any = input.getParent(); parent?.getParent; parent = parent.getParent()) {
				const nested = (globalThis as any).androidx?.core?.widget?.NestedScrollView
				if (
					!(parent instanceof android.widget.ScrollView) &&
					!(nested && parent instanceof nested)
				) {
					continue
				}

				const rect = bounds(parent, decor),
					child = parent.getChildAt(0)

				if (!rect || !child) {
					continue
				}

				owners.push({
					id: parent,
					rect,
					offsetY: dip(parent.getScrollY()),
					minOffsetY: 0,
					maxOffsetY: dip(
						Math.max(
							0,
							child.getHeight() +
								parent.getPaddingTop() +
								parent.getPaddingBottom() -
								parent.getHeight(),
						),
					),
				})
			}
			const box = bounds(input, decor)
			publish({
				...state,
				input,
				inputRect: box,
				caretRect: caret,
				selection,
				scrollOwners: owners,
				capabilities: {
					inputBounds: !!box,
					caretBounds: caret ? 'insertion-line' : 'none',
					selection: !!selection,
				},
			})
		}

		const listener = new android.view.ViewTreeObserver.OnPreDrawListener({
			onPreDraw() {
				read()
				return true
			},
		})

		decor.getViewTreeObserver().addOnPreDrawListener(listener)
		scope.defer(() => {
			const tree = decor.getViewTreeObserver()
			if (tree.isAlive()) {
				tree.removeOnPreDrawListener(listener)
			}
		})

		focusRechecks.set(key, read)
		scope.defer(() => focusRechecks.delete(key))
		read()
		return () => scope.release()
	} catch (error) {
		scope.release()
		throw error
	}
}
