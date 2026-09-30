# Sign in with Apple or Google provider SDKs

ID: provider-sign-in
Targets: web, ios, android, macos
Related APIs: @octane-xplat/auth, appleAuth, googleAuth, AppleSignInButton, GoogleSignInButton, SignInResult, authSession

## Starting point

An app that wants native "Sign in with Apple" / "Sign in with Google"
buttons and hands the resulting credential to its own backend for
verification. The reader can already build each target and owns token
verification server-side; this recipe covers credential acquisition only —
session storage and refresh stay app-owned.

## Requirements

- Render the provider's sign-in button and/or trigger the flow headlessly from one shared screen.
- Acquire a credential (`idToken`, optional `authorizationCode`, user identity) on iOS, Android, and web.
- Register the provider-specific prerequisites on each target (Apple entitlement / Services ID + return URL, Google client id / google-services).
- Handle user cancellation, errors, and targets where a provider cannot run.

## Acceptance criteria

- AC1: The reader can place `AppleSignInButton`/`GoogleSignInButton` (or call `appleAuth.signIn()`/`googleAuth.signIn()`) and observe a `SignInResult` — `success` with `credential`, `cancelled`, or `error` — on each intended target.
- AC2: The reader can complete per-target registration: the `com.apple.developer.applesignin` entitlement on iOS, Services ID + return URL via `appleAuth.configure` on web, `GIDClientID`/`googleAuth.configure({ clientId })` for Google, and can state which steps no target needs.
- AC3: The reader can interpret the credential shape (`provider`, `idToken`, `authorizationCode`, `accessToken`, `scopes`, `user`) and knows verification happens server-side.
- AC4: The reader can reproduce a user cancel and an unsupported target (`supported: false` — Apple on Android, both providers on macOS) and choose `authSession` as the hosted-ceremony alternative.

## Documentation

- AC1: [Provider SDK sign-in](../docs/platform-services.md#provider-sdk-sign-in-apple--google) and the `AuthDemo` screen in `@xplat/demos`. Gap: the demo cannot complete a real sign-in without app-registered client IDs — it exercises the error path only.
- AC2: [Provider SDK sign-in](../docs/platform-services.md#provider-sdk-sign-in-apple--google). Gap: per-provider portal steps (Services ID creation, Google Cloud client setup) are summarized, not walked through.
- AC3: [Provider SDK sign-in](../docs/platform-services.md#provider-sdk-sign-in-apple--google) and `@octane-xplat/auth` type declarations (`AuthCredential`, `SignInResult`). Gap: no maintained server-verification example.
- AC4: [Provider SDK sign-in](../docs/platform-services.md#provider-sdk-sign-in-apple--google) covers `cancelled`/`error`/`supported` and links the hosted `authSession` alternative in [Passkeys and auth ceremonies](../docs/platform-services.md#passkeys-and-auth-ceremonies). Gap: on-device cancel reproduction is unverified.
