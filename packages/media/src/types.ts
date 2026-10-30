/** Coarse permission answer; 'unsupported' means the platform has no such
 *  permission concept (e.g. 'photos' on web, where the picker mediates access). */
export type PermissionResult = 'granted' | 'denied' | 'unsupported'

/** The two permission domains media calls can ask about. */
export type MediaPermissionKind = 'camera' | 'photos'

/** A picked/captured file: displayable via `uri`, readable via `files.readBytes()`. */
export interface FileRef {
	/** Original filename when known, else a generated name. */
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
	/** Requested output width in device-independent pixels. */
	width?: number
	/** Requested output height in device-independent pixels. */
	height?: number
	/** Preserve the sensor aspect ratio when resizing to width/height. Default true. */
	keepAspectRatio?: boolean
	/** Also write the shot to the OS photo library. Default false. */
	saveToGallery?: boolean
	/** Preferred lens. Default 'rear'; Android devices may ignore the hint. */
	cameraFacing?: 'front' | 'rear'
}

import type { PermissionResponse } from '@octane-xplat/lib/capability'

/** Gallery-picking and still-capture façade. */
export interface MediaImpl {
	/** Present the system image picker; resolves null on cancel. */
	pickImage(): Promise<PickedImage | null>
	/** Present the system image picker in multi-select mode; resolves [] on
	 *  cancel or when the platform allows only single selection. */
	pickImages(): Promise<PickedImage[]>
	/**
	 * Still-image capture through the OS camera UI (app-owned sheet on AppKit). Resolves null when the
	 * shot is canceled, permission is denied, no camera exists, or the result cannot be
	 * read or persisted — call
	 * `requestPermissions('camera')` from a user action to check permission separately.
	 * AppKit saveToGallery writes the captured file to the Photos library
	 * (add-only access); the shot still resolves when that write is denied or
	 * fails. Use @octane-xplat/camera for movies.
	 */
	capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null>
	/** Read the current permission state for a domain without prompting. */
	getPermissions(kind: MediaPermissionKind): Promise<PermissionResponse>
	/** Prompt for a domain's permission from a user action. */
	requestPermissions(kind: MediaPermissionKind): Promise<PermissionResponse>
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
