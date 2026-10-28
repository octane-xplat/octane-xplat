// Biometrics — FaceID/TouchID/fingerprint via @nativescript/biometrics.
import { BiometricAuth } from '@nativescript/biometrics'
import type { VerifyBiometricOptions } from '@nativescript/biometrics'
import { isIOS } from '@nativescript/core'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { BiometricsImpl } from './types'

const bio = new BiometricAuth()

// One prompt at a time — matching the macOS leaf, an overlapping call
// resolves false rather than stacking prompts or racing the shared
// keychain entry on iOS.
let verifying = false

const available = async (): Promise<PermissionResponse> => {
	try {
		const r = await bio.available()
		// Android reports `any` for a secure lockscreen without biometrics —
		// verify() requires BIOMETRIC_STRONG, so that state is not usable.
		const usable = !!(r.any && (isIOS || r.biometrics))
		return {
			status: usable ? 'granted' : 'unsupported',
			granted: usable,
			canAskAgain: usable,
		}
	} catch {
		// Android rejects when the device lacks biometric hardware,
		// enrollment, or a secure lockscreen — absence, not an error.
		return { status: 'unsupported', granted: false, canAskAgain: false }
	}
}

export const biometrics: Permissioned<BiometricsImpl> = {
	supported: true,
	isAvailable: async () => (await available()).granted,
	getPermissions: available,
	requestPermissions: available,
	async verify(reason) {
		if (verifying) {
			return false
		}

		verifying = true
		try {
			// iOS ignores `title` on its default keychain path — route
			// through LAContext (pinFallback selects that path; customFallback
			// keeps the biometrics-only policy) so `message` surfaces the
			// caller's reason, matching Android's dialog title.
			const options: VerifyBiometricOptions = isIOS
				? { title: reason, message: reason, pinFallback: true, ios: { customFallback: true } }
				: { title: reason }

			const r = await bio.verifyBiometric(options)
			return r.code === 0
		} catch {
			return false
		} finally {
			verifying = false
		}
	},
}
