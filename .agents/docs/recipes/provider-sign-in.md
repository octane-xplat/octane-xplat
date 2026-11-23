# Sign in with Apple or Google provider SDKs

ID: provider-sign-in
Targets: web, ios, android, macos
Related APIs: @octane-xplat/auth, appleAuth, googleAuth, AppleSignInButton, GoogleSignInButton, AppleSignInOptions, SignInResult, authSession

## Starting point

An app that wants native "Sign in with Apple" / "Sign in with Google"
buttons and hands the resulting credential to its own backend for
verification. The reader can already build each target and owns token
verification server-side; this recipe covers credential acquisition only —
session storage and refresh stay app-owned.

## Requirements

- Render the provider's sign-in button and/or trigger the flow headlessly from one shared screen.
- Acquire a credential (`idToken`, optional `authorizationCode`, user identity) on iOS, Android, web, and macOS where the provider is available.
- Register the provider-specific prerequisites on each target (Apple entitlement / Services ID + return URL, Google client id / google-services).
- Handle user cancellation, errors, and targets where a provider cannot run.
- On AppKit, keep each Apple authorization attempt attached to its initiating window and retire its owned resources.

## Acceptance criteria

- AC1: The reader can place `AppleSignInButton`/`GoogleSignInButton` (or call `appleAuth.signIn()`/`googleAuth.signIn()`) and observe a `SignInResult` — `success` with `credential`, `cancelled`, or `error` — on each intended target.
- AC2: The reader can complete per-target registration: the `com.apple.developer.applesignin` entitlement and matching signing/profile on iOS/macOS, Services ID + return URL via `appleAuth.configure` on web, `GIDClientID`/`googleAuth.configure({ clientId })` for Google, Google hosted backend/adapters on macOS, and can state which steps no target needs.
- AC3: The reader can interpret the credential shape (`provider`, `idToken`, `authorizationCode`, `accessToken`, `scopes`, `user`) and knows verification happens server-side.
- AC4: The reader can reproduce a user cancel and an unsupported target (`supported: false` — Apple on Android; an unconfigured Google hosted adapter on macOS returns `error`) and choose `authSession` as the hosted-ceremony alternative.

- AC5: On AppKit, capture scopes/nonce before native provider work, retain an eligible initiating visible key/main window without an attached sheet and exclude arbitrary first-window fallback. Anchor/result callbacks require owned native controller and delegate/provider identity, allowing equivalent native wrappers. Stale/foreign results do not begin credential decoding; conversion reentry cannot settle a retired attempt.
- AC6: On AppKit, acquire main-queue window-close/app-termination observers before native setup. Cleanup retires JS ownership, removes acquired observers and clears owned controller delegate/provider references before optional native cancel. Teardown settles cancelled once; failed setup/perform cancels acquired controllers; late callbacks cannot release a replacement.
- AC7: On AppKit, cache native delegate/anchor registrations independently so partial registration retries. Guard synchronous observation/class/provider/request/option/anchor/allocation/controller/delegate reentry before performRequests. Document no-callback pending state, screen/hide versus window teardown, unavailable pre-macOS-13 cancel and cancellation/removal failures without promising UI dismissal.
- AC8: On AppKit, maintain eleven Apple model cases (eight new), retain Google coverage and an idle official-button fixture. Reconcile guide/README/skill/fix note and defer native callback/identity/thread/consent/window/credential-state/nonce, entitlement/profile/signing, backend verification, AX and consumer qualification. State exact qualification commands and preserve issue evidence gates.

## Documentation

- AC1: [Provider SDK sign-in](../../../docs/platform/platform-services.md#provider-sdk-sign-in-apple--google), [macOS provider setup](../../../docs/platform/platform-services.md#macos-provider-sign-in), and the `AuthDemo` screen in `@octane-xplat/demos`. Gap: the demo cannot complete a real sign-in without provider registration, Apple signing/profile, and configured Google hosted endpoints — it exercises the error path only.
- AC2: [Provider SDK sign-in](../../../docs/platform/platform-services.md#provider-sdk-sign-in-apple--google) and [macOS setup/hosted adapter](../../../docs/platform/platform-services.md#macos-provider-sign-in). Gap: per-provider portal steps (Services ID creation, Google Cloud client setup) are summarized, not walked through.
- AC3: [Provider SDK sign-in](../../../docs/platform/platform-services.md#provider-sdk-sign-in-apple--google) and `@octane-xplat/auth` type declarations (`AuthCredential`, `SignInResult`). [Server exchange boundary](../../../examples/auth/README.md). Gap: the example requires a configured cryptographic verifier, attempt store, and session issuer; no real provider verification has run.
- AC4: [Provider SDK sign-in](../../../docs/platform/platform-services.md#provider-sdk-sign-in-apple--google) covers `cancelled`/`error`/`supported` and links the hosted `authSession` alternative in [Passkeys and auth ceremonies](../../../docs/platform/platform-services.md#passkeys-and-auth-ceremonies). Runtime verification: configured OS-sheet/browser cancel reproduction remains unverified; isolated AppKit action/delegate dispatch and mocked lifecycle regressions are narrower evidence, separately from documentation coverage.

- AC5: [Apple guide](../../../docs/packages/package-auth.md#keep-apple-sign-in-with-its-initiating-window), [provider setup](../../../docs/platform/platform-services.md#macos-provider-sign-in), Octane services reference, fix note, [model cases](../../../packages/auth/tests/macos.test.mts) and [target note](../exploration.md#operational-evidence).
- AC6: The same [Apple guide](../../../docs/packages/package-auth.md#keep-apple-sign-in-with-its-initiating-window) and [model cases](../../../packages/auth/tests/macos.test.mts) cover observer acquisition and cleanup ordering; [target note](../exploration.md#operational-evidence) records deferred checks.
- AC7: The same [Apple guide](../../../docs/packages/package-auth.md#keep-apple-sign-in-with-its-initiating-window) and [model cases](../../../packages/auth/tests/macos.test.mts) cover registration caching and reentry guards.
- AC8: The same [Apple guide](../../../docs/packages/package-auth.md#keep-apple-sign-in-with-its-initiating-window), [model cases](../../../packages/auth/tests/macos.test.mts), [official-button fixture](../../../examples/probes/apple-auth.macos.tsrx) and [target note](../exploration.md#operational-evidence). The fixture displays status only; mounting controls does not qualify consent, entitlements or a credential exchange.

For an alternative that runs Google or Apple on a hosted page rather than
through these SDK buttons, use the [native sign-in walkthrough](../../../docs/app/authentication.md).
Its Auth0 registration does not replace the direct SDK requirements above.

Historical Silo assessments for `appkit-apple-auth-ownership` AC1–AC4 map to `provider-sign-in` AC5–AC8. They remain evidence for their reviewed revisions, not a pass for this revision.
