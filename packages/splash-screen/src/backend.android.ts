import { Application, Utils } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SplashScreenBackend } from './backend-types'
interface Engine {
	initialize(application: unknown, alreadyStarted: boolean): boolean
	preventAutoHide(): boolean
	hide(): void
	animationSupported(): boolean
	configure(options: string): boolean
}
const engine = () =>
	(globalThis as any).com?.octanexplat?.splashscreen?.SplashScreenBridge as Engine | undefined
let prepared = false
function host(): Engine {
	const value = engine()
	if (!value) {
		throw new UnavailabilityError('SplashScreen native bridge; rebuild the app')
	}
	if (!prepared) {
		if (!value.initialize(Utils.android.getApplicationContext(), Boolean(Application.started))) {
			throw new Error('Invalid native splash screen configuration')
		}
		prepared = true
	}
	return value
}
export const backend: SplashScreenBackend = {
	capabilities: () => ({
		hold: !!engine(),
		fade: false,
		animationDuration: engine()?.animationSupported() === true,
	}),
	preventAutoHide: () => host().preventAutoHide(),
	hide: () => host().hide(),
	configure(options) {
		const value = host()
		if (options.duration !== undefined && !value.animationSupported()) {
			throw new UnavailabilityError(
				'SplashScreen exit-animation duration requires Android 12 or newer',
			)
		}
		if (!value.configure(JSON.stringify(options))) {
			throw new Error('Invalid native splash screen options')
		}
	},
}
