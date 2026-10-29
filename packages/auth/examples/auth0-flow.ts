/** App-owned Auth0 adapter for the authentication guide; not a framework export. */
import { postJson, queryParam } from '@octane-xplat/auth'
import type { HostedAuthCredentials, HostedAuthFlow } from '@octane-xplat/auth'
import { random } from '@octane-xplat/platform'

export interface Auth0Options {
	/** Your Auth0 tenant/custom HTTPS origin, without a path. */
	issuer: string
	/** Public Native application client ID; never a client secret. */
	clientId: string
	/** Identifier of the API registered in Auth0. */
	audience: string
	/** Exact custom-scheme callback allowlisted in the Native application. */
	redirectUri: string
}

export function createAuth0Flow(options: Auth0Options): HostedAuthFlow {
	if (!/^https:\/\/[a-z\d.-]+\/?$/i.test(options.issuer)) {
		throw new Error('Use the HTTPS Auth0 origin without a path')
	}
	if (
		!/^[a-z][a-z\d+.-]*:\/\/[^?#\s]+$/i.test(options.redirectUri) ||
		/^https?:/i.test(options.redirectUri)
	) {
		throw new Error('Use a custom-scheme callback without a query or fragment')
	}
	const issuer = options.issuer.replace(/\/$/, '')
	const callbackScheme = options.redirectUri.split(':')[0]
	return {
		async begin({ pkce }) {
			if (!pkce) {
				throw new Error('PKCE parameters are required')
			}
			const state = Array.from(random.bytes(16), (b) => b.toString(16).padStart(2, '0')).join('')
			const parameters = {
				response_type: 'code',
				client_id: options.clientId,
				redirect_uri: options.redirectUri,
				audience: options.audience,
				scope: 'openid profile email offline_access',
				code_challenge: pkce.challenge,
				code_challenge_method: 'S256',
				state,
			}
			const query = Object.entries(parameters)
				.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
				.join('&')
			return { url: `${issuer}/authorize?${query}`, callbackScheme, state }
		},
		async complete(callback, attempt, { fetch, pkce }) {
			if (
				!pkce ||
				callback.includes('#') ||
				callback.split('?')[0] !== options.redirectUri ||
				queryParam(callback, 'state') !== attempt.state ||
				queryParam(callback, 'error')
			) {
				return null
			}
			const code = queryParam(callback, 'code')
			if (!code) {
				return null
			}
			const response = await postJson(fetch, `${issuer}/oauth/token`, {
				grant_type: 'authorization_code',
				client_id: options.clientId,
				code,
				code_verifier: pkce.verifier,
				redirect_uri: options.redirectUri,
			})
			if (!response.ok) {
				throw new Error('Sign-in exchange failed')
			}
			return credentials(await response.json())
		},
		async refresh(previous, { fetch }) {
			const response = await postJson(fetch, `${issuer}/oauth/token`, {
				grant_type: 'refresh_token',
				client_id: options.clientId,
				refresh_token: previous.sessionToken,
			})
			const data = await response.json()
			if (!response.ok) {
				if (record(data)?.error === 'invalid_grant') {
					return null
				}
				throw new Error('Session refresh is temporarily unavailable')
			}
			return credentials(data, previous.sessionToken)
		},
		async revoke(previous, { fetch }) {
			const response = await postJson(fetch, `${issuer}/oauth/revoke`, {
				client_id: options.clientId,
				token: previous.sessionToken,
			})
			if (!response.ok) {
				throw new Error('Session revocation failed')
			}
		},
	}
}

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function credentials(value: unknown, previousRefresh?: string): HostedAuthCredentials {
	const data = record(value)
	const token = data?.access_token
	const lifetime = data?.expires_in
	const refresh = data?.refresh_token ?? previousRefresh
	const expiresAt = typeof lifetime === 'number' ? Date.now() + lifetime * 1000 : NaN
	if (
		typeof token !== 'string' ||
		!token ||
		data?.token_type !== 'Bearer' ||
		typeof lifetime !== 'number' ||
		!Number.isSafeInteger(lifetime) ||
		lifetime <= 0 ||
		!Number.isFinite(expiresAt) ||
		typeof refresh !== 'string' ||
		!refresh
	) {
		throw new Error('Provider did not return a usable session')
	}
	return { token, sessionToken: refresh, expiresAt }
}
