// oxlint-disable-next-line xplat/no-nativescript-import -- Native host types only; this module is absent from the browser graph.
import type { Frame, Page } from '@nativescript/core'
import type { NativeBackGestureOptions } from './native-back-gesture-types'

export function prepareNativeBackGesture(_page: Page): void {}

export function isNativeFrameDescendant(_frame: Frame, _parent: Frame): boolean {
	return false
}

/** Other hosts claim OS Back through their existing platform dispatcher. */
export function attachNativeBackGesture(
	_frame: Frame,
	_options: NativeBackGestureOptions,
): () => void {
	return () => {}
}
