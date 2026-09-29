# Using device features

> Save the user's work, attach a photo, share content, or open a link. Check
> capability and permission results so the app stays useful on each platform.

## Choose a useful feature

Give your agent an outcome with a fallback: “Let me attach a photo to a trip
item; explain when capture is unavailable.” Use the shared `media` service
for still capture; a live [camera preview](primitives.md#when-a-screen-needs-more) is a
separate component and setup.

Label the result by platform when demonstrating it: **iOS/Android** use the
OS camera flow; **web on a phone** may offer capture; **desktop web** may
open a file picker instead. Cancellation and denied access need their own UI
response. macOS and Windows are not implied by an iOS/Android implementation:
consult the [target guide](spec.md#choose-your-targets) and
[known limits](known-limits.md).

The capability table below describes web and iOS/Android unless stated
otherwise. Keep native details in a service or platform-specific file so
shared screens can keep using the same interface.

## The shared service shape

Services have the same name on every platform. For example, a screen can use
storage without knowing whether the value lives in browser storage or a native
database:

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('has-seen-welcome', 'true')
const seen = storage.getString('has-seen-welcome')
```

Other services cover permissions, clipboard, sharing, haptics, files, media
picking, notifications, safe-area insets, screen size, and app lifecycle.

## Capability map

| Service | Shared shape | Platform notes |
| --- | --- | --- |
| `geolocation` | `getCurrentPosition(options)` | native needs `@nativescript/geolocation` in the app's dependencies |
| `connectivity` | `getState()` + `subscribe(listener)` | web also exposes connection type where `navigator.connection` exists |
| `appInfo` | `{ supported, version, build, bundleId }` | `supported: false` on web — a browser bundle has no trustworthy app identity |
| `openUrl(url)` | returns whether an outbound link was opened | — |
| `openSettings` | capability; `open()` | unsupported on web |
| `media.pickImage()`, `pickImages()` | pick existing image(s) | native needs `@nativescript/imagepicker` |
| `media.capturePhoto()` | still capture through the OS camera UI | web uses `<input type="file" capture>` — a real camera flow on phones, a file-picker fallback on desktops; native needs `@nativescript/camera` |
| `webAuthn` | `isAvailable()`, `create(options)`, `get(options)` — raw WebAuthn over the RP's JSON options | web only; native reports `supported: false` — use `authSession` |
| `authSession` | `open(url, { callbackScheme })` — hosted web ceremony in a system browser | native only; iOS ASWebAuthenticationSession, Android Custom Tab + deep-link return |

`media` owns the `camera` and `photos` permission requests for still capture
and image picking. Live-preview permission belongs to `@octane-xplat/camera`,
which requests it when `CameraView` starts. `permissions.ensure(kind)`
delegates to the owning service for notifications, media, and location rather
than maintaining a second set of probes. On web, `ensure('camera')` reads the
permission without ever opening a prompt — a state that would require asking
the user reports `unsupported`, and `denied` stays `denied`; starting
`CameraView` instead uses `getUserMedia` to request access for the preview.

`files.writeText(name, text)` writes a file on native. On web, it starts a
browser download with the requested name and returns a `FileRef` for the
download's object URL; it does not write to a local filesystem path.

Camera capture is stills-only — no maintained NativeScript video-capture
plugin exists, so the contract has no `captureVideo`.
`width`/`height`/`keepAspectRatio`/`saveToGallery` are native-only
`capturePhoto` options. Apps calling `capturePhoto` must set
`NSCameraUsageDescription` — plus `NSPhotoLibraryAddUsageDescription` when
using `saveToGallery` — in their iOS `Info.plist`.

## Passkeys and auth ceremonies

Two services cover sign-in (decision #66). On web, `webAuthn` runs the
WebAuthn ceremony in-page: pass the relying party's JSON options
(better-auth/SimpleWebAuthn shape, base64url fields) to `create()` or `get()`
and post the returned JSON credential back. On native, `webAuthn` is
unsupported — a raw platform-authenticator ceremony would require the RP to
host apple-app-site-association/assetlinks.json, so instead `authSession`
runs the whole flow on the app's real HTTPS origin inside a system browser:

```ts
if (webAuthn.supported) {
	const credential = await webAuthn.impl?.get(options)
	// post credential to the RP's verify endpoint
} else if (authSession.supported) {
	const result = await authSession.impl?.open(signInUrl, { callbackScheme: 'myapp' })
	if (result?.type === 'success') {
		// result.url carries the session token back from the hosted page
	}
}
```

`authSession` needs no iOS configuration — the session intercepts
`callbackScheme` itself. On Android the app must declare the scheme's
intent-filter on its main activity, the same registration any incoming deep
link uses; `androidx.browser` (Custom Tabs) arrives transitively with
`@octane-xplat/platform`, no app-side declaration. `prefersEphemeralSession`
keeps the iOS session from sharing Safari cookies.

A NativeScript plugin must be declared by the app that ships it, not only by
`@octane-xplat/platform` — a transitive dependency is not enough. Run
`pnpm xplat doctor` from the app root for warning-only checks on missing
declarations. `connectivity` comes from `@nativescript/core` and needs no
plugin.

## Optional capabilities

Some features are not available everywhere. Check support and ask for access
before using the implementation:

```ts
import { permissions } from '@octane-xplat/platform'

const result = await permissions.ensure('camera')
if (result === 'granted') console.log('start camera')
else console.log('camera unavailable')
```

Your screen should show a useful fallback when a capability is unavailable or
the user declines it.

## Interface shapes

The shared contracts are deliberately small and platform-neutral — each
service is a `Capability`-style object whose exact signature lives in the
`@octane-xplat/platform` type declarations (`GeolocationImpl`,
`ConnectivityImpl`, `MediaImpl`, and friends). For example,
`connectivity.getState()` returns `{ online, type }` where `type` is
`'none' | 'wifi' | 'mobile' | 'ethernet' | 'bluetooth' | 'vpn' | 'unknown'`.

## Keep platform code at the edge

Do not import `navigator`, `document`, NativeScript classes, or OS-specific
plugins into a shared screen. If the service does not exist yet, add its
shared contract and web/native leaves rather than adding a one-off conditional.

See the [platform notes](platform-notes.md) for the complete capability map,
accessibility mapping, and native typing details.
