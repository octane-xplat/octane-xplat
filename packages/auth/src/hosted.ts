// Hosted-auth client — the session transport for native apps that sign in
// through a hosted page. Sign-in is a PKCE-bound system-browser ceremony
// (authSession): the flow's `begin` issues a backend attempt and returns
// the hosted URL, the browser returns on a custom scheme, and `complete`
// redeems the callback into a short-lived access token (Bearer on API
// calls) plus a durable session credential (refresh + sign-out).
//
// The client owns the ceremony lifecycle and credential storage; the
// `HostedAuthFlow` adapter owns where requests go and what they carry —
// no backend endpoints or field names are baked in here.
//
// Everything is string plumbing — no DOM globals (URL/Headers/Request types
// are not declared in the native typecheck program, invariant 4).
import { authSession, random } from '@octane-xplat/platform'
import { secureStorage } from '@octane-xplat/secure-storage'
import { bytesToBase64Url } from './base64'
import { sha256, utf8Bytes } from './sha256'
import type {
	HostedAuth,
	HostedAuthAttempt,
	HostedAuthConfig,
	HostedAuthCredentialStore,
	HostedAuthCredentials,
	HostedAuthFetch,
	HostedAuthRequestInit,
	HostedAuthSignInResult,
} from './types'

const DEFAULT_STORAGE_KEY = 'hosted-auth'
// Re-mint the access token this far ahead of its server-side expiry.
const REFRESH_SKEW_MS = 30_000

