import { observerFactory } from './observer.photos'
import { NSBundle, NSObject, NSOperationQueue, NSUUID } from '@octane-xplat/platform/macos'
import type { AppleHost, PhotoRuntime } from './photos-runtime-types'
import { UnavailabilityError } from '@octane-xplat/lib/capability'

let cached: PhotoRuntime | null | undefined
function runtime(): PhotoRuntime | null {
	if (cached !== undefined) {
		return cached
	}
	// Metadata describes classes; the public framework must also be loaded before resolving them.
	const bundle = NSBundle.bundleWithPath('/System/Library/Frameworks/Photos.framework')
	if (!bundle?.load()) {
		return (cached = null)
	}
	const value = globalThis as unknown as PhotoRuntime
	return (cached =
		typeof value.PHPhotoLibrary?.authorizationStatusForAccessLevel === 'function' ? value : null)
}
let subscribe: ReturnType<typeof observerFactory> | undefined
export const appleHost: AppleHost = {
	runtime,
	observer(listener) {
		const kit = runtime()
		if (!kit) {
			throw new UnavailabilityError('MediaLibrary PhotoKit')
		}
		if (!subscribe) {
			const protocols = globalThis as unknown as { PHPhotoLibraryChangeObserver: object }
			subscribe = observerFactory(
				NSObject,
				protocols.PHPhotoLibraryChangeObserver,
				`XplatLibraryObserver${NSUUID.UUID().UUIDString.replace(/-/g, '')}`,
				(callback) => NSOperationQueue.mainQueue.addOperationWithBlock(callback),
				(observer) =>
					kit.PHPhotoLibrary.sharedPhotoLibrary().registerChangeObserver(observer as never),
				(observer) =>
					kit.PHPhotoLibrary.sharedPhotoLibrary().unregisterChangeObserver(observer as never),
			)
		}
		const subscription = subscribe(listener)
		return { release: () => subscription.remove() }
	},
	async permissionsPicker() {
		throw new UnavailabilityError('MediaLibrary limited-selection picker on macOS')
	},
}
