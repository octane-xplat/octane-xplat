# Keep native Apple sign-in with its initiating AppKit window

ID: appkit-apple-auth-ownership
Targets: macos
Related APIs: appleAuth, AppleSignInButton, AppleSignInOptions, SignInResult

## Starting point

AuthDemo exposes the official native Apple button. Apple authorization uses a
separate controller from authSession; its old anchor queried the current
key/main/first window and had no presenter close cleanup. A partial native
class-registration failure also prevented later retries. Source inspection
found these paths; no OS sign-in or credential failure was observed.

## Acceptance criteria

- AC1: Capture scopes/nonce before native provider work, retain an eligible initiating visible key/main window without an attached sheet and exclude arbitrary first-window fallback. Anchor/result callbacks require owned native controller and delegate/provider identity, allowing equivalent native wrappers. Stale/foreign results do not begin credential decoding; conversion reentry cannot settle a retired attempt.
- AC2: Acquire main-queue window-close/app-termination observers before native setup. Cleanup retires JS ownership, removes acquired observers and clears owned controller delegate/provider references before optional native cancel. Teardown settles cancelled once; failed setup/perform cancels acquired controllers; late callbacks cannot release a replacement.
- AC3: Cache native delegate/anchor registrations independently so partial registration retries. Guard synchronous observation/class/provider/request/option/anchor/allocation/controller/delegate reentry before performRequests. Document no-callback pending state, screen/hide versus window teardown, unavailable pre-macOS-13 cancel and cancellation/removal failures without promising UI dismissal.
- AC4: Maintain eleven Apple model cases (eight new), retain Google coverage and an idle official-button fixture, all unrun. Reconcile guide/README/skill/fix note and defer native callback/identity/thread/consent/window/credential-state/nonce, entitlement/profile/signing, backend verification, AX and consumer qualification. State exact unrun commands and preserve issue evidence gates.

## Documentation

- AC1–AC4: [Apple guide](../../../packages/auth/README.md#keep-apple-sign-in-with-its-initiating-window), [provider setup](../../../docs/platform/platform-services.md#macos-provider-sign-in), Octane services reference, fix note and [target note](../parity/appkit-progress.md#appkit-apple-authorization-presenter-ownership).
- AC1–AC4: [Model cases](../../../packages/auth/tests/macos.test.mjs), authored but unrun, and [official-button fixture](../../../examples/probes/apple-auth.macos.tsrx). The fixture displays status only; mounting controls does not qualify consent, entitlements or a credential exchange.
