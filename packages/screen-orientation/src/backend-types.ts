import type {
	OrientationLock,
	PlatformOrientationInfo,
	ScreenOrientationCapabilities,
	ScreenOrientationInfo,
	Subscription,
} from './types'
export interface OrientationBackend {
	capabilities(): ScreenOrientationCapabilities
	info(): ScreenOrientationInfo
	policy(): OrientationLock
	platformPolicy(): PlatformOrientationInfo
	supports(policy: OrientationLock): boolean
	lock(policy: OrientationLock): Promise<void>
	unlock(): Promise<void>
	lockPlatform(options: PlatformOrientationInfo): Promise<void>
	subscribe(changed: () => void): Subscription
	iosSupportedOrientations(window: object | null): number
}
