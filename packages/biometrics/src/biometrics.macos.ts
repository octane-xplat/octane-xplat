// LocalAuthentication through the AppKit host's existing Objective-C bridge.
import type { BiometricsImpl, Capability } from './types'

declare const objc: { import(name: string): void }
declare const interop: { Reference: new () => { value?: { domain: string; code: number } } }
declare const LAContext: { new: () => AuthenticationContext }

interface AuthenticationContext {
	localizedFallbackTitle: string
	canEvaluatePolicyError(policy: number, error: InstanceType<typeof interop.Reference>): boolean
	evaluatePolicyLocalizedReasonReply(
		policy: number,
		reason: string,
		reply: (success: boolean, error: unknown) => void,
	): void
	invalidate(): void
}

// LAPolicyDeviceOwnerAuthenticationWithBiometrics: do not silently substitute
// password/Apple Watch authentication on a machine without biometric hardware.
const biometricPolicy = 1

function frameworkAvailable(): boolean {
	try {
		objc.import('LocalAuthentication')
	} catch {
		// Some hosts have already bound the symbols; others cannot provide them.
	}

	return (
		typeof LAContext !== 'undefined' &&
		typeof interop !== 'undefined' &&
		typeof interop.Reference !== 'undefined'
	)
}

function availability(context: AuthenticationContext): 'granted' | 'denied' | 'unsupported' {
	const error = new interop.Reference()
	if (context.canEvaluatePolicyError(biometricPolicy, error)) {
		return 'granted'
	}

	// Missing hardware (-6), enrollment (-7), pairing (-12) or a connected
	// sensor (-13) is absence, not a permission denial.
	// Lockout (-8), interaction restrictions and other failures remain denied.
	return error.value?.domain === 'com.apple.LocalAuthentication' &&
		[-6, -7, -12, -13].includes(Number(error.value.code))
		? 'unsupported'
		: 'denied'
}

function invalidate(context: AuthenticationContext | null): void {
	try {
		context?.invalidate()
	} catch {
		// Cleanup must not turn a failed authentication into a rejected promise.
	}
}

// Root both the context and callback until completion; native callbacks may
// outlive the JS call. Refuse concurrent prompts rather than canceling one.
let active: {
	context: AuthenticationContext | null
	reply: ((success: boolean, error: unknown) => void) | null
} | null = null

const implementation: BiometricsImpl = {
	verify(reason) {
		if (active || !frameworkAvailable() || typeof reason !== 'string' || !reason.trim()) {
			return Promise.resolve(false)
		}

		const operation = {
			context: null as AuthenticationContext | null,
			reply: null as ((success: boolean, error: unknown) => void) | null,
		}

		active = operation
		return new Promise<boolean>((resolve) => {
			let settled = false
			const finish = (success: boolean) => {
				if (settled) {
					return
				}

				settled = true
				if (active === operation) {
					active = null
				}

				invalidate(operation.context)
				operation.context = null
				operation.reply = null
				resolve(success)
			}

			try {
				operation.context = LAContext.new()
				if (availability(operation.context) !== 'granted') {
					finish(false)
					return
				}

				operation.context.localizedFallbackTitle = ''
				operation.reply = (success, error) => finish(Boolean(success) && !error)
				operation.context.evaluatePolicyLocalizedReasonReply(
					biometricPolicy,
					reason,
					operation.reply,
				)
			} catch {
				finish(false)
			}
		})
	},
}

export const biometrics: Capability<BiometricsImpl> = {
	get supported() {
		return frameworkAvailable()
	},
	async ensure() {
		if (!frameworkAvailable()) {
			return 'unsupported'
		}

		let context: AuthenticationContext | null = null
		try {
			context = LAContext.new()
			return availability(context)
		} catch {
			return 'denied'
		} finally {
			invalidate(context)
		}
	},
	get impl() {
		return frameworkAvailable() ? implementation : null
	},
}
