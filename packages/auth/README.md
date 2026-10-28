# `@octane-xplat/auth`

Sign in with Apple and Google Sign-In for Octane xplat apps, behind one
`AuthUser`/`AuthCredential` contract. iOS and Android use the native SDKs
(`@nativescript/apple-sign-in`, `@nativescript/google-signin`), the browser
uses the providers' web SDKs (Apple JS / Google Identity Services), and the
macOS AppKit host uses AuthenticationServices through the ObjC bridge plus
an app-configured hosted Google flow. `createHostedAuth` adds a generic
hosted sign-in ceremony with Bearer session transport for apps whose
backend issues and redeems sign-in attempts.

```sh
pnpm add @octane-xplat/auth
```

```ts
import { appleAuth } from '@octane-xplat/auth'

appleAuth.configure({ clientId: 'com.example.app.web' })
if (appleAuth.supported) {
	const result = await appleAuth.signIn({ scopes: ['email', 'name'] })
	if (result.status === 'success') {
		// Send this credential to your backend for verification.
		const { idToken, user } = result.credential
	}
}
```

Each provider object reports `supported` — Apple is `false` on Android —
and exposes `configure`, `signIn`, and provider extras
(`appleAuth.getCredentialState`, `googleAuth.signOut`). `SignInResult`
distinguishes `success` / `cancelled` / `error`; a dismissed sheet is
`cancelled`, not a throw.

## Sign-in buttons

Apple uses the official ASAuthorizationAppleIDButton on AppKit; Google
uses a text trigger for the hosted flow there. The other sign-in buttons are
platform-authentic components, so render them from platform-suffixed files
or accept each target's native styling.

The following component belongs in an `.ios.tsx` file.

```tsx
import { AppleSignInButton, appleAuth, googleAuth } from '@octane-xplat/auth'

export function SignIn() {
	return (
		<AppleSignInButton
			onResult={(result) => {
				if (result.status === 'success') {
					void appleAuth.getCredentialState(result.credential.user.id)
				}
			}}
		/>
	)
}
// When ending a Google session:
await googleAuth.signOut()
```

Web needs registered client IDs; iOS needs the `applesignin` entitlement
and Google's `GoogleService-Info.plist`/reversed-client-id URL scheme;
Android needs `google-services.json` and a `serverClientId` for
`serverAuthCode`. Guide: [Using device
features](https://octane-xplat.goddardai.org/platform-services). Exercised by
[`AuthDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/AuthDemo.tsrx).

## macOS provider setup

On macOS, `supported` reports AuthenticationServices availability, not
completed provider registration. Apple needs a signed app ID with Sign in
with Apple enabled and a matching provisioning profile and entitlement.
Google needs `googleAuth.configure({ hostedFlow })`, where `createRequest`
starts a fresh backend attempt and `complete` validates/redeems the
captured callback on that backend, returning `AuthCredential`. A client ID
alone is insufficient on AppKit. The adapter receives the configured client
IDs, scopes, hosted domain, and per-attempt nonce; the backend must apply
and verify them.

See [macOS provider setup](https://octane-xplat.goddardai.org/platform-services#macos-provider-sign-in)
and the [maintained hosted adapter](https://github.com/octane-xplat/octane-xplat/blob/main/examples/auth/google-hosted.macos.ts).

## Hosted sign-in ceremonies

`createHostedAuth` authenticates a native app through a hosted sign-in page:
your `HostedAuthFlow` issues a PKCE-bound attempt and returns the hosted URL,
the app opens it in a system browser (`authSession` — ASWebAuthenticationSession
on iOS/macOS, Custom Tab on Android), and `complete` redeems the browser
callback. The client persists the credential record — a short-lived access
token plus a durable session credential — through
`@octane-xplat/secure-storage` (Keychain/Keystore), refreshes the access token
through the flow's `refresh`, and revokes through `revoke` on sign-out.

```ts
import { createHostedAuth, postJson, queryParam } from '@octane-xplat/auth'

export const auth = createHostedAuth({
	apiOrigin: 'https://api.example.com',
	flow: {
		async begin({ fetch, pkce }) {
			const res = await postJson(fetch, 'https://api.example.com/oauth/attempt', {
				code_challenge: pkce.challenge,
				scheme: 'myapp',
			})
			if (!res.ok) throw new Error(`attempt rejected (${res.status})`)
			const { attempt_id, state } = await res.json()
			return {
				url: `https://api.example.com/sign-in?attempt=${attempt_id}&state=${state}`,
				callbackScheme: 'myapp',
				state,
			}
		},
		async complete(callbackUrl, attempt, { fetch, pkce }) {
			const res = await postJson(fetch, 'https://api.example.com/oauth/exchange', {
				code: queryParam(callbackUrl, 'code'),
				code_verifier: pkce.verifier,
				state: attempt.state,
			})
			if (!res.ok) return null
			const { token, expires_at, session_token } = await res.json()
			return { expiresAt: expires_at * 1000, sessionToken: session_token, token }
		},
	},
})

const result = await auth.signIn() // opens the hosted sign-in page
if (result.status === 'success') {
	const response = await auth.fetch('/api/me') // Bearer attach + refresh-on-401
}
```

`auth.fetch` attaches `Authorization: Bearer <access token>` to same-origin
`/api/*` paths (the `/api/auth` mount is excluded by default — override
`authorizePath` for other layouts) and replays once after a refresh when the
server answers an `invalid_token` challenge in the same session. Sign-out or a
new sign-in retires pending requests: an already-dispatched request returns its
original response without replay, and one still loading credentials rejects.
The `callbackScheme` your flow
returns must be registered as an incoming-link scheme in the app (Android: a
manifest intent-filter) and allowlisted by your backend. On web `supported` is
`false` — browser apps keep the cookie session flow.

```ts
const status = await auth.restore() // 'authenticated' if a session was stored
await auth.signOut() // clears credentials, then attempts server revocation
```

Sign-out clears memory immediately and waits for earlier credential saves before
removing the stored record. It supersedes pending sign-in and refresh work:
an earlier sign-in resolves as `cancelled`. Server revocation and credential saves remain best-effort. Failed credential
deletion rejects with a sanitized error after revocation is attempted. Memory
remains signed out; report the failure and retry deletion before claiming the
session was durably cleared. A later explicit sign-in starts a new session.

```ts
const pending = auth.signIn()
await auth.signOut()
const result = await pending // status: 'cancelled' if the ceremony was still pending
```

A sign-out error can mean durable credential deletion failed even though the
in-memory session is retired. Report that failure and allow retry; do not
claim a future restart cannot restore the stored credential.

```ts
// Continue with the auth client defined above.
try {
	await auth.signOut()
} catch {
	console.log('Stored sign-in could not be cleared. Try signing out again.')
}
```
