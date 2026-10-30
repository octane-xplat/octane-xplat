/** Screen/interface orientation, rather than the physical device sensor. */
export const Orientation: Readonly<{
	readonly UNKNOWN: 0
	readonly PORTRAIT_UP: 1
	readonly PORTRAIT_DOWN: 2
	readonly LANDSCAPE_LEFT: 3
	readonly LANDSCAPE_RIGHT: 4
}> = Object.freeze({
	UNKNOWN: 0,
	PORTRAIT_UP: 1,
	PORTRAIT_DOWN: 2,
	LANDSCAPE_LEFT: 3,
	LANDSCAPE_RIGHT: 4,
} as const)

export type Orientation = (typeof Orientation)[keyof typeof Orientation]
export const OrientationLock: Readonly<{
	readonly DEFAULT: 0
	readonly ALL: 1
	readonly PORTRAIT: 2
	readonly PORTRAIT_UP: 3
	readonly PORTRAIT_DOWN: 4
	readonly LANDSCAPE: 5
	readonly LANDSCAPE_LEFT: 6
	readonly LANDSCAPE_RIGHT: 7
	readonly OTHER: 8
	readonly UNKNOWN: 9
}> = Object.freeze({
	DEFAULT: 0,
	ALL: 1,
	PORTRAIT: 2,
	PORTRAIT_UP: 3,
	PORTRAIT_DOWN: 4,
	LANDSCAPE: 5,
	LANDSCAPE_LEFT: 6,
	LANDSCAPE_RIGHT: 7,
	OTHER: 8,
	UNKNOWN: 9,
} as const)

export type OrientationLock = (typeof OrientationLock)[keyof typeof OrientationLock]
export const SizeClassIOS: Readonly<{
	readonly UNKNOWN: 0
	readonly COMPACT: 1
	readonly REGULAR: 2
}> = Object.freeze({ UNKNOWN: 0, COMPACT: 1, REGULAR: 2 } as const)

export type SizeClassIOS = (typeof SizeClassIOS)[keyof typeof SizeClassIOS]
export const WebOrientation: Readonly<{
	readonly PORTRAIT_PRIMARY: 'portrait-primary'
	readonly PORTRAIT_SECONDARY: 'portrait-secondary'
	readonly LANDSCAPE_PRIMARY: 'landscape-primary'
	readonly LANDSCAPE_SECONDARY: 'landscape-secondary'
}> = Object.freeze({
	PORTRAIT_PRIMARY: 'portrait-primary',
	PORTRAIT_SECONDARY: 'portrait-secondary',
	LANDSCAPE_PRIMARY: 'landscape-primary',
	LANDSCAPE_SECONDARY: 'landscape-secondary',
} as const)

export type WebOrientation = (typeof WebOrientation)[keyof typeof WebOrientation]
export const WebOrientationLock: Readonly<{
	readonly ANY: 'any'
	readonly NATURAL: 'natural'
	readonly PORTRAIT: 'portrait'
	readonly PORTRAIT_PRIMARY: 'portrait-primary'
	readonly PORTRAIT_SECONDARY: 'portrait-secondary'
	readonly LANDSCAPE: 'landscape'
	readonly LANDSCAPE_PRIMARY: 'landscape-primary'
	readonly LANDSCAPE_SECONDARY: 'landscape-secondary'
	readonly UNKNOWN: 'unknown'
}> = Object.freeze({
	ANY: 'any',
	NATURAL: 'natural',
	PORTRAIT: 'portrait',
	PORTRAIT_PRIMARY: 'portrait-primary',
	PORTRAIT_SECONDARY: 'portrait-secondary',
	LANDSCAPE: 'landscape',
	LANDSCAPE_PRIMARY: 'landscape-primary',
	LANDSCAPE_SECONDARY: 'landscape-secondary',
	UNKNOWN: 'unknown',
} as const)

export type WebOrientationLock = (typeof WebOrientationLock)[keyof typeof WebOrientationLock]
export interface PlatformOrientationInfo {
	screenOrientationArrayIOS?: Orientation[]
	screenOrientationConstantAndroid?: number
	screenOrientationLockWeb?: WebOrientationLock
}

export interface ScreenOrientationInfo {
	orientation: Orientation
	horizontalSizeClass?: SizeClassIOS
	verticalSizeClass?: SizeClassIOS
}

export interface OrientationChangeEvent {
	orientationInfo: ScreenOrientationInfo
	orientationLock: OrientationLock
}

export type OrientationChangeListener = (event: OrientationChangeEvent) => void
export interface Subscription {
	remove(): void
}

export interface ScreenOrientationCapabilities {
	readonly observe: boolean
	readonly lock: boolean
}
