# `@octane-xplat/geolocation`

Device geolocation behind one capability object. iOS and Android run
`@nativescript/geolocation`; web uses `navigator.geolocation`; the macOS
AppKit dev host reports `supported: false` (no CoreLocation bridge).

```sh
pnpm add @octane-xplat/geolocation
```

```ts
import { geolocation } from '@octane-xplat/geolocation'

if ((await geolocation.ensure()) === 'granted') {
	const pos = await geolocation.impl!.getCurrentPosition()
	// { latitude, longitude, accuracy, altitude, heading, speed, timestamp }
}
```

The shared capability contract: `supported` reports whether an
implementation exists on this target, `ensure()` resolves
`'granted' | 'denied' | 'unsupported'` (it prompts where the platform
defers the prompt), and `impl` is the service once usable. Nullable
`altitude`/`heading`/`speed` mean the platform did not report them.

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
