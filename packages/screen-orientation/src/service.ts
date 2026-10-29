import { backend } from './backend'
import { Orientation, OrientationLock, WebOrientationLock } from './types'
import type { OrientationChangeListener, PlatformOrientationInfo, Subscription } from './types'

function validateLock(lock: OrientationLock) {
	if (
		!Number.isInteger(lock) ||
		lock < OrientationLock.DEFAULT ||
		lock > OrientationLock.LANDSCAPE_RIGHT
	) {
		throw new RangeError('Orientation lock must be a policy between DEFAULT and LANDSCAPE_RIGHT')
	}
}
// Mutations run in call order; one rejected request does not poison the queue.
let pending: Promise<void> = Promise.resolve()
function enqueue(operation: () => Promise<void>): Promise<void> {
	const result = pending.then(operation)
	pending = result.catch(() => {})
	return result
}
export async function getOrientationAsync() {
	return backend.info().orientation
}
export async function getOrientationLockAsync() {
	return backend.policy()
}
export async function getPlatformOrientationLockAsync(): Promise<PlatformOrientationInfo> {
	return backend.platformPolicy()
}
export async function supportsOrientationLockAsync(lock: OrientationLock): Promise<boolean> {
	validateLock(lock)
	return backend.supports(lock)
}
export async function lockAsync(lock: OrientationLock): Promise<void> {
	validateLock(lock)
	return enqueue(() => backend.lock(lock))
}
export async function unlockAsync(): Promise<void> {
	return enqueue(() => backend.unlock())
}
export async function lockPlatformAsync(options: PlatformOrientationInfo): Promise<void> {
	if (
		!options ||
		typeof options !== 'object' ||
		Array.isArray(options) ||
		Object.keys(options).length !== 1
	) {
		throw new TypeError('Supply exactly one platform orientation field')
	}
	const copy = { ...options }
	if ('screenOrientationArrayIOS' in copy) {
		if (
			!Array.isArray(copy.screenOrientationArrayIOS) ||
			!copy.screenOrientationArrayIOS.length ||
			copy.screenOrientationArrayIOS.some(
				(value) => !Number.isInteger(value) || value < 1 || value > 4,
			)
		) {
			throw new RangeError(
				'iOS orientations must contain values between PORTRAIT_UP and LANDSCAPE_RIGHT',
			)
		}
		copy.screenOrientationArrayIOS = [...new Set(copy.screenOrientationArrayIOS)]
	} else if ('screenOrientationConstantAndroid' in copy) {
		if (
			!Number.isInteger(copy.screenOrientationConstantAndroid) ||
			copy.screenOrientationConstantAndroid! < -1 ||
			copy.screenOrientationConstantAndroid! > 14
		) {
			throw new RangeError('Android orientation constant must be between -1 and 14')
		}
	} else if ('screenOrientationLockWeb' in copy) {
		if (
			!Object.values(WebOrientationLock).includes(copy.screenOrientationLockWeb!) ||
			copy.screenOrientationLockWeb === WebOrientationLock.UNKNOWN
		) {
			throw new RangeError('Invalid web orientation policy')
		}
	} else {
		throw new TypeError('Unknown platform orientation field')
	}
	return enqueue(() => backend.lockPlatform(copy))
}
const axis = (value: number) =>
	value === Orientation.PORTRAIT_UP || value === Orientation.PORTRAIT_DOWN
		? 'portrait'
		: value === Orientation.LANDSCAPE_LEFT || value === Orientation.LANDSCAPE_RIGHT
			? 'landscape'
			: 'unknown'
/** Emits portrait/landscape transitions; same-axis flips do not emit. */
export function addOrientationChangeListener(listener: OrientationChangeListener): Subscription {
	if (typeof listener !== 'function') {
		throw new TypeError('Orientation listener must be a function')
	}
	let previous = axis(backend.info().orientation)
	let active = true
	const subscription = backend.subscribe(() => {
		if (!active) {
			return
		}
		const info = backend.info()
		const next = axis(info.orientation)
		if (next === 'unknown' || next === previous) {
			return
		}
		previous = next
		listener({ orientationInfo: { ...info }, orientationLock: backend.policy() })
	})
	return {
		remove() {
			if (!active) {
				return
			}
			active = false
			subscription.remove()
		},
	}
}
/** Forward UIApplicationDelegate's supported-orientations callback here on iOS. */
export function getIOSSupportedInterfaceOrientations(window: object | null): number {
	return backend.iosSupportedOrientations(window)
}
export const ScreenOrientation = Object.freeze({
	get capabilities() {
		return Object.freeze(backend.capabilities())
	},
	get supported() {
		return backend.capabilities().observe
	},
	async isAvailable() {
		return backend.capabilities().observe
	},
	getOrientationAsync,
	getOrientationLockAsync,
	getPlatformOrientationLockAsync,
	supportsOrientationLockAsync,
	lockAsync,
	lockPlatformAsync,
	unlockAsync,
	addOrientationChangeListener,
	getIOSSupportedInterfaceOrientations,
})
