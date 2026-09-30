# Using device features

> Save the user's work, attach a photo, share content, or open a link. Check
> capability and permission results so the app stays useful on each platform.

## Choose a useful feature

Give your agent an outcome with a fallback: “Let me attach a photo to a trip
item; explain when capture is unavailable.” Use the shared `media` service
for still capture; a live [camera preview](primitives.md#when-a-screen-needs-more) is a
separate component and setup.

Check the interaction on each intended target. **iOS/Android** use the OS
camera flow; **web on a phone** may offer capture; **desktop web** may open a
file picker instead. After a successful selection, the trip item should show
its photo. Cancel the picker and check that the item stays unchanged. Deny
access and check that the item remains usable with an explanation of why no
photo was attached. These are checks for the feature you build, not behavior
that a service adds to your screen automatically.

macOS and Windows are not implied by an iOS/Android implementation:
consult the [target guide](spec.md#choose-your-targets) and
[known limits](known-limits.md). Sharing is available on macOS through the
AppKit share picker.

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
const seen = storage.getString('has-seen-welcome') // "true"
```

Other services cover permissions, clipboard, haptics, files, media
picking, notifications, safe-area insets, screen size, and app lifecycle.
Sharing lives in the `@octane-xplat/share` leaf package (`share.text`,
`share.url`), not in `platform` — plugin-backed services ship as leaves
(#72).

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
| `authSession` | `open(url, { callbackScheme })` — hosted web ceremony in a system browser | iOS/macOS ASWebAuthenticationSession, Android Custom Tab + deep-link return; unsupported on web |
| `@octane-xplat/sqlite` | `openDatabase(name)` → async `execute`/`select`/`get`/`transaction`/`userVersion` | own leaf, not a platform service; web persists via an OPFS worker, macOS binds system libsqlite3 through host metadata interop (`db.persistent` reports); Windows `supported: false` |

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

## Share text and URLs

Use the shared `share` service to offer text or a link to the system's sharing
options:

```ts
import { share } from '@octane-xplat/platform'

const textResult = await share.text('A note to share')
const linkResult = await share.url('https://example.com', 'Example')
```

On iOS, Android, and macOS, these calls open the native share picker. On web,
they use the Web Share API when available and copy the content when the browser
offers clipboard access. Check the result: `shared` means the share flow was
opened or completed by the target, `copied` means the fallback copied the
content, and `unavailable` means neither option could be offered. The service
does not report whether a recipient ultimately received the content.

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

This fragment assumes your backend provides `options` and `signInUrl`;
credential verification and callback validation remain app responsibilities.

```ts
import { webAuthn, authSession } from '@octane-xplat/platform'

if (webAuthn.supported) {
	const credential = await webAuthn.impl?.get(options)
	// post credential to the RP's verify endpoint
} else if (authSession.supported) {
	const result = await authSession.impl?.open(signInUrl, { callbackScheme: 'myapp' })
	if (result?.type === 'success') {
		// Validate the callback and finish the app-owned sign-in exchange.
	}
}
```

Handle `type: 'cancel'` by leaving the user signed out, and `type: 'error'`
by displaying its `message` with a retry action. Web credential operations can
reject; catch the rejection and keep sign-in available. If neither capability
is supported, show an unavailable state or your app's alternative sign-in
method. Closing a native session should exercise the cancel path; target
runtime verification remains pending.

`authSession` needs no iOS configuration — the session intercepts
`callbackScheme` itself. On Android the app must declare the scheme's
intent-filter on its main activity, the same registration any incoming deep
link uses; `androidx.browser` (Custom Tabs) arrives transitively with
`@octane-xplat/platform`, no app-side declaration. `prefersEphemeralSession`
keeps the iOS session from sharing Safari cookies.

### Provider SDK sign-in (Apple / Google)

`@octane-xplat/auth` is the provider-SDK path — the native Sign in with
Apple and Google Sign-In SDKs on iOS/Android, their platform web SDKs in the
browser, one shared surface. It is an alternative to the hosted `authSession`
ceremony, not a replacement: use it when the app wants the platform-authentic
button + credential, not a web session on its own origin.

```ts
import { appleAuth, googleAuth, AppleSignInButton, GoogleSignInButton } from '@octane-xplat/auth'

googleAuth.configure({ clientId: '…apps.googleusercontent.com' })
const result = await appleAuth.signIn({ scopes: ['email', 'name'], nonce })
if (result.status === 'success') {
	// result.credential = { idToken, authorizationCode?, user: { id, email?, name? } }
	// hand it to your backend — verification stays app-side
}
```

Every `signIn` resolves a `SignInResult` — `success` carries the credential,
`cancelled` covers a dismissed sheet/popup, `error` reports the message.
Session storage and token refresh are deliberately out of scope.

Per-target setup differs because the providers do:

- **iOS** — Apple needs the `com.apple.developer.applesignin` entitlement
  (and iOS 13+; `appleAuth.supported` reports it, false on Android).
  Google reads `GIDClientID` from Info.plist or `configure({ clientId })`.
- **Android** — Apple reports `supported: false`; Google resolves its
  client from google-services resources or `configure`.
- **Web** — `appleAuth.configure({ clientId, redirectURI })` with the
  Services ID + registered return URL, and `googleAuth.configure({ clientId })`
  with the OAuth web client id. Both SDKs load lazily on first use; the
  Apple flow runs in a popup by default (`usePopup: false` for redirect),
  Google's `signIn` uses One Tap while `GoogleSignInButton` renders the
  official GIS button.
- **macOS** — `appleAuth` runs the same AuthenticationServices flow natively
  on the AppKit host (the packaged app needs
  `com.apple.developer.applesignin` in `entitlements.plist`).
  `googleAuth` reports `supported: false` — run the hosted `authSession`
  ceremony (itself implemented on macOS over ASWebAuthenticationSession).

`appleAuth.getCredentialState(userId)` answers whether a previously-granted
Apple credential is still `authorized` — iOS and macOS, `'unknown'` elsewhere.
`googleAuth.signOut()` clears the account selection so the next sign-in
re-prompts. The plugins (`@nativescript/apple-sign-in`,
`@nativescript/google-signin`) are real dependencies of the leaf — apps don't
declare them (decision #51).

Declare the optional NativeScript plugin peers used by platform services
in the app’s dependencies. This differs from leaf-owned implementation
dependencies such as the video plugin, which travel with their leaf package. Run
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

## Local database

Structured persistence lives in its own leaf rather than the platform
package — `@octane-xplat/sqlite` is the same async API on web and native:

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

const db = await openDatabase('app.db')
await db.execute('CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)')
const rows = await db.select<{ id: number; name: string }>('SELECT * FROM items')
await db.transaction(async (db) => {
	// a throw here rolls back every write made inside it
})
```

Check `db.persistent` after open: on web it reports whether the database
really persists (OPFS via a Worker) or opened transiently because the browser
denied OPFS access — private windows and locked-down embeds can force the
transient path, and the flag is how app code finds out instead of losing data
silently. It is always true on iOS and Android. On macOS the leaf calls
system libsqlite3 directly — `dlopen` plus `sqlite3_*` entry points are
resolved from the regenerated host metadata (`metadata.macos.arm64.nsmd`), so
the database is a real file under `Application Support/octane-sqlite` with
the same per-statement durability as the mobile plugin. `supported` is
`false` on Windows for now; `openDatabase` there rejects, so branch on the
flag first rather than catching.

`getUserVersion`/`setUserVersion` map to `PRAGMA user_version` — the shared
migration hook. `deleteDatabase(name)` removes the file. On native, calls
run on the plugin's worker threads (`threading` option, default on); on web
everything runs inside a spawned Worker, so no query blocks the UI thread
either way.

For a handful of flags or strings, `storage` is still the right tool —
open a database when you need queries, joins, or migrations.

## Interface shapes

The shared contracts are deliberately small and platform-neutral — each
optional service may expose a `Capability` object (`supported`, `ensure`,
`impl`), while direct services such as `storage` and `connectivity` expose
methods directly. Exact signatures live in the
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
