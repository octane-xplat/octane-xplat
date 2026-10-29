# Restore and retire a hosted native session

ID: hosted-auth-sessions
Targets: ios, android, macos
Related APIs: createHostedAuth, HostedAuth.signOut, HostedAuth.restore, authSession, secureStorage

## Starting point

A running app and a hosted identity provider. The guide supplies one concrete
provider adapter and token-verifying API; the application owns their deployment,
provider registration and account state.

## Requirements

Keep credentials and requests isolated across session changes. Distinguish
retired in-memory credentials from successful durable deletion.

## Acceptance criteria

- AC1: A hosted sign-in completes or cancels and can restore credentials after restart without bypassing state/PKCE validation.
- AC2: Sign-out retires pending login/refresh/API replay and serializes deletion after earlier saves.
- AC3: A failed or false credential deletion rejects with a sanitized error, still attempts revocation, and permits a subsequent deletion retry.

## Documentation

- AC1: [Sign-in walkthrough](../../../docs/app/authentication.md), [Auth0 adapter](../../../packages/auth/examples/auth0-flow.ts), and [token-verifying API](../../../tools/auth-guide/src/api.ts) cover iOS/Android setup and the first verified account. Gap: experimental macOS host setup still requires separate composition. Packaged real-provider/OS callback execution is unqualified.
- AC2: [Restore, refresh and sign out](../../../docs/app/authentication.md#restore-refresh-and-sign-out), [account-state controller](../../../packages/demos/src/auth-guide/session.ts), [account races](../../../tools/auth-guide/src/session.test.mjs), [Hosted sign-in ceremonies](../../../packages/auth/README.md#hosted-sign-in-ceremonies) and [hosted-client regressions](../../../packages/auth/tests/hosted.test.mjs).
- AC3: [Restore, refresh and sign out](../../../docs/app/authentication.md#restore-refresh-and-sign-out), [account-state controller](../../../packages/demos/src/auth-guide/session.ts), [Hosted sign-in ceremonies](../../../packages/auth/README.md#hosted-sign-in-ceremonies) and [deletion-failure regressions](../../../packages/auth/tests/hosted.test.mjs).

The [packed listening/settings check](../../../tools/native-readiness/README.md)
combines these services in an external mobile consumer. Its synthetic auth and
silent foreground media do not close physical background, output, restart,
or provider callback gates; see the [readiness record](../notes/still-native-readiness.md).
