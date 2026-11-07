# `@octane-xplat/geolocation`

> Device geolocation for Octane xplat — matching web + NativeScript implementations

Device geolocation behind one capability object. iOS and Android run
`@nativescript/geolocation`; web uses `navigator.geolocation`; the macOS
AppKit target uses Core Location through a package-owned native facade. Hosts
without that facade or location purpose strings report `supported: false`.

```sh
bun add @octane-xplat/geolocation
```

```ts
import { geolocation } from '@octane-xplat/geolocation'

if ((await geolocation.requestPermissions()).granted) {
  const pos = await geolocation.getCurrentPosition()
  // { latitude, longitude, accuracy, altitude, heading, speed, timestamp }
}
```

The shared service contract: `supported` reports whether an
implementation exists on this target, `getPermissions()` reads the state
without prompting and `requestPermissions()` may prompt — both resolve
`{status: 'granted' | 'denied' | 'undetermined' | 'unsupported', granted,
canAskAgain}`. Method calls go directly on the service. Nullable
`altitude`/`heading`/`speed` mean the platform did not report them.

Position failures on every target reject with a numeric `code`: 1 (denied), 2
(unavailable), or 3 (timeout). iOS and Android keep the underlying plugin
error, including its message; an iOS permission revoked while a request is in
flight reports 2 rather than 1.

```ts
import { geolocation } from '@octane-xplat/geolocation'

if ((await geolocation.requestPermissions()).granted) {
  try {
    const position = await geolocation.getCurrentPosition()
    console.log(position.latitude, position.longitude)
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    if (code === 1) console.log('Location permission denied')
    else if (code === 3) console.log('Location timed out')
    else console.log('Location failed', code)
  }
}
```

Guide: [Using device features](https://octane-xplat.goddardai.org/platform-services)
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/Services.tsrx)).

[Generated API reference](https://octane-xplat.goddardai.org/api-geolocation).

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

if ((await geolocation.requestPermissions()).granted) {
  try {
    const position = await geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })
    console.log(position.latitude, position.longitude)
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    console.log('Location failed', code)
  }
}
```

Automated coverage checks native delegate cleanup and the service adapter.
Real AppKit permission prompts, signed/sandboxed delivery, and physical location
accuracy still require the manual test plan in the implementation commit.
