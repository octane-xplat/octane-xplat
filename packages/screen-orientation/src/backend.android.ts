import { Application, NativeWindowEvents, WindowEvents } from '@nativescript/core'
import type { NativeWindow } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OrientationBackend } from './backend-types'
import { Orientation, OrientationLock } from './types'

// ActivityInfo constants corresponding to Expo's eight portable policies.
const policies: readonly number[] = [-1, 10, 7, 1, 9, 6, 8, 0] as const
const activity = () => Application.primaryWindow?.android?.activity
const required = () => {
	const value = activity()
	if (!value || value.isFinishing() || value.isDestroyed()) {
		throw new UnavailabilityError('A primary Android Activity')
	}
	return value
}
function orientation(): Orientation {
	const value = required()
	const display =
		android.os.Build.VERSION.SDK_INT >= 30
			? value.getDisplay()
			: value.getWindowManager().getDefaultDisplay()
	if (!display) {
		return Orientation.UNKNOWN
	}
	const rotation = display.getRotation()
	const configuration = value.getResources().getConfiguration().orientation
	if (configuration !== 1 && configuration !== 2) {
		return Orientation.UNKNOWN
	}
	const portraitNatural = (configuration === 1) === (rotation === 0 || rotation === 2)
	return (
		(portraitNatural
			? [
					Orientation.PORTRAIT_UP,
					Orientation.LANDSCAPE_RIGHT,
					Orientation.PORTRAIT_DOWN,
					Orientation.LANDSCAPE_LEFT,
				]
			: [
					Orientation.LANDSCAPE_RIGHT,
					Orientation.PORTRAIT_DOWN,
					Orientation.LANDSCAPE_LEFT,
					Orientation.PORTRAIT_UP,
				])[rotation] ?? Orientation.UNKNOWN
	)
}
function canLock(): boolean {
	const value = activity()
	if (!value || value.isFinishing() || value.isDestroyed()) {
		return false
	}
	if (android.os.Build.VERSION.SDK_INT >= 24 && value.isInMultiWindowMode()) {
		return false
	}
	if (android.os.Build.VERSION.SDK_INT >= 26 && value.isInPictureInPictureMode()) {
		return false
	}
	// Android 16's large-screen policy can ignore requestedOrientation.
	return !(
		android.os.Build.VERSION.SDK_INT >= 36 &&
		value.getApplicationInfo().targetSdkVersion >= 36 &&
		value.getResources().getConfiguration().smallestScreenWidthDp >= 600
	)
}
function allowed(constant: number, actual: Orientation): boolean {
	if ([1, 7, 9, 12].includes(constant)) {
		return constant === 1
			? actual === Orientation.PORTRAIT_UP
			: constant === 9
				? actual === Orientation.PORTRAIT_DOWN
				: actual === 1 || actual === 2
	}
	if ([0, 6, 8, 11].includes(constant)) {
		return constant === 0
			? actual === Orientation.LANDSCAPE_RIGHT
			: constant === 8
				? actual === Orientation.LANDSCAPE_LEFT
				: actual === 3 || actual === 4
	}
	return actual !== Orientation.UNKNOWN
}
async function apply(constant: number): Promise<void> {
	const value = required()
	if (constant !== -1 && !canLock()) {
		throw new UnavailabilityError('Android orientation policy in this window mode')
	}
	const previous = value.getRequestedOrientation()
	try {
		value.setRequestedOrientation(constant)
		await new Promise<void>((resolve, reject) => {
			const start = Date.now()
			const poll = () => {
				try {
					if (value !== activity() || value.isDestroyed()) {
						return reject(new Error('Primary Android Activity changed during orientation request'))
					}
					if (value.getRequestedOrientation() !== constant) {
						return reject(new Error('Android did not retain the requested orientation policy'))
					}
					if (Date.now() - start >= 150 && (constant === -1 || allowed(constant, orientation()))) {
						return resolve()
					}
					if (Date.now() - start >= 4000) {
						return reject(new Error('Android did not reach the requested screen orientation'))
					}
					setTimeout(poll, 25)
				} catch (error) {
					reject(error)
				}
			}
			poll()
		})
	} catch (error) {
		if (!value.isDestroyed()) {
			value.setRequestedOrientation(previous)
		}
		throw error
	}
}
export const backend: OrientationBackend = {
	capabilities: () => ({ observe: Boolean(activity()), lock: canLock() }),
	info: () => ({ orientation: orientation() }),
	policy() {
		const value = required().getRequestedOrientation()
		const index = policies.indexOf(value as (typeof policies)[number])
		return index < 0 ? OrientationLock.OTHER : (index as OrientationLock)
	},
	platformPolicy: () => ({
		screenOrientationConstantAndroid: required().getRequestedOrientation(),
	}),
	supports: (lock) => (lock === OrientationLock.DEFAULT ? Boolean(activity()) : canLock()),
	lock: (lock) => apply(policies[lock]!),
	unlock: () => apply(-1),
	lockPlatform(options) {
		if (options.screenOrientationConstantAndroid === undefined) {
			return Promise.reject(new TypeError('Android requires screenOrientationConstantAndroid'))
		}
		return apply(options.screenOrientationConstantAndroid)
	},
	subscribe(callback) {
		required()
		let bound: NativeWindow | undefined
		const refresh = () => {
			if (activity()) {
				callback()
			}
		}
		const bind = () => {
			bound?.off(NativeWindowEvents.orientationChanged, refresh)
			bound = Application.primaryWindow
			bound?.on(NativeWindowEvents.orientationChanged, refresh)
			refresh()
		}
		bind()
		Application.on(WindowEvents.primaryWindowChanged, bind)
		return {
			remove() {
				bound?.off(NativeWindowEvents.orientationChanged, refresh)
				Application.off(WindowEvents.primaryWindowChanged, bind)
			},
		}
	},
	iosSupportedOrientations() {
		throw new UnavailabilityError('iOS orientation delegate on Android')
	},
}
