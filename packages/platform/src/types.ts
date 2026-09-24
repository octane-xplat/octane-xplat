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

export type PermissionKind = 'notifications' | 'camera' | 'photos' | 'location'

export type ShareResult = 'shared' | 'copied' | 'unavailable'
