# `@octane-xplat/geolocation`

```sh
pnpm add @octane-xplat/geolocation
```

Device geolocation behind one capability object. iOS and Android run
`@nativescript/geolocation`; web uses `navigator.geolocation`; the macOS
AppKit target uses Core Location through a package-owned native facade. Hosts
without that facade or location purpose strings report `supported: false`.

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

Guide: [Using device features](../../docs/platform/platform-services.md)
per-target availability: [platform notes](../../docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).

## macOS host setup

The existing Xplat native build discovers this package's `platforms/macos`
sources and links CoreLocation. Add both purpose strings to the application
Info.plist before requesting permission. An unsigned command-line host without
an application bundle remains unsupported.

```xml
<key>NSLocationUsageDescription</key>
<string>Show places near your current location.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show places near your current location while you use the app.</string>
```

Sandboxed applications also need the location entitlement in their signing
entitlements file. The application owns its purpose text and signing settings.

```xml
<key>com.apple.security.personal-information.location</key>
<true/>
```

Location denial or disabled system Location Services returns `denied`. A
permission request with no decision after 30 seconds returns `unsupported`
and can be retried. Position failures reject with code 1 (denied), 2
(unavailable), or 3 (timeout). Times are milliseconds; omitted timeout waits
without a deadline, and omitted maximumAge requires a fresh fix.

```ts
import { geolocation } from '@octane-xplat/geolocation'

if ((await geolocation.ensure()) === 'granted') {
  try {
    const position = await geolocation.impl!.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })
    console.log(position.latitude, position.longitude)
  } catch (error) {
    console.log('Location failed', (error as { code?: number }).code)
  }
}
```

Automated coverage checks native delegate cleanup and the service adapter.
Real AppKit permission prompts, signed/sandboxed delivery, and physical location
accuracy still require the manual test plan in the implementation commit.
