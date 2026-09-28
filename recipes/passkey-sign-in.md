# Sign in with a passkey or hosted auth ceremony

ID: passkey-sign-in
Targets: web, ios, android
Related APIs: webAuthn, authSession, onDeepLink

## Starting point

An app with a backend that speaks WebAuthn against an HTTPS origin (the
relying party — e.g. a better-auth or SimpleWebAuthn server on a Worker
domain) and a sign-in screen shared across targets. The reader can already
build each target.

## Requirements

- Run a WebAuthn create/get ceremony on web with the RP's JSON options and
  return the credential to the server.
- Run the same ceremony on native through a hosted browser session on the
  RP's real origin, receiving the callback URL with its session payload.
- Register the Android callback-scheme intent-filter (iOS needs none).
- Handle cancellation, errors, and targets where neither capability applies.

## Acceptance criteria

- AC1: On web, the reader can pass the RP's JSON options to `webAuthn` and post the resulting credential JSON back to the verify endpoint.
- AC2: On iOS and Android, the reader can open the sign-in URL with `authSession.open` and receive a `success` result carrying the callback URL.
- AC3: The reader can wire the Android callback scheme so the hosted page's redirect reaches the app, and can state why iOS needs no registration.
- AC4: The reader can reproduce a user-dismissed session and an unsupported target, and observe the documented `cancel`/`supported: false` fallbacks.

## Documentation

- AC1: [Passkeys and auth ceremonies](../docs/platform-services.md#passkeys-and-auth-ceremonies).
- AC2: [Passkeys and auth ceremonies](../docs/platform-services.md#passkeys-and-auth-ceremonies).
- AC3: [authSession platform notes](../docs/platform-services.md#passkeys-and-auth-ceremonies) and [scheme registration](incoming-links.md).
- AC4: [Capability shape and fallbacks](../docs/platform-services.md#optional-capabilities). Gap: cancel/error paths are desk-verified only — on-device sweep pending (queued experiment).