export function createHostedAuth(config: HostedAuthConfig): HostedAuth {
	const apiOrigin = normalizeOrigin(config.apiOrigin)
	const authorizePath = config.authorizePath ?? defaultAuthorizePath
	const storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY
	const now = config.now ?? Date.now
	const transport: HostedAuthFetch =
		config.fetch ??
		((url, init) => {
			const impl = (globalThis as { fetch?: HostedAuthFetch }).fetch
			if (!impl) {
				return Promise.reject(new Error('hostedAuth: fetch is unavailable on this target'))
			}

			return impl(url, init)
		})

	let credentials: HostedAuthCredentials | null | undefined
	let generation = 0
	// Request ownership also changes when a pending sign-in installs its session.
	let requestGeneration = 0
	let storageTail: Promise<void> = Promise.resolve()
	let refreshPromise: Promise<string | null> | null = null
	let signingIn: Promise<HostedAuthSignInResult> | null = null

	function store(): HostedAuthCredentialStore | null {
		return config.storage ?? secureStorage
	}

	function storageOperation<T>(run: () => T | PromiseLike<T>): Promise<T> {
		const result = storageTail.then(run)
		storageTail = result.then(() => {}, () => {})
		return result
	}

	async function persist(creds: HostedAuthCredentials | null) {
		credentials = creds
		const storage = store()
		if (!storage) {return}
		try {
			await storageOperation(() => creds
				? storage.set(storageKey, JSON.stringify(creds))
				: storage.remove(storageKey))
		} catch {
			// Persistence is best-effort — the session still lives in memory.
		}
	}

	async function readStoredCredentials(): Promise<HostedAuthCredentials | null> {
		const storage = store()
		if (!storage) {return null}
		try {
			const raw = await storageOperation(() => storage.get(storageKey))
			const parsed = raw ? parseCredentials(raw) : null
			if (!parsed && raw && credentials === undefined) {
				await storageOperation(() => storage.remove(storageKey))
			}
			return parsed
		} catch {
			return null
		}
	}

	async function load(): Promise<HostedAuthCredentials | null> {
		if (credentials === undefined) {
			const restored = await readStoredCredentials()
			// A sign-in or sign-out landing mid-read owns the credential slot.
			if (credentials === undefined) {credentials = restored}
		}
		return credentials
	}

	async function refresh(): Promise<string | null> {
		const owner = generation
		const creds = await load()
		if (owner !== generation || !creds || !config.flow.refresh) {
			return null
		}

		const next = await config.flow.refresh(creds, { fetch: transport })
		// A signOut or fresh signIn landing mid-refresh owns the credential
		// slot — reconciling `creds` would resurrect or clobber that session.
		if (owner !== generation || credentials !== creds) {
			return null
		}

		if (!isCredentials(next)) {
			// The durable session is expired or revoked — local state is dead.
			await persist(null)
			return null
		}

		await persist(next)
		return owner === generation && credentials === next ? next.token : null
	}

	function refreshedAccessToken(): Promise<string | null> {
		if (refreshPromise === null) {
			const request = refresh().finally(() => {
				if (refreshPromise === request) {refreshPromise = null}
			})
			refreshPromise = request
		}

		return refreshPromise
	}

	async function getAccessToken(): Promise<string | null> {
		const owner = generation
		const creds = await load()
		if (owner !== generation || !creds) {
			return null
		}

		if (creds.expiresAt - now() > REFRESH_SKEW_MS) {
			return creds.token
		}

		return refreshedAccessToken()
	}

	function signIn(): Promise<HostedAuthSignInResult> {
		if (signingIn) {
			return Promise.resolve({
				status: 'error',
				message: 'hostedAuth: a hosted sign-in flow is already active',
			})
		}

		const owner = ++generation
		requestGeneration++
		refreshPromise = null
		const request = runSignIn(owner).catch((error): HostedAuthSignInResult =>
			owner !== generation ? { status: 'cancelled' } : { status: 'error', message: errorMessage(error) },
		).finally(() => {
			if (signingIn === request) {signingIn = null}
		})
		signingIn = request
		return request
	}

	async function runSignIn(owner: number): Promise<HostedAuthSignInResult> {
		const session = config.authSession ?? {
			supported: authSession.supported,
			open: (url, options) =>
				authSession.supported
					? authSession.open(url, options)
					: Promise.resolve({
							type: 'error' as const,
							message: 'hostedAuth: hosted sign-in is not supported on this target',
						}),
		}

		if (!session.supported || !random.supported) {
			return {
				status: 'error',
				message: 'hostedAuth: hosted sign-in is not supported on this target',
			}
		}

		const verifier = bytesToBase64Url(random.bytes(32))
		const pkce = { challenge: bytesToBase64Url(sha256(utf8Bytes(verifier))), verifier }

		let attempt: HostedAuthAttempt
		try {
			attempt = await config.flow.begin({ fetch: transport, pkce })
		} catch (error) {
			return owner !== generation ? { status: 'cancelled' } : { status: 'error', message: errorMessage(error) }
		}

		if (owner !== generation) {return { status: 'cancelled' }}
		const result = await session.open(attempt.url, { callbackScheme: attempt.callbackScheme })
		if (owner !== generation || result.type === 'cancel') {
			return { status: 'cancelled' }
		}

		if (result.type === 'error') {
			return { status: 'error', message: result.message }
		}

		if (attempt.state !== undefined && queryParam(result.url, 'state') !== attempt.state) {
			return {
				status: 'error',
				message: 'hostedAuth: callback did not carry the expected state',
			}
		}

		try {
			const creds = await config.flow.complete(result.url, attempt, {
				fetch: transport,
				pkce,
			})

			if (owner !== generation) {return { status: 'cancelled' }}
			if (!isCredentials(creds)) {
				return {
					status: 'error',
					message: 'hostedAuth: sign-in did not produce credentials',
				}
			}

			requestGeneration++
			await persist(creds)
			return { status: owner === generation ? 'success' : 'cancelled' }
		} catch (error) {
			return owner !== generation ? { status: 'cancelled' } : { status: 'error', message: errorMessage(error) }
		}
	}

	async function fetchWithAuth(url: string, init?: HostedAuthRequestInit) {
		const pathname = apiPath(url, apiOrigin)

		if (pathname === null || !authorizePath(pathname)) {
			return transport(url, init)
		}

		const target = url.startsWith('/') ? `${apiOrigin}${url}` : url
		const owner = requestGeneration
		const token = await getAccessToken()
		if (owner !== requestGeneration) {
			throw new Error('hostedAuth: request session changed')
		}
		const response = await transport(target, token === null ? init : withBearer(init, token))

		if (owner !== requestGeneration || !isInvalidAccessTokenChallenge(response.status, response.headers)) {
			return response
		}

		const refreshed = await refreshedAccessToken()
		if (owner !== requestGeneration || refreshed === null) {
			return response
		}

		try {
			return await transport(target, withBearer(init, refreshed))
		} catch {
			// A consumed one-shot body cannot be replayed — surface the
			// original challenge response instead of a transport throw.
			return response
		}
	}

	async function signOut() {
		generation++
		requestGeneration++
		signingIn = null
		refreshPromise = null
		const previous = credentials === undefined ? readStoredCredentials() : Promise.resolve(credentials)
		// Retire memory synchronously, then remove after earlier durable saves.
		await persist(null)
		const creds = await previous
		if (!creds || !config.flow.revoke) {
			return
		}

		try {
			await config.flow.revoke(creds, { fetch: transport })
		} catch {
			// Revocation is best-effort — local credentials are already cleared.
		}
	}

	return {
		get supported() {
			return (config.authSession?.supported ?? authSession.supported) && random.supported
		},
		restore: async () => ((await load()) ? 'authenticated' : 'unauthenticated'),
		signIn,
		getAccessToken,
		fetch: fetchWithAuth,
		signOut,
	}
}

