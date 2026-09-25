// Shared contract shapes — imported by BOTH leaves. Types must live here,
// never in a leaf: `import … from './x.web'` inside x.native.ts drags the
// web implementation into the native typecheck program.

/** Optional capability — never throws for absence (docs/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export type AppState = 'active' | 'background' | 'inactive'

export interface DeviceInfo {
	os: 'web' | 'ios' | 'android'
	osVersion: string
	model: string
	manufacturer: string
	language: string
	region: string
}

export interface Insets {
	top: number
	bottom: number
	left: number
	right: number
}

export interface WindowSize {
	width: number
	height: number
	orientation: 'portrait' | 'landscape'
}

export interface FileRef {
	name: string
	/** blob:/object URL on web, filesystem path on native — opaque */
	uri: string
}

/**
 * Result of `media.pickImage()`: a displayable URI and an upload data URL.
 * Native URIs point to temporary JPEG files; call `files.release()` when the
 * preview is no longer needed.
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

export interface Locale {
	tag: string
	language: string
	region: string
}

export interface SecureStore {
	get(key: string): Promise<string | null>
	set(key: string, value: string): Promise<boolean>
	remove(key: string): Promise<boolean>
}

export interface HapticsImpl {
	impact(style?: 'light' | 'medium' | 'heavy'): void
	notification(kind: 'success' | 'warning' | 'error'): void
	selection(): void
}

export interface NotificationsImpl {
	notify(title: string, body?: string): void
}

export interface BiometricsImpl {
	verify(reason: string): Promise<boolean>
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export type PermissionKind = 'notifications' | 'camera' | 'photos' | 'location'

export type MediaPermissionKind = 'camera' | 'photos'

export interface GeolocationOptions {
	enableHighAccuracy?: boolean
	timeout?: number
	maximumAge?: number
}

export interface GeolocationPosition {
	latitude: number
	longitude: number
	accuracy: number
	altitude: number | null
	heading: number | null
	speed: number | null
	timestamp: number
}

export interface GeolocationImpl {
	getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>
}

export type ConnectionType =
	| 'none'
	| 'wifi'
	| 'mobile'
	| 'ethernet'
	| 'bluetooth'
	| 'vpn'
	| 'unknown'

export interface ConnectivityState {
	online: boolean
	type: ConnectionType
}

export interface ConnectivityImpl {
	getState(): ConnectivityState
	subscribe(listener: (state: ConnectivityState) => void): () => void
}

export interface AppInfo {
	supported: boolean
	version: string | null
	build: string | null
	bundleId: string | null
}

export interface OpenSettingsImpl {
	open(): boolean
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

export type ShareResult = 'shared' | 'copied' | 'unavailable'
