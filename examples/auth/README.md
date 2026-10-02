# Server sign-in exchange boundaries

Use `providerVerification` or `hostedVerification` from
[server-verification.mjs](server-verification.mjs) in your app-owned backend.
The exported functions return a Fetch request handler. They are transport and
validation examples, not an identity provider or a working auth server.

```js
import { providerVerification, hostedVerification } from './server-verification.mjs'

// adapters must implement the checks described in the table below.
export function signInEndpoints(adapters, callbackBase) {
	return {
		provider: providerVerification(adapters),
		hosted: hostedVerification({ ...adapters, callbackBase }),
	}
}
```

Supply these adapters before exposing an endpoint:

| Adapter                                                 | Required behavior                                                                                                                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `consumeAttempt(request, attemptId)`                    | Authenticate the request's app/browser session; atomically consume a short-lived attempt belonging to it. Return server-stored provider, audience, nonce, or hosted state and PKCE verifier. Reject expired, cross-session, and reused attempts.                                |
| `verifyIdToken({ provider, idToken, audience, nonce })` | Use the provider's supported server verifier or a maintained JWT library. Verify signature with trusted provider keys, allowed algorithms, issuer, expiry, audience and the nonce representation used by that provider SDK. Return `{ subject }` only after every check passes. |
| `redeemCode({ code, attempt })`                         | Redeem a short-lived code once on your trusted RP over HTTPS, binding it to the stored attempt and PKCE verifier. Return the server-verified identity.                                                                                                                          |
| `createSession(request, identity)`                      | Issue the app session using your backend's cookie/token policy. Never return provider credentials or create a session from a decoded/unverified token.                                                                                                                          |

Generate attempts and challenges on the server. Never accept expected audience,
nonce, state, PKCE verifier, or a user ID from the sign-in response body.
Rate limits, body-size limits, cookie/CSRF policy, secure storage and refresh are
also app-owned. Restrict each endpoint to its intended provider and registered
client IDs. Do not log ID tokens, callback URLs, codes or session tokens.

After provider SDK success, POST only the server-issued `attemptId`, `provider`
and `idToken` to the provider endpoint. Handle a missing ID token as a separate
code-exchange flow; this example deliberately rejects it. After hosted-session
success, POST `attemptId` and `callbackURL` to the hosted endpoint; a `success`
result from `authSession` means URL receipt, not server authentication.

```ts
// Client .ts module; inputs come from the server attempt and successful SDK result.
export async function exchangeProviderCredential(
	attemptId: string,
	provider: 'apple' | 'google',
	idToken: string,
) {
	return fetch('/auth/provider', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ attemptId, provider, idToken }),
	})
}
export async function exchangeHostedCallback(attemptId: string, callbackURL: string) {
	return fetch('/auth/hosted', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ attemptId, callbackURL }),
	})
}
```

Run the boundary tests from the repo root:

```sh
node --test examples/auth/server-verification.test.mjs
```

They use injected adapters to verify rejection and replay boundaries. They do
not verify real JWT signatures, WebAuthn attestations, provider SDK sign-in,
code redemption or session issuance. For web passkeys, send the JSON credential
returned by `webAuthn.get`/`create` to your RP's verification endpoint; the RP must
verify its stored challenge, origin, RP ID, signature and credential counter
using its WebAuthn server implementation. That RP implementation is not supplied
here and remains a recipe coverage gap.

```ts
import { webAuthn } from '@octane-xplat/platform'

// options are the RP's JSON request options, fetched for this attempt.
export async function submitPasskey(
	options: import('@octane-xplat/platform').WebAuthnGetOptionsJSON,
) {
	if ((await webAuthn.ensure()) !== 'granted') return
	const credential = await webAuthn.impl!.get(options)
	return fetch('/auth/passkey/verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credential),
	})
}
```

For Google on AppKit, [google-hosted.macos.ts](google-hosted.macos.ts) wires
app-owned `begin`, `complete`, and `signOut` transport functions into
`googleAuth.configure({ hostedFlow })`. `complete` must return a verified Google
`AuthCredential` after binding the callback to the stored attempt; the handlers
above issue app sessions, so adapt their response for this contract. This adapter
supplies neither hosted endpoints nor cryptographic verification. Full setup and
checks: [macOS provider sign-in](../../docs/platform/platform-services.md#macos-provider-sign-in).
