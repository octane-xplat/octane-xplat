import { observerFactory } from './observer.photos'
import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppleHost, PhotoRuntime } from './photos-runtime-types'

let subscribe: ReturnType<typeof observerFactory> | undefined
function runtime(): PhotoRuntime | null {
	const bundle = NSBundle.bundleWithPath('/System/Library/Frameworks/Photos.framework')
	if (!bundle?.load()) {
		return null
	}
	return typeof PHPhotoLibrary === 'undefined' ? null : (globalThis as unknown as PhotoRuntime)
}
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
		if (Number(PHPhotoLibrary.authorizationStatusForAccessLevel(2)) !== 4) {
			return
		}
		let controller = Application.ios.rootController
		while (controller?.presentedViewController) {
			controller = controller.presentedViewController
		}
		if (!controller || Number(UIApplication.sharedApplication.applicationState) !== 0) {
			throw new Error('An active iOS presenter is required')
		}
		const library = PHPhotoLibrary.sharedPhotoLibrary()
		if (
			typeof library.presentLimitedLibraryPickerFromViewControllerCompletionHandler !== 'function'
		) {
			throw new UnavailabilityError('MediaLibrary limited-selection picker')
		}
		await new Promise<void>((resolve) =>
			library.presentLimitedLibraryPickerFromViewControllerCompletionHandler(controller, () =>
				resolve(),
			),
		)
	},
}
