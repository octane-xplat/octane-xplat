# `@octane-xplat/biometrics`

Local biometric verification — Face ID / Touch ID / fingerprint or device
credential — behind one capability object. iOS and Android run
`@nativescript/biometrics`; macOS AppKit uses Apple LocalAuthentication
for Touch ID. Web reports `supported: false` because WebAuthn requires
a registered credential and an authentication ceremony.

```sh
bun add @octane-xplat/biometrics
```

```ts
import { biometrics } from '@octane-xplat/biometrics'

if ((await biometrics.requestPermissions()).granted) {
	const ok = await biometrics.verify('Unlock your saved trips')
}
```

The shared service contract: `supported` reports whether an
implementation exists on this target — branch on it rather than catching —
`getPermissions()`/`requestPermissions()` resolve
`{status: 'granted' | 'denied' | 'unsupported', granted, canAskAgain}`.
`verify(reason)` resolves `false` for a declined
or failed prompt rather than throwing.

On macOS, availability checks do not open a prompt. Missing hardware,
enrollment, pairing, or a connected sensor returns `unsupported`; lockout
or an interaction restriction returns `denied`. A host without the Objective-C
LocalAuthentication bridge reports `supported: false` and `verify()` rejects
`UnavailabilityError`.
Verification uses biometrics only, hides password fallback, and returns
`false` on cancellation, failure, or an overlapping prompt.

```ts
import { biometrics } from '@octane-xplat/biometrics'

const availability = await biometrics.requestPermissions()
if (availability.granted) {
	const verified = await biometrics.verify('Unlock your saved trips')
	console.log(verified ? 'Unlocked' : 'Still locked')
}
```

Guide: [Using device features](https://octane-xplat.goddardai.org/platform-services);
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/Services.tsrx)).
