# Restore and retire a hosted native session

ID: hosted-auth-sessions
Targets: ios, android, macos
Related APIs: createHostedAuth, HostedAuth.signOut, HostedAuth.restore, authSession, AuthSessionOptions, AuthSessionResult, secureStorage

## Starting point

A running app and a hosted identity provider. The guide supplies one concrete
provider adapter and token-verifying API; the application owns their deployment,
provider registration and account state.

## Requirements

Keep credentials and requests isolated across session changes. Distinguish
retired in-memory credentials from successful durable deletion.

- On AppKit, keep each hosted session attached to its initiating window and retire it on presenter teardown or failure.

## Acceptance criteria

- AC1: A hosted sign-in completes or cancels and can restore credentials after restart without bypassing state/PKCE validation.
- AC2: Sign-out retires pending login/refresh/API replay and serializes deletion after earlier saves.
- AC3: A failed or false credential deletion rejects with a sanitized error, still attempts revocation, and permits a subsequent deletion retry.

- AC4: On AppKit, snapshot callback scheme/ephemeral preference before native reentry; retain the eligible initiating key/main window, reject invisible/attached-sheet/arbitrary first-window fallbacks and return that anchor only to the owning native session (including equivalent wrappers).
- AC5: On AppKit, register main-queue close/termination observers before constructing the session. Presenter/app teardown retires JS ownership, removes acquired observers, clears owned provider references, asks native cancel and settles once. Late callbacks cannot decode stale URLs, release or cancel a replacement. Setup/start errors retire and cancel acquired native state.
- AC6: On AppKit, handle partial/synchronous observer registration, synchronous construction/completion, native setter/start reentry, cancellation throws and observer removal failures without restarting retired work or fabricating a timeout. Document that removal failure can retain a native observer, and screen unmount/hiding alone does not cancel UI.
- AC7: On AppKit, maintain eleven model cases and an idle example.com cancellation fixture. Reconcile the guide/skill/fix note and preserve backend destination/state/PKCE/nonce/credential verification duties. Record exact deferred checks and distinguish source/syntax/model code from OS browser/consent/callback/thread/window/AX/security/consumer qualification.

## Documentation

- AC1: [Sign-in walkthrough](../../../docs/app/authentication.md), [Auth0 adapter](../../../examples/auth/auth0-flow.ts), and [token-verifying API](../../../examples/auth/server/api.ts) cover iOS/Android setup and the first verified account. Gap: experimental macOS host setup still requires separate composition. Packaged real-provider/OS callback execution is unqualified.
- AC2: [Restore, refresh and sign out](../../../docs/app/authentication.md#restore-refresh-and-sign-out), [account-state controller](../../../examples/auth/session.ts), [account races](../../../tools/auth-guide/src/session.test.mts), [Hosted sign-in ceremonies](../../../docs/packages/package-auth.md#hosted-sign-in-ceremonies) and [hosted-client regressions](../../../packages/auth/tests/hosted.test.mts).
- AC3: [Restore, refresh and sign out](../../../docs/app/authentication.md#restore-refresh-and-sign-out), [account-state controller](../../../examples/auth/session.ts), [Hosted sign-in ceremonies](../../../docs/packages/package-auth.md#hosted-sign-in-ceremonies) and [deletion-failure regressions](../../../packages/auth/tests/hosted.test.mts).

- AC4: [Public guide](../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership), Octane services reference, fix note, [model cases](../../../packages/platform/tests/auth-session.macos.test.mts) and [target note](../exploration.md#operational-evidence).
- AC5: The same [public guide](../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership) and [model cases](../../../packages/platform/tests/auth-session.macos.test.mts) cover observer registration and owned teardown.
- AC6: The same [public guide](../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership) and [model cases](../../../packages/platform/tests/auth-session.macos.test.mts) cover partial registration, reentry and removal-failure limits.
- AC7: The same [public guide](../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership), [model cases](../../../packages/platform/tests/auth-session.macos.test.mts), [manual cancellation fixture](../../../examples/probes/auth-session.macos.tsrx) and [target note](../exploration.md#operational-evidence). example.com is not a real authentication provider.

The [packed listening/settings check](../../../tools/native-readiness/README.md)
combines these services in an external mobile consumer. Its synthetic auth and
silent foreground media do not close physical background, output, restart,
or provider callback gates; see the [readiness record](../notes/still-native-readiness.md).

Historical Silo assessments for `appkit-auth-session-ownership` AC1–AC4 map to `hosted-auth-sessions` AC4–AC7. They remain evidence for their reviewed revisions, not a pass for this revision.
