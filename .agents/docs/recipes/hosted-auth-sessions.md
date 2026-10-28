# Restore and retire a hosted native session

ID: hosted-auth-sessions
Targets: ios, android, macos
Related APIs: createHostedAuth, HostedAuth.signOut, HostedAuth.restore, authSession, secureStorage

## Starting point

An app-owned hosted sign-in flow with attempt/exchange/refresh/revoke endpoints,
a registered callback scheme, and secure credential storage.

## Requirements

Keep credentials and requests isolated across session changes. Distinguish
retired in-memory credentials from successful durable deletion.

## Acceptance criteria

- AC1: A hosted sign-in completes or cancels and can restore credentials after restart without bypassing state/PKCE validation.
- AC2: Sign-out retires pending login/refresh/API replay and serializes deletion after earlier saves.
- AC3: A failed or false credential deletion rejects with a sanitized error, still attempts revocation, and permits a subsequent deletion retry.

## Documentation

- AC1: [Hosted sign-in ceremonies](../../../packages/auth/README.md#hosted-sign-in-ceremonies). Gap: packaged real-provider and OS callback delivery qualification remains pending.
- AC2: [Hosted sign-in ceremonies](../../../packages/auth/README.md#hosted-sign-in-ceremonies) and [hosted-client regressions](../../../packages/auth/tests/hosted.test.mjs).
- AC3: [Hosted sign-in ceremonies](../../../packages/auth/README.md#hosted-sign-in-ceremonies) and [deletion-failure regressions](../../../packages/auth/tests/hosted.test.mjs).

The [packed listening/settings check](../../../tools/native-readiness/README.md)
combines these services in an external mobile consumer. Its synthetic auth and
silent foreground media do not close physical background, output, restart,
or provider callback gates; see the [readiness record](../notes/still-native-readiness.md).
