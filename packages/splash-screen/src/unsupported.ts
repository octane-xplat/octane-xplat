import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { SplashScreenBackend } from './backend-types'
const unavailable = (): never => {
	throw new UnavailabilityError('Native launch screen control on this host')
}
export const backend: SplashScreenBackend = {
	capabilities: () => ({ hold: false, fade: false, animationDuration: false }),
	preventAutoHide: unavailable,
	hide: unavailable,
	configure: unavailable,
}
