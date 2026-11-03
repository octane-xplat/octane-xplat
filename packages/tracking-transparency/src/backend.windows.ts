import { backend as noGate } from './no-gate'
import type { TrackingBackend } from './backend-types'
import { lookupGlobal } from '@octane-xplat/lib/capability'
interface AdvertisingManager {
	readonly AdvertisingId: string
}

function manager(): AdvertisingManager | undefined {
	try {
		return lookupGlobal(['Windows', 'System', 'UserProfile', 'AdvertisingManager']) as
			| AdvertisingManager
			| undefined
	} catch {
		return undefined
	}
}

function identifier(): string | null {
	const source = manager()
	if (!source) {
		return null
	}
	const value = source.AdvertisingId
	if (value === '') {
		return null
	}
	if (typeof value !== 'string') {
		throw new Error('Malformed Windows advertising identifier reply')
	}
	return value
}

export const backend: TrackingBackend = {
	...noGate,
	identifierFormat: 'alphanumeric',
	capabilities: () => ({
		prompt: false,
		advertisingId: Boolean(manager()),
		advertisingIdAsync: Boolean(manager()),
	}),
	advertisingId: identifier,
	async advertisingIdAsync() {
		return identifier()
	},
}
