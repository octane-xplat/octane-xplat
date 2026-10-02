// Google credentials on AppKit come from the app's hosted OAuth backend.
// The shared methods/result stay identical to the SDK leaves.
import { authSession } from '@octane-xplat/platform'
import type { GoogleAuth, GoogleAuthConfig, SignInResult } from './types'

let configuration: GoogleAuthConfig | undefined
let active = false

export const googleAuth: GoogleAuth = {
	get supported() {
		return authSession.supported
	},
	async configure(config) {
		configuration = config ? { ...config, scopes: config.scopes?.slice() } : undefined
	},
	async signIn(options = {}): Promise<SignInResult> {
		const config = configuration
		const flow = config?.hostedFlow
		const session = authSession.impl
		if (!session) {
			return { status: 'error', message: 'AuthenticationServices is unavailable on this host' }
		}

		if (!flow) {
			return {
				status: 'error',
				message: 'Google Sign-In on macOS requires configure({ hostedFlow })',
			}
		}

		if (active) {
			return { status: 'error', message: 'a Google Sign-In flow is already active' }
		}

		active = true
		try {
			const request = await flow.createRequest({
				...options,
				clientId: config?.clientId,
				serverClientId: config?.serverClientId,
				scopes: config?.scopes?.slice(),
				hostedDomain: config?.hostedDomain,
			})

			// Backend URLs must use TLS; the backend owns Google registration,
			// state/nonce binding and single-use callback-code redemption.
			if (!/^https:\/\//i.test(request.url)) {
				throw new Error('Google hosted sign-in requires an HTTPS URL')
			}

			const result = await session.open(request.url, {
				callbackScheme: request.callbackScheme,
				prefersEphemeralSession: true,
			})

			if (result.type === 'cancel') {
				return { status: 'cancelled' }
			}

			if (result.type === 'error') {
				return { status: 'error', message: result.message }
			}

			const credential = await flow.complete(result.url)
			if (
				credential?.provider !== 'google' ||
				typeof credential.user?.id !== 'string' ||
				!credential.user.id ||
				!Array.isArray(credential.scopes) ||
				credential.scopes.some((scope) => typeof scope !== 'string')
			) {
				throw new Error('Google hosted sign-in returned an invalid credential')
			}

			return { status: 'success', credential }
		} catch (error) {
			return { status: 'error', message: String((error as any)?.message ?? error) }
		} finally {
			active = false
		}
	},
	async signOut() {
		await configuration?.hostedFlow?.signOut?.()
	},
}
