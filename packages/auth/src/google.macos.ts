// Google Sign-In — macOS leaf. The AppKit host has no NativeScript plugin
// runtime; apps that need Google sign-in on macOS run the hosted ceremony
// through `@octane-xplat/platform`'s `authSession` instead.
import type { GoogleAuth, SignInResult } from './types'

const UNSUPPORTED: SignInResult = {
	status: 'error',
	message: 'Google Sign-In is unsupported by the AppKit host — use a hosted authSession flow',
}

export const googleAuth: GoogleAuth = {
	supported: false,
	async configure() {},
	async signIn(): Promise<SignInResult> {
		return UNSUPPORTED
	},
	async signOut() {},
}
