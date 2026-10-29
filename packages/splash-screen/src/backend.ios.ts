import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SplashScreenBackend } from './backend-types'
interface Engine {
	configured(): boolean
	prepare(alreadyStarted: boolean): boolean
	preventAutoHide(): boolean
	hide(): void
	configure(options: string): boolean
}
const engine = () => (globalThis as unknown as { XplatSplashScreen?: Engine }).XplatSplashScreen
let prepared = false
function host(): Engine {
	const value = engine()
	if (!value || !value.configured()) {
		throw new UnavailabilityError(
			'SplashScreen requires its native bridge and a launch storyboard; rebuild the app',
		)
	}
	if (!prepared) {
		if (!value.prepare(Boolean(Application.started))) {
			throw new Error('Invalid native splash screen configuration')
		}
		prepared = true
	}
	return value
}
export const backend: SplashScreenBackend = {
	capabilities: () => {
		const available = engine()?.configured() === true
		return { hold: available, fade: available, animationDuration: available }
	},
	preventAutoHide: () => host().preventAutoHide(),
	hide: () => host().hide(),
	configure(options) {
		if (!host().configure(JSON.stringify(options))) {
			throw new Error('Invalid native splash screen options')
		}
	},
}
