import type { NativeRouterBackEvent, NativeRouterBackHandler } from './native-back-types'
/** @internal Non-Android targets have no Android activity Back subscription. */
export function registerNativeBackHandler(
	_key: object | string,
	_handler: NativeRouterBackHandler,
): () => void {
	return () => {}
}
/** @internal Distinguish an activity press from a different SDK modal's event. */
export function isNativeActivityBackEvent(_event: NativeRouterBackEvent): boolean {
	return false
}
