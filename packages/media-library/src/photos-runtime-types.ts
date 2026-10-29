/** Only the PhotoKit/Foundation symbols used by the Apple engine cross this boundary. */
export type PhotoRuntime = Pick<
	typeof import('@octane-xplat/platform/macos'),
	| 'PHPhotoLibrary'
	| 'PHAsset'
	| 'PHAssetCollection'
	| 'PHAssetResource'
	| 'PHAssetChangeRequest'
	| 'PHAssetCollectionChangeRequest'
	| 'PHFetchOptions'
	| 'NSPredicate'
	| 'NSCompoundPredicate'
	| 'NSSortDescriptor'
	| 'NSDate'
	| 'NSArray'
	| 'NSURL'
	| 'NSUUID'
	| 'NSFileManager'
	| 'NSBundle'
	| 'NSOperationQueue'
	| 'PHAssetResourceManager'
	| 'PHAssetResourceRequestOptions'
	| 'PHImageManager'
	| 'PHImageRequestOptions'
	| 'PHVideoRequestOptions'
>

export interface AppleHost {
	runtime(): PhotoRuntime | null
	observer(listener: () => void): { release(): void }
	permissionsPicker(): Promise<void>
}
