// Biometrics — web leaf. WebAuthn is an authentication ceremony, not a
// standalone local-presence API: it requires an RP challenge and a registered
// credential, and may require a user gesture. Do not claim it implements the
// native verify(reason) contract by creating an ephemeral passkey.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { BiometricsImpl } from './types'

const UNSUPPORTED: PermissionResponse = {
	status: 'unsupported',
	granted: false,
	canAskAgain: false,
}

export const biometrics: Permissioned<BiometricsImpl> = {
	supported: false,
	isAvailable: async () => false,
	getPermissions: async () => UNSUPPORTED,
	requestPermissions: async () => UNSUPPORTED,
	verify: () => Promise.reject(new UnavailabilityError('biometrics')),
}
