// Google Sign-In — native leaf over @nativescript/google-signin
// (GIDSignIn on iOS, Credential Manager/Play services on Android). `configure`
// forwards to the plugin — clientId is optional on iOS when GIDClientID sits
// in Info.plist; Android resolves it from google-services resources.
import { GoogleSignin } from '@nativescript/google-signin'
import type { AuthCredential, GoogleAuth, GoogleAuthConfig, SignInResult } from './types'

function isCancel(error: unknown): boolean {
	const code =
		(error as any)?.native?.code ?? // iOS: kGIDSignInErrorCodeCanceled = -5
		(error as any)?.native?.getStatusCode?.() ?? // Android: ApiException
		(error as any)?.code
	if (code === -5 || code === 12501 /* SIGN_IN_CANCELLED */) {
		return true
	}

	return /cancel/i.test(String((error as any)?.message ?? error))
}

function toCredential(user: any): AuthCredential {
	return {
		provider: 'google',
		idToken: user.idToken || undefined,
		accessToken: user.accessToken || undefined,
		authorizationCode: user.serverAuthCode || undefined,
		scopes: user.grantedScopes ?? [],
		user: {
			id: user.id,
			email: user.email || undefined,
			name: user.displayName || undefined,
			givenName: user.givenName || undefined,
			familyName: user.familyName || undefined,
			photoUrl: user.photoUrl || undefined,
		},
	}
}

export const googleAuth: GoogleAuth = {
	supported: true,
	async configure(config?: GoogleAuthConfig) {
		await GoogleSignin.configure(config)
	},
	async signIn(): Promise<SignInResult> {
		try {
			const user = await GoogleSignin.signIn()
			return { status: 'success', credential: toCredential(user) }
		} catch (error) {
			return isCancel(error)
				? { status: 'cancelled' }
				: { status: 'error', message: String((error as any)?.message ?? error) }
		}
	},
	async signOut() {
		try {
			await GoogleSignin.signOut()
		} catch {
			// A failed sign-out just means the next signIn re-shows the chooser.
		}
	},
}
