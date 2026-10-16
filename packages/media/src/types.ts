/** Optional capability — never throws for absence (docs/platform/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export type MediaPermissionKind = 'camera' | 'photos'

export interface FileRef {
	name: string
	/**
	 * Opaque reference: blob/object URL on web, filesystem path on native.
	 */
	uri: string
}

/**
 * Result of `media.pickImage()`: a file ref usable directly as `Image.src`
 * and with `files.readBytes()` for upload. Native URIs point to temporary
 * JPEG files; `files.release()` them when the preview is no longer needed.
 */
export type PickedImage = FileRef

/**
 * Options for `media.capturePhoto()`. Sizes are device-independent pixels;
 * the delivered image may be larger on high-density screens and may differ
 * from the request when `keepAspectRatio` applies.
 */
export interface CapturePhotoOptions {
	width?: number
	height?: number
	/** Preserve the sensor aspect ratio when resizing to width/height. Default true. */
	keepAspectRatio?: boolean
	/** Also write the shot to the OS photo library. Default false. */
	saveToGallery?: boolean
	/** Preferred lens. Default 'rear'; Android devices may ignore the hint. */
	cameraFacing?: 'front' | 'rear'
}

export interface MediaImpl {
	pickImage(): Promise<PickedImage | null>
	pickImages(): Promise<PickedImage[]>
	/**
	 * Still-image capture through the OS camera UI (app-owned sheet on AppKit). Resolves null when the
	 * shot is canceled, permission is denied, no camera exists, or the result cannot be
	 * read or persisted — call
	 * `ensure('camera')` from a user action to check permission separately.
	 * AppKit rejects saveToGallery:true before permission or UI; it never writes
	 * to Photos or requests microphone access. Use @octane-xplat/camera for movies.
	 */
	capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null>
	ensure(kind: MediaPermissionKind): Promise<PermissionResult>
}
