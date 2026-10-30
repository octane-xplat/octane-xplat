import {
	NSObject,
	CADisplayLink,
	NSRunLoop,
	NSNotificationCenter,
	NSOperationQueue,
	UIScrollView,
} from '@octane-xplat/platform/ios'

import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type {
	FocusedInputState,
	FocusedInputScrollOwner,
} from '@octane-xplat/platform/focused-input-state'

import { focusRect, focusSelection, emptyFocus } from './focus-geometry'
import { focusPublisher } from './focus-publish'
import { keyboardNativeScope } from './native-scope'

/** MasonKit scroll containers are MasonUIView, not UIScrollView; mirror
 * MasonUIView.swift's vertical scrollability rule. */
const masonScrollsY = (view: any) => {
	const Mason = (globalThis as any).MasonUIView
	if (!Mason || !(view instanceof Mason)) {
		return false
	}
	const range = () => view.contentSize.height > view.bounds.size.height
	switch (view.overflowY) {
		case 2:
			return true
		case 4:
			return range()
		case 0:
			return !!view.isScrollContainer && range()
		default:
			return false
	}
}

export const focusRechecks: Map<object, () => void> = new Map<object, () => void>()
let Target: any
const targetFor = (read: () => void) => {
	if (!Target) {
		const interop = (globalThis as any).interop
		Target = (NSObject as any).extend(
			{
				['tick:'](this: any) {
					this.read?.()
				},
			},
			{ exposedMethods: { 'tick:': { returns: interop.types.void, params: [CADisplayLink] } } },
		)
	}
	const target = Target.new()
	target.read = read
	return target
}

const editing = (view: any): boolean =>
	!!view?.isFirstResponder && typeof view.caretRectForPosition === 'function'

const find = (view: any): any => {
	if (editing(view)) {
		return view
	}
	const children = view?.subviews
	for (let index = 0; index < (children?.count ?? 0); index++) {
		const found = find(children.objectAtIndex(index))
		if (found) {
			return found
		}
	}
	return null
}

/** Poll caret/layout while editing; standard UIKit notifications change identity.
 * No delegate replacement and no input text reads. */
export const observeFocusedInput: KeyboardWindowSource<FocusedInputState> = (key, notify) => {
	const window = key as any,
		scope = keyboardNativeScope(),
		publish = focusPublisher(notify)
	let active = true,
		input = find(window)
	scope.defer(() => {
		active = false
	})
	try {
		const read = () => {
			if (!active) {
				return
			}
			if (input && (!editing(input) || input.window !== window)) {
				input = null
			}
			const state = emptyFocus(focusRect(window.bounds), 'native-rect')
			if (!input) {
				publish(state)
				return
			}
			const box = input.hidden ? null : focusRect(input.convertRectToView(input.bounds, window))
			const range = input.selectedTextRange
			const selection = range
				? focusSelection(
						Number(input.offsetFromPositionToPosition(input.beginningOfDocument, range.start)),
						Number(input.offsetFromPositionToPosition(input.beginningOfDocument, range.end)),
					)
				: null
			const caret = range
				? focusRect(input.convertRectToView(input.caretRectForPosition(range.end), window))
				: null
			const owners: FocusedInputScrollOwner[] = []
			for (let view = input; view; view = view.superview) {
				const mason = masonScrollsY(view)
				if (!(view instanceof UIScrollView) && !mason) {
					continue
				}

				const rect = focusRect(view.convertRectToView(view.bounds, window))
				if (!rect) {
					continue
				}

				if (mason) {
					owners.push({
						id: view,
						rect,
						offsetY: view.mason_scrollTop,
						minOffsetY: 0,
						maxOffsetY: Math.max(0, view.mason_scrollHeight - view.mason_clientHeight),
					})

					continue
				}

				const inset = view.adjustedContentInset ?? view.contentInset
				const min = -(inset?.top ?? 0)
				owners.push({
					id: view,
					rect,
					offsetY: view.contentOffset.y,
					minOffsetY: min,
					maxOffsetY: Math.max(
						min,
						view.contentSize.height - view.bounds.size.height + (inset?.bottom ?? 0),
					),
				})
			}
			publish({
				...state,
				input,
				inputRect: box,
				caretRect: caret?.height ? caret : null,
				selection,
				scrollOwners: owners,
				capabilities: {
					inputBounds: !!box,
					caretBounds: caret?.height ? 'native-rect' : 'none',
					selection: !!selection,
				},
			})
		}

		const center = NSNotificationCenter.defaultCenter
		for (const name of [
			UITextFieldTextDidBeginEditingNotification,
			UITextViewTextDidBeginEditingNotification,
			UITextFieldTextDidEndEditingNotification,
			UITextViewTextDidEndEditingNotification,
		]) {
			const token = center.addObserverForNameObjectQueueUsingBlock(
				name,
				null,
				NSOperationQueue.mainQueue,
				(note: any) => {
					const candidate = note.object
					if (candidate?.window === window && editing(candidate)) {
						input = candidate
					} else if (candidate === input) {
						input = null
					}
				},
			)

			scope.defer(() => center.removeObserver(token))
		}

		const target = targetFor(read)
		const link = CADisplayLink.displayLinkWithTargetSelector(target, 'tick:')
		scope.defer(() => {
			target.read = undefined
			link.invalidate()
		})

		link.addToRunLoopForMode(NSRunLoop.mainRunLoop, 'kCFRunLoopCommonModes')
		focusRechecks.set(key, read)
		scope.defer(() => focusRechecks.delete(key))
		read()
		return () => scope.release()
	} catch (error) {
		scope.release()
		throw error
	}
}
