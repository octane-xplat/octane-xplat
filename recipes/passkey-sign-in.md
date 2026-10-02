# Sign in with a passkey or hosted auth ceremony

ID: passkey-sign-in
Targets: web, ios, android, macos
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
- Register the Android callback-scheme intent-filter (iOS/macOS need none).
- Handle cancellation, errors, and targets where neither capability applies.

## Acceptance criteria

- AC1: On web, the reader can pass the RP's JSON options to `webAuthn` and post the resulting credential JSON back to the verify endpoint.
- AC2: On iOS, Android, and macOS, the reader can open the sign-in URL with `authSession.open` and receive a `success` result carrying the callback URL.
- AC3: The reader can wire the Android callback scheme so the hosted page's redirect reaches the app, and can state why iOS/macOS need no URL-type registration.
- AC4: The reader can reproduce a user-dismissed session and an unsupported target, and observe the documented `cancel`/`supported: false` fallbacks.

## Documentation

- AC1: [Passkeys and auth ceremonies](../docs/platform-services.md#passkeys-and-auth-ceremonies). Gap: The fragment omits a complete server verification exchange and error-handling example.
- AC2: [Passkeys and auth ceremonies](../docs/platform-services.md#passkeys-and-auth-ceremonies). Gap: The hosted page callback/session exchange remains app-owned and has a [maintained exchange boundary](../examples/auth/README.md), but app-owned code redemption and attempt storage are not implemented here.
- AC3: [authSession platform notes](../docs/platform-services.md#passkeys-and-auth-ceremonies) and [scheme registration](incoming-links.md). [Hosted callback registration and checks](../docs/platform-services.md#register-and-check-a-hosted-callback) provide the activity filter and callback/cancel/error procedure.
- AC4: [Capability shape and fallbacks](../docs/platform-services.md#optional-capabilities). [Hosted callback checks](../docs/platform-services.md#register-and-check-a-hosted-callback) and [adapter regressions](../packages/platform/tests/auth-session.test.mjs) and [macOS lifecycle regressions](../packages/platform/tests/auth-session.macos.test.mjs). Runtime verification: configured system-browser and relying-party checks remain pending; this is separate from documentation coverage.
