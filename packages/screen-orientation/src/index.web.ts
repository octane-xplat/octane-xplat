export * from './types'
export {
	ScreenOrientation,
	getOrientationAsync,
	getOrientationLockAsync,
	getPlatformOrientationLockAsync,
	supportsOrientationLockAsync,
	lockAsync,
	lockPlatformAsync,
	unlockAsync,
	addOrientationChangeListener,
	getIOSSupportedInterfaceOrientations,
} from './service'
