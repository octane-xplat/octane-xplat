// Sign in with Apple — macOS leaf. The AppKit host has no NativeScript
// plugin runtime; apps that need Apple sign-in on macOS run the hosted
// ceremony through `@octane-xplat/platform`'s `authSession` instead.
import type { AppleAuth, AppleCredentialState, SignInResult } from './types'

const UNSUPPORTED: SignInResult = {
	status: 'error',
	message: 'Sign in with Apple is unsupported by the AppKit host — use a hosted authSession flow',
}

export const appleAuth: AppleAuth = {
	supported: false,
	configure() {},
	async signIn(): Promise<SignInResult> {
		return UNSUPPORTED
	},
	async getCredentialState(): Promise<AppleCredentialState> {
		return 'unknown'
	},
}
