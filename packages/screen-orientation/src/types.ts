/** Screen/interface orientation, rather than the physical device sensor. */
export const Orientation: Readonly<{
	/** Unknown/unmappable orientation. */
	readonly UNKNOWN: 0
	/** Upright portrait. */
	readonly PORTRAIT_UP: 1
	/** Upside-down portrait. */
	readonly PORTRAIT_DOWN: 2
	/** Landscape, rotated left. */
	readonly LANDSCAPE_LEFT: 3
	/** Landscape, rotated right. */
	readonly LANDSCAPE_RIGHT: 4
}> = Object.freeze({
	UNKNOWN: 0,
	PORTRAIT_UP: 1,
	PORTRAIT_DOWN: 2,
	LANDSCAPE_LEFT: 3,
	LANDSCAPE_RIGHT: 4,
} as const)

export type Orientation = (typeof Orientation)[keyof typeof Orientation]
/** Portable orientation-lock values. */
export const OrientationLock: Readonly<{
	/** Platform default (no explicit lock). */
	readonly DEFAULT: 0
	/** Any orientation. */
	readonly ALL: 1
	/** Any portrait. */
	readonly PORTRAIT: 2
	/** Upright portrait. */
	readonly PORTRAIT_UP: 3
	/** Upside-down portrait. */
	readonly PORTRAIT_DOWN: 4
	/** Any landscape. */
	readonly LANDSCAPE: 5
	/** Landscape, rotated left. */
	readonly LANDSCAPE_LEFT: 6
	/** Landscape, rotated right. */
	readonly LANDSCAPE_RIGHT: 7
	/** Other/unclassifiable — locks anything not covered by the named values. */
	readonly OTHER: 8
	/** Unknown/unmappable lock. */
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

/** Portable orientation-lock values. */
export type OrientationLock = (typeof OrientationLock)[keyof typeof OrientationLock]
/** iOS trait size classes. */
export const SizeClassIOS: Readonly<{
	/** Size class not reported or unmappable. */
	readonly UNKNOWN: 0
	/** Compact trait (e.g. iPhone width, split view). */
	readonly COMPACT: 1
	/** Regular trait (e.g. full-width iPad). */
	readonly REGULAR: 2
}> = Object.freeze({ UNKNOWN: 0, COMPACT: 1, REGULAR: 2 } as const)

/** iOS trait size classes. */
export type SizeClassIOS = (typeof SizeClassIOS)[keyof typeof SizeClassIOS]
/** Screen Orientation API orientation values. */
export const WebOrientation: Readonly<{
	/** Natural portrait. */
	readonly PORTRAIT_PRIMARY: 'portrait-primary'
	/** Inverted portrait. */
	readonly PORTRAIT_SECONDARY: 'portrait-secondary'
	/** Natural landscape. */
	readonly LANDSCAPE_PRIMARY: 'landscape-primary'
	/** Inverted landscape. */
	readonly LANDSCAPE_SECONDARY: 'landscape-secondary'
}> = Object.freeze({
	PORTRAIT_PRIMARY: 'portrait-primary',
	PORTRAIT_SECONDARY: 'portrait-secondary',
	LANDSCAPE_PRIMARY: 'landscape-primary',
	LANDSCAPE_SECONDARY: 'landscape-secondary',
} as const)

/** Screen Orientation API orientation values. */
export type WebOrientation = (typeof WebOrientation)[keyof typeof WebOrientation]
/** Screen Orientation API lock values. */
export const WebOrientationLock: Readonly<{
	/** Unlocked. */
	readonly ANY: 'any'
	/** Device-natural orientation. */
	readonly NATURAL: 'natural'
	/** Any portrait. */
	readonly PORTRAIT: 'portrait'
	/** Natural portrait. */
	readonly PORTRAIT_PRIMARY: 'portrait-primary'
	/** Inverted portrait. */
	readonly PORTRAIT_SECONDARY: 'portrait-secondary'
	/** Any landscape. */
	readonly LANDSCAPE: 'landscape'
	/** Natural landscape. */
	readonly LANDSCAPE_PRIMARY: 'landscape-primary'
	/** Inverted landscape. */
	readonly LANDSCAPE_SECONDARY: 'landscape-secondary'
	/** Unknown/unmappable orientation. */
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

/** Screen Orientation API lock values. */
export type WebOrientationLock = (typeof WebOrientationLock)[keyof typeof WebOrientationLock]
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
export interface ScreenOrientationInfo {
	/** Current device orientation. */
	orientation: Orientation
	/** iOS horizontal size class, when reported. */
	horizontalSizeClass?: SizeClassIOS
	/** iOS vertical size class, when reported. */
	verticalSizeClass?: SizeClassIOS
}

/** Payload for orientation-change listeners. */
export interface OrientationChangeEvent {
	/** The resolved OrientationInfo payload. */
	orientationInfo: ScreenOrientationInfo
	/** The lock that produced this event. */
	orientationLock: OrientationLock
}

/** Callback for orientation changes. */
export type OrientationChangeListener = (event: OrientationChangeEvent) => void
/** Handle returned by listener registration. */
export interface Subscription {
	/** Detach the listener; idempotent. */
	remove(): void
}

/** What this host supports (observe/lock). */
export interface ScreenOrientationCapabilities {
	/** Orientation reads and change events work. */
	readonly observe: boolean
	/** Programmatic orientation locks work. */
	readonly lock: boolean
}
