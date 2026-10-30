/** Screen/interface orientation, rather than the physical device sensor. */
export const Orientation: Readonly<{
	readonly UNKNOWN: 0
	readonly PORTRAIT_UP: 1
	readonly PORTRAIT_DOWN: 2
	readonly LANDSCAPE_LEFT: 3
	readonly LANDSCAPE_RIGHT: 4
}> = Object.freeze({
	/** Unknown/unmappable orientation. */
	UNKNOWN: 0,
	/** Upright portrait. */
	PORTRAIT_UP: 1,
	/** Upside-down portrait. */
	PORTRAIT_DOWN: 2,
	/** Landscape, rotated left. */
	LANDSCAPE_LEFT: 3,
	/** Landscape, rotated right. */
	LANDSCAPE_RIGHT: 4,
} as const)

export type Orientation = (typeof Orientation)[keyof typeof Orientation]
/** Portable orientation-lock values. */
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
	/** Platform default (no explicit lock). */
	DEFAULT: 0,
	/** Any orientation. */
	ALL: 1,
	/** Any portrait. */
	PORTRAIT: 2,
	/** Upright portrait. */
	PORTRAIT_UP: 3,
	/** Upside-down portrait. */
	PORTRAIT_DOWN: 4,
	/** Any landscape. */
	LANDSCAPE: 5,
	/** Landscape, rotated left. */
	LANDSCAPE_LEFT: 6,
	/** Landscape, rotated right. */
	LANDSCAPE_RIGHT: 7,
	/** Other/unclassifiable. */
	OTHER: 8,
	/** Unknown/unmappable orientation. */
	UNKNOWN: 9,
} as const)

/** Portable orientation-lock values. */
export type OrientationLock = (typeof OrientationLock)[keyof typeof OrientationLock]
/** iOS trait size classes. */
export const SizeClassIOS: Readonly<{
	readonly UNKNOWN: 0
	readonly COMPACT: 1
	readonly REGULAR: 2
}> = Object.freeze({ UNKNOWN: 0, COMPACT: 1, REGULAR: 2 } as const)

/** iOS trait size classes. */
export type SizeClassIOS = (typeof SizeClassIOS)[keyof typeof SizeClassIOS]
/** Screen Orientation API orientation values. */
export const WebOrientation: Readonly<{
	readonly PORTRAIT_PRIMARY: 'portrait-primary'
	readonly PORTRAIT_SECONDARY: 'portrait-secondary'
	readonly LANDSCAPE_PRIMARY: 'landscape-primary'
	readonly LANDSCAPE_SECONDARY: 'landscape-secondary'
}> = Object.freeze({
	/** Natural portrait. */
	PORTRAIT_PRIMARY: 'portrait-primary',
	/** Inverted portrait. */
	PORTRAIT_SECONDARY: 'portrait-secondary',
	/** Natural landscape. */
	LANDSCAPE_PRIMARY: 'landscape-primary',
	/** Inverted landscape. */
	LANDSCAPE_SECONDARY: 'landscape-secondary',
} as const)

/** Screen Orientation API orientation values. */
export type WebOrientation = (typeof WebOrientation)[keyof typeof WebOrientation]
/** Screen Orientation API lock values. */
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
	/** Unlocked. */
	ANY: 'any',
	/** Device-natural orientation. */
	NATURAL: 'natural',
	/** Any portrait. */
	PORTRAIT: 'portrait',
	/** Natural portrait. */
	PORTRAIT_PRIMARY: 'portrait-primary',
	/** Inverted portrait. */
	PORTRAIT_SECONDARY: 'portrait-secondary',
	/** Any landscape. */
	LANDSCAPE: 'landscape',
	/** Natural landscape. */
	LANDSCAPE_PRIMARY: 'landscape-primary',
	/** Inverted landscape. */
	LANDSCAPE_SECONDARY: 'landscape-secondary',
	/** Unknown/unmappable orientation. */
	UNKNOWN: 'unknown',
} as const)

/** Screen Orientation API lock values. */
export type WebOrientationLock = (typeof WebOrientationLock)[keyof typeof WebOrientationLock]
/** Full platform detail (orientation + iOS size classes). */
/** Full platform detail (orientation + iOS size classes). */
export interface PlatformOrientationInfo {
	/** Info.plist UISupportedInterfaceOrientations values for a lock. */
	screenOrientationArrayIOS?: Orientation[]
	/** android.screenOrientation ActivityInfo constant for a lock. */
	screenOrientationConstantAndroid?: number
	/** Screen Orientation API lock string for a lock. */
	screenOrientationLockWeb?: WebOrientationLock
}

/** Portable orientation + lock report. */
/** Portable orientation + lock report. */
export interface ScreenOrientationInfo {
	/** Current device orientation. */
	orientation: Orientation
	/** iOS horizontal size class, when reported. */
	horizontalSizeClass?: SizeClassIOS
	/** iOS vertical size class, when reported. */
	verticalSizeClass?: SizeClassIOS
}

/** Payload for orientation-change listeners. */
/** Payload for orientation-change listeners. */
export interface OrientationChangeEvent {
	/** The resolved OrientationInfo payload. */
	orientationInfo: ScreenOrientationInfo
	/** The lock that produced this event. */
	orientationLock: OrientationLock
}

/** Callback for orientation changes. */
/** Callback for orientation changes. */
export type OrientationChangeListener = (event: OrientationChangeEvent) => void
/** Handle returned by listener registration. */
/** Handle returned by listener registration. */
export interface Subscription {
	remove(): void
}

/** What this host supports (observe/lock). */
/** What this host supports (observe/lock). */
export interface ScreenOrientationCapabilities {
	readonly observe: boolean
	readonly lock: boolean
}
