import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CryptoBackend } from './backend-types'
const unavailable = async (): Promise<never> => {
	throw new UnavailabilityError('Crypto hashing/AES on this host')
}
export const backend: CryptoBackend = {
	capabilities: () => ({ digestAlgorithms: [], aesKeySizes: [] }),
	digest: unavailable,
	crypt: unavailable,
}
