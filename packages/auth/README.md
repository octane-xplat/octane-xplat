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
bun add @octane-xplat/auth
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

### AppKit button action ownership

AppKit provider buttons read current props when activated, ignore disabled or
repeated pending presses, and recheck committed lifetime/disabled state after
`onPress`. The hook's return value is ignored; it remains a notification rather
than a gate. A queued screen update may commit after provider work starts.
Pending results use the latest mounted `onResult`, including when props become
disabled while work is underway. Unmount/replacement suppresses the old button's
result; it does not cancel an already-started native controller/browser.

```tsx
import { GoogleSignInButton } from '@octane-xplat/auth'

export function GoogleEntry() {
	return <GoogleSignInButton onPress={() => console.log('Sign-in requested')}
		onResult={(result) => console.log(result.status)} />
}
```

The Google AppKit trigger now uses the renderer's native NSButton action path;
it is not an official Google SDK button. The existing native intrinsic supports
`text`/`isEnabled` and native action dispatch, with no new dependency. Apple keeps
its official button; theme/type replacement detaches only the old attachment and
does not retire a pending result while the component remains mounted. AppKit
Google theme/variant props remain unimplemented; this is not shared pixel parity.

```tsx
import { AppleSignInButton, GoogleSignInButton } from '@octane-xplat/auth'

export function UnavailableEntries() {
	return <><AppleSignInButton disabled /><GoogleSignInButton disabled /></>
}
```

Unexpected provider throws/rejections become one generic error result for the
current mounted owner, without exposing exception text. Consumer `onPress` errors
propagate and release the action claim; consumer `onResult` errors are not
reclassified as provider failures. There is no automatic busy indicator; repeated
activation is suppressed while the provider promise is pending. Other button
instances and imperative calls remain subject to each provider's active-flow guard.
Six action-model and three native-renderer branch cases plus a manual lifecycle
fixture are authored, all unrun. Actual hook/effect timing, target/action/NSButton
Tab/keyboard/VoiceOver, Apple attachment replacement, native layout/disabled state,
controller/browser lifetime and clean consumers remain unqualified.

```sh
bun run probe run examples/probes/auth-buttons.macos.tsrx --target macos --watch
```

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

### Keep Apple sign-in with its initiating window

Native Apple sign-in captures scopes/nonce and keeps the initiating visible key
or main window as its presentation anchor. A window with an attached sheet is
ineligible; it never borrows an arbitrary first window. Closing that window or
terminating the app retires the attempt as cancelled and asks the controller to
cancel when that selector exists (macOS 13+). Screen unmount/hiding alone is not
window close. Missing lifecycle-observer metadata produces an error before the
controller starts; partial class registration can retry.

```ts
import { appleAuth } from '@octane-xplat/auth'

export async function signInWithApple(backendAttemptNonce: string) {
	const result = await appleAuth.signIn({ scopes: ['email'], nonce: backendAttemptNonce })
	if (result.status === 'cancelled') console.log('Apple sign-in cancelled')
	return result
}
```

Only the owned controller and delegate can deliver results; stale/foreign callbacks
are ignored before credential decoding. Teardown retires JS state before native
cancellation, so late callbacks cannot release a replacement. Cancellation failure
or older hosts without cancel can leave native UI open despite a retired JS result;
observer removal errors can retain inert native observers. A controller without a
terminal callback stays pending until its presenter/app closes; no timer invents
success. Framework availability does not prove entitlements or a working consent UI.

```ts
const result = await appleAuth.signIn()
if (result.status === 'success') {
	// Send result.credential to your backend; validate the identity token,
	// expected audience and per-attempt nonce before creating an app session.
}
```

Eleven Apple model cases (eight new) and a manual official-button fixture are
authored, unrun. Native method registration/wrapper identity, UI/callbacks/thread/
window/termination/HMR lifetime, real credential-state/nonce behavior, entitlement/
provisioning/signing, VoiceOver and installed consumers remain unqualified.
Source follows the installed SDK and Apple's
[authorization controller](https://developer.apple.com/documentation/authenticationservices/asauthorizationcontroller)
and [cancel contract](https://developer.apple.com/documentation/authenticationservices/asauthorizationcontroller/cancel()).
No sign-in occurs when the fixture mounts:

```sh
bun run probe run examples/probes/apple-auth.macos.tsrx --target macos --watch
```

For a complete configured path, follow [Add sign-in and maintain a session](https://octane-xplat.goddardai.org/authentication), including the maintained Auth0 adapter and verified API example.

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
