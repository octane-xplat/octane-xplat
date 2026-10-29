/** Small app-owned API for the authentication guide. */
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose'

export interface ApiOptions {
	issuer: string
	audience: string
	/** Tests supply trusted local keys; production uses only the configured issuer. */
	keys?: JWTVerifyGetKey
}

export function createApi({ issuer, audience, keys }: ApiOptions) {
	const authority = new URL(issuer)
	if (
		authority.protocol !== 'https:' ||
		authority.username ||
		authority.password ||
		authority.pathname !== '/' ||
		authority.search ||
		authority.hash ||
		issuer !== authority.origin + '/' ||
		!audience.trim()
	) {
		throw new Error('Configure an HTTPS issuer origin with a trailing slash')
	}
	const jwks = keys ?? createRemoteJWKSet(new URL('.well-known/jwks.json', authority))
	return async (request: Request): Promise<Response> => {
		const headers = { 'Cache-Control': 'no-store' }
		if (new URL(request.url).pathname !== '/api/me') {
			return new Response(null, { status: 404, headers })
		}
		if (request.method !== 'GET') {
			return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } })
		}
		const authorization = request.headers.get('Authorization')
		const match = authorization?.match(/^Bearer ([^\s]+)$/)
		if (!match) {
			return new Response(null, { status: 401, headers })
		}
		try {
			const { payload } = await jwtVerify(match[1], jwks, {
				issuer,
				audience,
				algorithms: ['RS256'],
				requiredClaims: ['sub', 'exp', 'iat'],
			})
			if (typeof payload.sub !== 'string' || !payload.sub) {
				return new Response(null, {
					status: 401,
					headers: { ...headers, 'WWW-Authenticate': 'Bearer error="invalid_token"' },
				})
			}
			return Response.json({ subject: payload.sub }, { headers })
		} catch (error) {
			const invalid =
				error instanceof errors.JWTExpired ||
				error instanceof errors.JWTClaimValidationFailed ||
				error instanceof errors.JWTInvalid ||
				error instanceof errors.JWSInvalid ||
				error instanceof errors.JWSSignatureVerificationFailed ||
				error instanceof errors.JOSEAlgNotAllowed ||
				error instanceof errors.JWKSNoMatchingKey
			if (!invalid) {return new Response(null, { status: 503, headers })}
			return new Response(null, {
				status: 401,
				headers: { ...headers, 'WWW-Authenticate': 'Bearer error="invalid_token"' },
			})
		}
	}
}
