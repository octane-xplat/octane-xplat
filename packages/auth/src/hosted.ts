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
	let refreshPromise: Promise<string | null> | null = null

	function store(): HostedAuthCredentialStore | null {
		return config.storage ?? secureStorage.impl
	}

	async function persist(creds: HostedAuthCredentials | null) {
		credentials = creds
		const storage = store()
		if (!storage) {
			return
		}

		try {
			if (creds) {
				await storage.set(storageKey, JSON.stringify(creds))
			} else {
				await storage.remove(storageKey)
			}
		} catch {
			// Persistence is best-effort — the session still lives in memory.
		}
	}

	async function load(): Promise<HostedAuthCredentials | null> {
		if (credentials !== undefined) {
			return credentials
		}

		const storage = store()
		if (!storage) {
			credentials = null
			return null
		}

		try {
			const raw = await storage.get(storageKey)
			const parsed = raw ? parseCredentials(raw) : null
			// Assign only if still unrestored — a signIn/persist landing mid-read wins.
			if (credentials === undefined) {
				credentials = parsed
			}

			if (!parsed && raw) {
				await storage.remove(storageKey)
			}
		} catch {
			// Unreadable storage is treated as empty.
			credentials ??= null
		}

		return credentials ?? null
	}

	async function refresh(): Promise<string | null> {
		const creds = await load()
		if (!creds || !config.flow.refresh) {
			return null
		}

		const next = await config.flow.refresh(creds, { fetch: transport })
		if (!isCredentials(next)) {
			// The durable session is expired or revoked — local state is dead.
			await persist(null)
			return null
		}

		await persist(next)
		return next.token
	}

	function refreshedAccessToken(): Promise<string | null> {
		refreshPromise ??= refresh().finally(() => {
			refreshPromise = null
		})

		return refreshPromise
	}

	async function getAccessToken(): Promise<string | null> {
		const creds = await load()
		if (!creds) {
			return null
		}

		if (creds.expiresAt - now() > REFRESH_SKEW_MS) {
			return creds.token
		}

		return refreshedAccessToken()
	}

	async function signIn(): Promise<HostedAuthSignInResult> {
		const session = config.authSession ?? {
			supported: authSession.supported,
			open: (url, options) => {
				const impl = authSession.impl
				if (!impl) {
					return Promise.resolve({
						type: 'error' as const,
						message: 'hostedAuth: hosted sign-in is not supported on this target',
					})
				}

				return impl.open(url, options)
			},
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
			return { status: 'error', message: errorMessage(error) }
		}

		const result = await session.open(attempt.url, { callbackScheme: attempt.callbackScheme })
		if (result.type === 'cancel') {
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

			if (!isCredentials(creds)) {
				return {
					status: 'error',
					message: 'hostedAuth: sign-in did not produce credentials',
				}
			}

			await persist(creds)
			return { status: 'success' }
		} catch (error) {
			return { status: 'error', message: errorMessage(error) }
		}
	}

	async function fetchWithAuth(url: string, init?: HostedAuthRequestInit) {
		const pathname = apiPath(url, apiOrigin)

		if (pathname === null || !authorizePath(pathname)) {
			return transport(url, init)
		}

		const target = url.startsWith('/') ? `${apiOrigin}${url}` : url
		const token = await getAccessToken()
		const response = await transport(target, token === null ? init : withBearer(init, token))

		if (!isInvalidAccessTokenChallenge(response.status, response.headers)) {
			return response
		}

		const refreshed = await refreshedAccessToken()
		if (refreshed === null) {
			return response
		}

		return transport(target, withBearer(init, refreshed))
	}

	async function signOut() {
		const creds = await load()
		await persist(null)
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
	if (!/^https?:\/\/[^\s/?#]+$/u.test(trimmed)) {
		throw new TypeError(
			`hostedAuth: apiOrigin must be an HTTP(S) origin without path or parameters, got ${JSON.stringify(value)}`,
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
			return eq === -1 ? '' : decodeURIComponent(pair.slice(eq + 1).replaceAll('+', ' '))
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
