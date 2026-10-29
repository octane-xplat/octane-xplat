import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { RandomImpl } from '@octane-xplat/platform'
const unavailable = (): never => {
	throw new UnavailabilityError('Crypto native secure randomness on this host')
}
export const random: RandomImpl = { supported: false, fill: unavailable, bytes: unavailable }
