// Sign in with Apple — native leaf over @nativescript/apple-sign-in.
// iOS runs ASAuthorizationAppleIDProvider directly (entitlement-driven, no
// configure step); the plugin's Android module is a stub that reports
// unsupported, which this leaf surfaces as `supported: false` + an error
// result rather than a throw.
import { SignIn } from '@nativescript/apple-sign-in'
import type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleSignInOptions,
	AuthCredential,
	SignInResult,
} from './types'

function isCancel(error: unknown): boolean {
	// ASAuthorizationErrorCanceled = 1001 (NSError.code via SignInError.native).
	const code = (error as any)?.native?.code ?? (error as any)?.code
	if (code === 1001) {
		return true
	}

	return /cancel/i.test(String((error as any)?.message ?? error))
}

function toCredential(user: any): AuthCredential {
	const fullName = user.fullName
	const name = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ') || undefined
	return {
		provider: 'apple',
		idToken: user.identityToken ?? undefined,
		authorizationCode: user.authorizationCode ?? undefined,
		scopes: (user.authorizedScopes ?? []).map((s: string) =>
			s === 'EMAIL' ? 'email' : s === 'FULL_NAME' ? 'name' : s,
		),
		user: {
			id: user.user,
			email: user.email ?? undefined,
			name,
			givenName: fullName?.givenName ?? undefined,
			familyName: fullName?.familyName ?? undefined,
		},
	}
}

export const appleAuth: AppleAuth = {
	supported: SignIn.isSupported(),
	configure(_config: AppleAuthConfig) {
		// No native configuration — the flow is bound to the app id entitlement.
	},
	async signIn(options?: AppleSignInOptions): Promise<SignInResult> {
		if (!SignIn.isSupported()) {
			return {
				status: 'error',
				message: 'Sign in with Apple needs iOS 13+ (unsupported on Android)',
			}
		}

		try {
			const user = await SignIn.signIn({
				// The plugin SHA-256s `nonce` before binding it into the request.
				scopes: options?.scopes?.map((s) => (s === 'email' ? 'EMAIL' : 'FULL_NAME')) as any,
				useNonce: options?.nonce !== undefined,
				nonce: options?.nonce,
			})
			return { status: 'success', credential: toCredential(user) }
		} catch (error) {
			return isCancel(error)
				? { status: 'cancelled' }
				: { status: 'error', message: String((error as any)?.message ?? error) }
		}
	},
	async getCredentialState(userId: string): Promise<AppleCredentialState> {
		if (!SignIn.isSupported()) {
			return 'unknown'
		}

		try {
			const state = await SignIn.getState(userId)
			switch (state) {
				case 'Authorized':
					return 'authorized'
				case 'Revoked':
					return 'revoked'
				case 'Transferred':
					return 'transferred'
				default:
					return 'notFound'
			}
		} catch {
			return 'unknown'
		}
	},
}