function normalizeOrigin(value: string): string {
	const trimmed = value.trim().replace(/\/+$/u, '')
	// Bearer credentials and the sessionToken-bearing refresh/revoke calls
	// travel to this origin — it must be TLS. Loopback HTTP stays allowed for
	// local development backends. Userinfo never belongs in an apiOrigin.
	const secure = /^https:\/\/[^@\s/?#]+$/u.test(trimmed)
	const loopback = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/u.test(trimmed)
	if (!secure && !loopback) {
		throw new TypeError(
			`hostedAuth: apiOrigin must be an HTTPS origin without path or parameters (loopback HTTP is allowed for local development), got ${JSON.stringify(value)}`,
		)
	}

	return trimmed
}

/** `POST` a JSON body through the flow's transport. */
export function postJson(transport: HostedAuthFetch, url: string, body: Record<string, string>) {
	return transport(url, {
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json' },
		method: 'POST',
	})
}

/** `?name=value` extraction without URLSearchParams (not in the native program). */
export function queryParam(url: string, name: string): string | null {
	const start = url.indexOf('?')
	if (start === -1) {
		return null
	}

	const query = url.slice(start + 1).split('#', 1)[0]
	for (const pair of query.split('&')) {
		const eq = pair.indexOf('=')
		const key = eq === -1 ? pair : pair.slice(0, eq)
		if (key === name) {
			if (eq === -1) {
				return ''
			}

			try {
				return decodeURIComponent(pair.slice(eq + 1).replaceAll('+', ' '))
			} catch {
				// Malformed percent escapes read as absent — callers compare
				// against the expected value and report an ordinary mismatch.
				return null
			}
		}
	}

	return null
}

function isCredentials(value: unknown): value is HostedAuthCredentials {
	const creds = value as HostedAuthCredentials | null
	return (
		!!creds &&
		typeof creds.token === 'string' &&
		typeof creds.expiresAt === 'number' &&
		typeof creds.sessionToken === 'string'
	)
}

function parseCredentials(raw: string): HostedAuthCredentials | null {
	try {
		const parsed = JSON.parse(raw) as Partial<HostedAuthCredentials>
		if (isCredentials(parsed)) {
			return { expiresAt: parsed.expiresAt, sessionToken: parsed.sessionToken, token: parsed.token }
		}
	} catch {
		// fall through
	}

	return null
}

/**
 * Pathname of `url` when it belongs to `apiOrigin` — `null` for other
 * origins. Relative (`/path`) and origin-prefixed inputs both resolve.
 */
function apiPath(url: string, apiOrigin: string): string | null {
	if (url.startsWith('//')) {
		return null
	}

	let path: string
	if (url.startsWith('/')) {
		path = url
	} else if (url.startsWith(apiOrigin + '/') || url === apiOrigin) {
		path = url.slice(apiOrigin.length) || '/'
	} else {
		return null
	}

	const end = path.search(/[?#]/u)
	return end === -1 ? path : path.slice(0, end)
}

/**
 * Default `authorizePath` — every same-origin path under `/api/` except the
 * `/api/auth` mount hosted backends reserve for auth endpoints.
 */
function defaultAuthorizePath(pathname: string): boolean {
	return (
		pathname.startsWith('/api/') && !(pathname === '/api/auth' || pathname.startsWith('/api/auth/'))
	)
}

function withBearer(init: HostedAuthRequestInit | undefined, token: string): HostedAuthRequestInit {
	const headers: Record<string, string> = {}
	const incoming = init?.headers
	if (incoming) {
		if (Symbol.iterator in incoming) {
			for (const [name, value] of incoming) {
				headers[name.toLowerCase()] = value
			}
		} else {
			for (const name of Object.keys(incoming)) {
				headers[name.toLowerCase()] = incoming[name]
			}
		}
	}

	headers.authorization = `Bearer ${token}`
	return { ...init, headers }
}

/**
 * RFC 6750 `401 + WWW-Authenticate: Bearer error="invalid_token"` — the
 * challenge that distinguishes a dead access token from an ordinary
 * authorization failure.
 */
function isInvalidAccessTokenChallenge(
	status: number,
	headers: { get(name: string): string | null },
): boolean {
	if (status !== 401) {
		return false
	}

	const challenge = headers.get('www-authenticate')
	return !!challenge && /error\s*=\s*"invalid_token"/iu.test(challenge)
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'hostedAuth: the hosted ceremony failed'
}
