# `@octane-xplat/auth`

Sign in with Apple and Google Sign-In for Octane xplat apps — the native
SDKs (`@nativescript/apple-sign-in`, `@nativescript/google-signin`) on
iOS/Android, the providers' web SDKs (Apple JS / Google Identity Services)
in the browser, and AuthenticationServices through the ObjC bridge plus a
app-configured hosted Google flow on the macOS AppKit host. One `AuthUser`/`AuthCredential`
contract everywhere.

```sh
pnpm add @octane-xplat/auth
```

```tsx
import { appleAuth, googleAuth, AppleSignInButton } from '@octane-xplat/auth'

appleAuth.configure({ clientId: 'com.example.app.web' }) // web-only fields

const result = await appleAuth.signIn({ scopes: ['email', 'name'] })
if (result.status === 'success') {
	const { idToken, user } = result.credential // hand idToken to your backend
}
```

Each provider object reports `supported` — Apple is `false` on Android —
and exposes `configure`, `signIn`, and provider extras
(`appleAuth.getCredentialState`, `googleAuth.signOut`). `SignInResult`
distinguishes `success` / `cancelled` / `error`; a dismissed sheet is
`cancelled`, not a throw. Apple uses the official ASAuthorizationAppleIDButton on AppKit; Google
uses a text trigger for the hosted flow there. The other sign-in buttons are
platform-authentic components, so render them from platform-suffixed files or accept each
target's native styling.

Web needs registered client IDs; iOS needs the `applesignin` entitlement
and Google's `GoogleService-Info.plist`/reversed-client-id URL scheme;
Android needs `google-services.json` and a `serverClientId` for
`serverAuthCode`. Guide: [Using device
features](../../docs/platform-services.md). Exercised by
[`AuthDemo`](../demos/src/AuthDemo.tsrx).

On macOS, `supported` reports AuthenticationServices availability, not completed
provider registration. Apple needs a signed app ID with Sign in with Apple
enabled and a matching provisioning profile and entitlement. Google needs
`googleAuth.configure({ hostedFlow })`, where `createRequest` starts a fresh
backend attempt and `complete` validates/redeems the captured callback on that
backend, returning `AuthCredential`. A client ID alone is insufficient on
AppKit. The adapter receives the configured client IDs, scopes, hosted domain,
and per-attempt nonce; the backend must apply and verify them.

See [macOS provider setup](../../docs/platform-services.md#macos-provider-sign-in)
and the [maintained hosted adapter](../../examples/auth/google-hosted.macos.ts).
