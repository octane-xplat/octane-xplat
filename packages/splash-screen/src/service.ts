import { backend } from './backend'
import type { SplashScreenOptions } from './types'

/** Call in module scope before Application.run(). Repeated holds share one native startup. */
export async function preventAutoHideAsync(): Promise<boolean> {
	return backend.preventAutoHide()
}

/** Request dismissal. It does not wait for the fade to finish. */
export function hide(): void {
	backend.hide()
}

/** Promise-shaped Expo entry point; resolves when dismissal has been requested. */
export async function hideAsync(): Promise<void> {
	hide()
}

/** Configure dismissal animation. Validates eagerly — throws TypeError for
 *  unknown keys/wrong types and RangeError for duration outside 0–60000 ms. */
export function setOptions(options: SplashScreenOptions): void {
	if (
		!options ||
		typeof options !== 'object' ||
		Array.isArray(options) ||
		Object.keys(options).some((key) => key !== 'duration' && key !== 'fade')
	) {
		throw new TypeError('Invalid splash screen options')
	}
	if (
		options.duration !== undefined &&
		(typeof options.duration !== 'number' ||
			!Number.isFinite(options.duration) ||
			options.duration < 0 ||
			options.duration > 60000)
	) {
		throw new RangeError('Splash screen duration must be between 0 and 60000 milliseconds')
	}
	if (options.fade !== undefined && typeof options.fade !== 'boolean') {
		throw new TypeError('Splash screen fade must be a Boolean')
	}
	backend.configure({ ...options })
}

/** Expo-shaped namespace object bundling the splash-screen API; frozen at
 *  module load. Equivalent to calling the module-level functions directly. */
export const SplashScreen: Readonly<{
	/** Per-platform feature flags; a fresh frozen snapshot on each read. */
	readonly capabilities: Readonly<import('./types').SplashScreenCapabilities>
	/** See {@link preventAutoHideAsync}. */
	preventAutoHideAsync: typeof preventAutoHideAsync
	/** See {@link hide}. */
	hide: typeof hide
	/** See {@link hideAsync}. */
	hideAsync: typeof hideAsync
	/** See {@link setOptions}. */
	setOptions: typeof setOptions
}> = Object.freeze({
	get capabilities() {
		return Object.freeze(backend.capabilities())
	},
	preventAutoHideAsync,
	hide,
	hideAsync,
	setOptions,
})
