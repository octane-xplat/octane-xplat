// Noninteractive native bridge check. Authentication prompts require the manual plan.
import '../../../apps/macos/src/appkit'
import { biometrics } from '../src/biometrics.macos'

declare const LAContext: any
declare const interop: any

setTimeout(async () => {
	try {
		if (!biometrics.supported || !biometrics.impl) {
			throw new Error('LocalAuthentication bridge unavailable')
		}

		const context = LAContext.new()
		const error = new interop.Reference()
		const available = context.canEvaluatePolicyError(1, error)
		const code = error.value ? Number(error.value.code) : null
		const expected = available
			? 'granted'
			: error.value?.domain === 'com.apple.LocalAuthentication' &&
				  [-6, -7, -12, -13].includes(code!)
				? 'unsupported'
				: 'denied'

		context.invalidate()
		const actual = await biometrics.ensure()
		if (actual !== expected) {
			throw new Error(`Expected ${expected}, got ${actual}`)
		}

		if (await biometrics.impl.verify('  ')) {
			throw new Error('Blank reason authenticated')
		}

		if (actual === 'unsupported') {
			if (await biometrics.impl.verify('Verify unavailable biometrics')) {
				throw new Error('Unavailable biometrics authenticated')
			}
		}

		console.log(
			`APPKIT_BIOMETRICS_OK: ensure=${actual}; native availability=${available}; code=${code}`,
		)
	} catch (error) {
		console.error('APPKIT_BIOMETRICS_FAIL: ' + String(error))
	} finally {
		;(globalThis as any).__xplatStopHost()
	}
}, 0)
