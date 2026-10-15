# `@octane-xplat/biometrics`

```sh
pnpm add @octane-xplat/biometrics
```

Local biometric verification — Face ID / Touch ID / fingerprint or device
credential — behind one capability object. iOS and Android run
`@nativescript/biometrics`; macOS AppKit uses Apple LocalAuthentication
for Touch ID. Web reports `supported: false` because WebAuthn requires
a registered credential and an authentication ceremony.

```ts
import { biometrics } from '@octane-xplat/biometrics'

if ((await biometrics.ensure()) === 'granted') {
	const ok = await biometrics.impl!.verify('Unlock your saved trips')
}
```

The shared capability contract: `supported` reports whether an
implementation exists on this target — branch on it rather than catching —
`ensure()` resolves `'granted' | 'denied' | 'unsupported'`, and `impl` is
the service once usable. `verify(reason)` resolves `false` for a declined
or failed prompt rather than throwing.

On macOS, availability checks do not open a prompt. Missing hardware,
enrollment, pairing, or a connected sensor returns `unsupported`; lockout
or an interaction restriction returns `denied`. A host without the Objective-C
LocalAuthentication bridge reports `supported: false` and `impl: null`.
Verification uses biometrics only, hides password fallback, and returns
`false` on cancellation, failure, or an overlapping prompt.

```ts
import { biometrics } from '@octane-xplat/biometrics'

const availability = await biometrics.ensure()
if (availability === 'granted') {
	const verified = await biometrics.impl!.verify('Unlock your saved trips')
	console.log(verified ? 'Unlocked' : 'Still locked')
}
```

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
