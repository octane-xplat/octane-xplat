# `@octane-xplat/biometrics`

```sh
pnpm add @octane-xplat/biometrics
```

Local biometric verification — Face ID / Touch ID / fingerprint or device
credential — behind one capability object. iOS and Android run
`@nativescript/biometrics`; web and the macOS AppKit host report
`supported: false` (WebAuthn is an authentication ceremony, not a
local-presence check, and the dev host has no LocalAuthentication bridge).

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

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
