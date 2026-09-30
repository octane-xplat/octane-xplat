/** App-owned HTTP boundary. Supply cryptographic verification and durable,
 * atomic one-time attempt consumption; this example implements neither. */
export function providerVerification({ consumeAttempt, verifyIdToken, createSession }) {
	return async (request) => {
		if (request.method !== 'POST') {return new Response(null, { status: 405 })}
		try {
			const { attemptId, provider, idToken } = await request.json()
			if (
				typeof attemptId !== 'string' ||
				typeof idToken !== 'string' ||
				!['apple', 'google'].includes(provider)
			) {
				return new Response(null, { status: 400 })
			}

			// Bind attemptId to this browser/app session in the store. Consumption must
			// be atomic, expire attempts, and prevent reuse even on verification failure.
			const attempt = await consumeAttempt(request, attemptId)
			if (!attempt || attempt.provider !== provider) {return new Response(null, { status: 401 })}
			// The adapter MUST check signature against provider keys, issuer, audience,
			// expiry and nonce. Never implement it with JWT decoding alone. Return the
			// verified subject, never the client-supplied credential.user.id.
			const identity = await verifyIdToken({
				provider,
				idToken,
				audience: attempt.audience,
				nonce: attempt.nonce,
			})

			if (!identity?.subject) {return new Response(null, { status: 401 })}
			return await createSession(request, { provider, subject: identity.subject })
		} catch {
			// Credentials and provider exception text must not enter response/log output.
			return new Response(null, { status: 401 })
		}
	}
}

/** Hosted callback exchange: send callbackURL and the server-issued attemptId
 * to this endpoint. Store redeemCode as a server-only operation on the RP. */
export function hostedVerification({ callbackBase, consumeAttempt, redeemCode, createSession }) {
	const base = new URL(callbackBase)
	return async (request) => {
		if (request.method !== 'POST') {return new Response(null, { status: 405 })}
		try {
			const { attemptId, callbackURL } = await request.json()
			if (typeof attemptId !== 'string' || typeof callbackURL !== 'string')
				{return new Response(null, { status: 400 })}

			const url = new URL(callbackURL)
			if (
				url.protocol !== base.protocol ||
				url.host !== base.host ||
				url.pathname !== base.pathname ||
				url.hash ||
				url.username ||
				url.password
			) {
				return new Response(null, { status: 400 })
			}

			const codes = url.searchParams.getAll('code')
			const states = url.searchParams.getAll('state')
			if (codes.length !== 1 || !codes[0] || states.length !== 1 || !states[0])
				{return new Response(null, { status: 400 })}

			const attempt = await consumeAttempt(request, attemptId)
			if (!attempt || states[0] !== attempt.state) {return new Response(null, { status: 401 })}
			// Redeem once on the RP, bound to this attempt and its PKCE verifier. A URL
			// received on the right scheme alone never proves authentication.
			const identity = await redeemCode({ code: codes[0], attempt })
			if (!identity?.subject) {return new Response(null, { status: 401 })}
			return await createSession(request, identity)
		} catch {
			return new Response(null, { status: 401 })
		}
	}
}
