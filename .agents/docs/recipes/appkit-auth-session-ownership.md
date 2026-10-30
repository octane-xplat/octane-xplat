# Keep AppKit authentication attached to its initiating window

ID: appkit-auth-session-ownership
Targets: macos
Related APIs: authSession, AuthSessionOptions, AuthSessionResult

## Starting point

HostedAuth and the native Google hosted adapter use the system-browser auth
transport. The existing AppKit provider queried the current window repeatedly,
retained an attempt without observing presenter close and read mutable callback
options. These findings are source inspection, not observed sign-in failures.

## Acceptance criteria

- AC1: Snapshot callback scheme/ephemeral preference before native reentry; retain the eligible initiating key/main window, reject invisible/attached-sheet/arbitrary first-window fallbacks and return that anchor only to the owning native session (including equivalent wrappers).
- AC2: Register main-queue close/termination observers before constructing the session. Presenter/app teardown retires JS ownership, removes acquired observers, clears owned provider references, asks native cancel and settles once. Late callbacks cannot decode stale URLs, release or cancel a replacement. Setup/start errors retire and cancel acquired native state.
- AC3: Handle partial/synchronous observer registration, synchronous construction/completion, native setter/start reentry, cancellation throws and observer removal failures without restarting retired work or fabricating a timeout. Document that removal failure can retain a native observer, and screen unmount/hiding alone does not cancel UI.
- AC4: Maintain eleven model cases and an idle example.com cancellation fixture. Reconcile the guide/skill/fix note and preserve backend destination/state/PKCE/nonce/credential verification duties. Record exact deferred checks and distinguish source/syntax/model code from OS browser/consent/callback/thread/window/AX/security/consumer qualification.

## Documentation

- AC1–AC4: [Public guide](../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership), Octane services reference, fix note and [target note](../exploration.md#operational-evidence).
- AC1–AC4: [Model cases](../../../packages/platform/tests/auth-session.macos.test.mjs) and [manual cancellation fixture](../../../examples/probes/auth-session.macos.tsrx). example.com is not a real authentication provider.
