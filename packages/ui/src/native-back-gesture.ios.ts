import { GestureStateTypes } from '@nativescript/core'
import type { EventData, Frame, Page, PanGestureEventData } from '@nativescript/core'
import type { UIView, UIPanGestureRecognizer } from '@octane-xplat/platform/ios'
import type { NativeBackGestureOptions } from './native-back-gesture-types'

// The SDK's ambient UIKit const enums are unavailable under verbatimModuleSyntax.
const rightToLeft = 1

export function prepareNativeBackGesture(page: Page): void {
	page.enableSwipeBackNavigation = false
}

const sameView = (first: UIView, second: UIView) => first === second || first.isEqual(second)

export function isNativeFrameDescendant(frame: Frame, parent: Frame): boolean {
	const childView = frame.nativeViewProtected as UIView | undefined
	const parentView = parent.nativeViewProtected as UIView | undefined
	return !!(
		childView &&
		parentView &&
		!sameView(childView, parentView) &&
		childView.isDescendantOfView(parentView)
	)
}

/** NativeScript owns recognizer attachment and lifecycle. This owner keeps only
 * the gesture's source Page and its canonical Back request. */
export function attachNativeBackGesture(
	frame: Frame,
	options: NativeBackGestureOptions,
): () => void {
	let disposed = false
	let pending = false
	let origin: Page | undefined
	const pan = (event: PanGestureEventData) => {
		if (disposed) {
			return
		}
		const view = frame.nativeViewProtected as UIView | undefined
		const native = event.ios as UIPanGestureRecognizer | undefined
		if (!view || !native?.view || !sameView(native.view, view)) {
			return
		}
		const direction = view.effectiveUserInterfaceLayoutDirection === rightToLeft ? -1 : 1
		const velocity = native.velocityInView(view)
		const width = view.bounds.size.width

		if (event.state === GestureStateTypes.began) {
			origin = undefined
			const edge = direction === 1 ? event.startX : width - event.startX
			if (
				!pending &&
				options.canBegin() &&
				edge >= 0 &&
				edge <= 24 &&
				velocity.x * direction > Math.abs(velocity.y)
			) {
				origin = frame.currentPage
			}

			return
		}
		if (event.state === GestureStateTypes.cancelled) {
			origin = undefined
			return
		}
		if (event.state !== GestureStateTypes.ended) {
			return
		}
		const source = origin
		origin = undefined
		if (!source || pending || frame.currentPage !== source || !options.canBegin()) {
			return
		}
		const distance = event.deltaX * direction
		const speed = velocity.x * direction
		if (
			distance < 24 ||
			distance <= Math.abs(event.deltaY) ||
			speed < 0 ||
			(distance < Math.max(80, width * 0.25) && speed < 600)
		) {
			return
		}
		pending = true
		void Promise.resolve()
			.then(() => {
				if (!disposed && frame.currentPage === source && options.canBegin()) {
					return options.back()
				}
			})
			.catch(() => console.warn('[octane-xplat] Routed swipe Back failed'))
			.finally(() => {
				pending = false
			})
	}
	// Frame's event overloads omit View gesture events. NativeScript supplies
	// PanGestureEventData for this exact event name.
	const receive = (event: EventData) => pan(event as PanGestureEventData)
	frame.on('pan', receive)
	return () => {
		if (disposed) {
			return
		}
		disposed = true
		origin = undefined
		frame.off('pan', receive)
	}
}
