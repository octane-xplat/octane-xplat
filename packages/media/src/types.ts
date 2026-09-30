/** Optional capability — never throws for absence (docs/platform-services.md). */
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
 * Result of `media.pickImage()`: a displayable URI and an upload data URL.
 * Native URIs point to temporary JPEG files; delete them when the preview is
 * no longer needed.
 */
export interface PickedImage extends FileRef {
	dataUrl: string
}

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
	 * Still-image capture through the OS camera UI. Resolves null when the
	 * shot is canceled, permission is denied, or no camera exists — call
	 * `ensure('camera')` first to tell those apart. Video capture is not part
	 * of the contract: no maintained NativeScript substrate exists.
	 */
	capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null>
	ensure(kind: MediaPermissionKind): Promise<PermissionResult>
}
