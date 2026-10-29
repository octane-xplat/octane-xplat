import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OrientationBackend } from './backend-types'
import { Orientation, OrientationLock, WebOrientationLock } from './types'
import type { WebOrientationLock as WebLock } from './types'

type BrowserOrientation = EventTarget & {
	readonly type: string
	lock?: (policy: string) => Promise<void>
	unlock?: () => void
}
const orientation = (): BrowserOrientation | undefined =>
	typeof screen === 'undefined' ? undefined : (screen.orientation as BrowserOrientation)
const required = () => {
	const value = orientation()
	if (!value) {
		throw new UnavailabilityError('Screen Orientation API')
	}
	return value
}
const policies: readonly WebLock[] = [
	'natural',
	'any',
	'portrait',
	'portrait-primary',
	'portrait-secondary',
	'landscape',
	'landscape-primary',
	'landscape-secondary',
] as const
const orientations: Record<string, Orientation> = {
	'portrait-primary': Orientation.PORTRAIT_UP,
	'portrait-secondary': Orientation.PORTRAIT_DOWN,
	'landscape-primary': Orientation.LANDSCAPE_LEFT,
	'landscape-secondary': Orientation.LANDSCAPE_RIGHT,
}
// Browsers expose no policy getter. UNKNOWN means no successful request by this leaf.
let lastPolicy: WebLock = WebOrientationLock.UNKNOWN
let lastLock: OrientationLock = OrientationLock.UNKNOWN
async function apply(value: WebLock, lock: OrientationLock) {
	const native = required()
	if (typeof native.lock !== 'function') {
		throw new UnavailabilityError('Browser orientation locking')
	}
	await native.lock(value)
	lastPolicy = value
	lastLock = lock
}
export const backend: OrientationBackend = {
	capabilities: () => ({
		observe: Boolean(orientation()),
		lock: typeof orientation()?.lock === 'function' && typeof orientation()?.unlock === 'function',
	}),
	info: () => ({ orientation: orientations[required().type] ?? Orientation.UNKNOWN }),
	policy() {
		required()
		return lastLock
	},
	platformPolicy() {
		required()
		return { screenOrientationLockWeb: lastPolicy }
	},
	supports: (lock) => typeof orientation()?.lock === 'function' && Boolean(policies[lock]),
	async lock(lock) {
		await apply(policies[lock]!, lock)
	},
	async unlock() {
		const native = required()
		if (typeof native.unlock !== 'function') {
			throw new UnavailabilityError('Browser orientation unlocking')
		}
		native.unlock()
		lastPolicy = WebOrientationLock.UNKNOWN
		lastLock = OrientationLock.DEFAULT
	},
	async lockPlatform(options) {
		if (!options.screenOrientationLockWeb) {
			throw new TypeError('Web requires screenOrientationLockWeb')
		}
		const value = options.screenOrientationLockWeb
		const index = policies.indexOf(value as (typeof policies)[number])
		await apply(value, index < 0 ? OrientationLock.OTHER : (index as OrientationLock))
	},
	subscribe(changed) {
		const native = required()
		native.addEventListener('change', changed)
		return {
			remove() {
				native.removeEventListener('change', changed)
			},
		}
	},
	iosSupportedOrientations() {
		throw new UnavailabilityError('iOS orientation delegate on web')
	},
}
