import { registerNativeBackHandler } from './native-back-dispatcher'
/** Android activity Back interceptors run newest-first before routed history. */
export function addBackInterceptor(handle: () => boolean): () => void {
	return registerNativeBackHandler({}, { priority: 100, handle })
}
