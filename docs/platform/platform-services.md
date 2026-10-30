# Using device features

> Save a setting, attach a photo, share a link, or use another device feature.

A **service** lets your code use a feature without drawing a screen itself.
For example, a storage service remembers a setting and a sharing service
opens the device's share options. Some features need permission or are not
available on every platform. Check those results and explain them in the app.

## Update a released phone app

For updating a phone app's JavaScript after release, follow
[phone updates](../app/updates.md). Its Node build tool compares native inputs
and compiler context; keep it out of app imports. Generate the prepare hook,
rebuild the binary, and retain its private build record with the payload.

```sh
bun add @octane-xplat/updates
bun add -D @octane-xplat/fingerprint
bun run xplat updates init
```

## Choose a useful feature

For a phone app's first launch, use
[launch-screen control](../../packages/splash-screen/README.md). Import its hold
before Application.run(), then dismiss after the root Page and required data
are ready. Use the capability check in shared code; browser and desktop hosts
do not expose this phone startup controller.

```ts
import { SplashScreen, hide } from '@octane-xplat/splash-screen'

export function revealReadyPhonePage() {
 if (SplashScreen.capabilities.hold) hide()
}
```

For a phone screen that benefits from landscape, follow the
[screen-orientation setup](../../packages/screen-orientation/README.md).
Configure the iOS delegate and plist first. Check support and handle refusal;
resizable windows and browser restrictions can prevent a lock. Keep an adaptive
layout available when the request fails.

```ts
import { OrientationLock, lockAsync, supportsOrientationLockAsync } from '@octane-xplat/screen-orientation'

export async function chooseLandscape(): Promise<string> {
 if (!await supportsOrientationLockAsync(OrientationLock.LANDSCAPE)) return 'Keep the flexible layout.'
 try {
  await lockAsync(OrientationLock.LANDSCAPE)
  return 'Landscape policy applied.'
 } catch (error) {
  return `Keep the flexible layout: ${String(error)}`
 }
}
```

Give your agent an outcome with a fallback: “Let me attach a photo to a trip
item; explain when capture is unavailable.” Use the shared `media` service
for still capture; a live [camera preview](../app/primitives.md#when-a-screen-needs-more) is a
separate component and setup.

```ts
import { media } from '@octane-xplat/media'

// Call from an Attach photo button; the caller owns preview and cleanup.
export async function attachPhoto() {
	const image = await media.capturePhoto()
	if (!image) console.log('No photo attached')

	return image
}
```

Check the interaction on each intended target. **iOS/Android** use the OS
camera flow; **web on a phone** may offer capture; **desktop web** may open a
file picker instead. After a successful selection, the trip item should show
its photo. Cancel the picker and check that the item stays unchanged. Deny
access and check that the item remains usable with an explanation of why no
photo was attached. These are checks for the feature you build, not behavior
that a service adds to your screen automatically.

macOS and Windows are not implied by an iOS/Android implementation:
consult the [target guide](../start/spec.md#choose-your-targets) and
[known limits](../testing/known-limits.md). Sharing is available on macOS through the
AppKit share picker.

```ts
import { share } from '@octane-xplat/share'

const result = await share.text('Packing list ready')
console.log(result)
```

The capability table below describes web and iOS/Android unless stated
otherwise. Keep native details in a service or platform-specific file so
shared screens can keep using the same interface.

## The shared service shape

Services have the same name on every platform. For example, a screen can use
storage without choosing browser or native storage itself. This example
saves a setting and reads it back; it can go in a setup function or event
handler in your app:

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('has-seen-welcome', 'true')
const seen = storage.getString('has-seen-welcome') // "true"
```

Writes are immediately readable. Native stores can write to disk later, so
request a handoff with `storage.flush()` when saving a draft. It is synchronous
and returns the platform's confirmation; it cannot guarantee survival of every
process or power failure. Automatic lifecycle flushing is best effort. Web
storage writes synchronously, so its flush is a no-op. Handle a false result
or an exception without telling the user the draft is safely on disk:

```ts
import { storage } from '@octane-xplat/platform'

export function savePackingDraft(text: string): boolean {
	try {
		storage.setString('packing-draft', text)
		return storage.flush()
	} catch {
		return false // Keep the editor open so the user can retry.
	}
}
```

### AppKit settings

In the experimental native macOS host, ordinary settings use `NSUserDefaults`.
A missing write/remove hook retains a pending session-only change, including
removals, until the current host accepts it. Reads do not replay pending writes. A
native missing value clears an acknowledged memory mirror; it cannot revive
an old setting. Use the same API in an event handler:

```ts
import { storage } from '@octane-xplat/platform'

export function clearPackingDraft(): boolean {
	try {
		storage.remove('packing-draft')
		return storage.getString('packing-draft') === null && storage.flush()
	} catch {
		return false
	}
}
```

Changes made before a host is installed can be handed to that host by a later
flush. Changes owned by a previous host stay with it. An undelivered mutation
makes flush return false; a host with synchronous mutation hooks may confirm
handoff without a separate flush hook. AppKit's inactive subscription follows
the current host and retries failed registration on a later write. The
[Services demo](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/Storage.macos.tsrx)
provides explicit Save, Read, Remove and Flush actions for a non-secret demo key:

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('preferred-bag', 'Carry-on')
const handoffConfirmed = storage.flush()
console.log(handoffConfirmed)
```

These are source implementation contracts. Actual AppKit restart persistence,
inactive/termination delivery and installed-app behavior remain unqualified.

### Windows settings

On experimental native Windows, writes go to the OS preferences store, but the
host exposes no blocking commit confirmation. `storage.flush()` returns `false`
there; it does not discard previously written preferences.

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('packing-draft', 'Passport')
const handoffConfirmed = storage.flush() // false on native Windows
```

Keep tokens and other secrets out of ordinary storage; follow
[Store a session token](#store-a-session-token) for the secure-storage setup.

Other services cover permissions, clipboard, haptics, files, media
picking, notifications, safe-area insets, screen size, and app lifecycle.
A **leaf package** is an add-on installed separately for a feature. Features
that need a NativeScript plugin live in these packages: `@octane-xplat/share` (`share.text`, `share.url`, `share.file`),
`@octane-xplat/files`, `@octane-xplat/media`, `@octane-xplat/biometrics`,
`@octane-xplat/geolocation`, [`@octane-xplat/notifications`](local-notifications.md),
`@octane-xplat/secure-storage`, and the `haptics` service in
`@octane-xplat/haptics`. Each leaf owns its plugin as a real dependency —
apps do not redeclare it.

```ts
import { share } from '@octane-xplat/share'
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export async function pickAndShare() {
	const image = await media.pickImage()
	if (!image) return
	try {
		return await share.text(`Selected ${image.name}`)
	} finally {
		files.release(image)
	}
}
```

## Keep a screen awake

Keep a reading or presentation screen awake while it is mounted. The hook
releases its request on unmount; see [keep-awake ownership and target limits](keep-awake.md).

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen() {
	useKeepAwake()

	return <Text>Reading</Text>
}
```

## Read AppKit locale and device metadata

Use `locale` for the runtime's formatting locale and `device` for the AppKit
identity. The root and direct `locale`/`device` imports select the same objects.
A tag such as `zh-Hant-TW` keeps its script in `tag`, with language `zh` and
region `TW`; a language-only tag has an empty region:

```ts
import { locale, device } from '@octane-xplat/platform'
import { locale as directLocale } from '@octane-xplat/platform/locale'
import { device as directDevice } from '@octane-xplat/platform/device'

console.log(locale.tag, locale.language, locale.region)
console.log(device.os) // macos in a native AppKit app
console.log(locale === directLocale, device === directDevice) // true
```

AppKit reads `Intl.DateTimeFormat().resolvedOptions().locale` once when the
module loads and parses it with `Intl.Locale`. Missing, throwing or invalid Intl
reads/parsing use `{ tag: 'en', language: 'en', region: '' }`. This snapshot does
not subscribe to OS preference changes or enumerate preferred languages. Device
identity remains `macos`, `Mac`, `Apple`, with OS version `unknown`; no hardware
model/version discovery is claimed. Choose your app's translated catalogs through
[Lingui](../app/localization.md#locale-detection), independently of this metadata:

```ts
import { locale } from '@octane-xplat/platform/locale'
import { matchLocale } from '@octane-xplat/lingui'

const initialLanguage = matchLocale(locale.tag, ['en', 'zh'], 'en')
```

These native leaves avoid the phone `Device` import. Actual JavaScriptCore Intl
behavior, generated/installed resolution and OS preference/relaunch behavior
remain unqualified; source models do not establish those runtime results.

## System bars on AppKit

Native AppKit does not expose phone-style status or navigation bars through
`systemBars`. Both `setStatusBarStyle` and `setColor` are callable from the
root or direct subpath, but only emit a fixed unsupported warning and return
void. They do not tint the window title bar, toolbar or macOS menu bar. A
successful return is not an applied-style confirmation:

```ts
import { systemBars } from '@octane-xplat/platform'
import { systemBars as directBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // AppKit: unsupported warning, no chrome change.
directBars.setColor('#171717') // AppKit: same unsupported behavior.
```

The dedicated AppKit leaf avoids importing mobile `Application`/`Color` helpers.
Generated declarations, installed import selection and actual native startup
remain unqualified. This import repair does not add desktop chrome styling.

## Read AppKit window and activity state

In a native macOS screen, use the primary window's content size to choose a
layout. `useWindowSize()` returns an immutable snapshot in points;
`useBreakpoints$` compares its width with named thresholds. The platform root and
its screen, lifecycle, safe-area and breakpoint subpaths select the same AppKit
implementations. Keep reads inside a screen component:

```tsx
import { useWindowSize, useBreakpoints$ } from '@octane-xplat/platform'
import { Text, View } from '@octane-xplat/ui'

const thresholds = { wide: 900 }
export function ResponsiveScreen() {
	const size = useWindowSize()
	const matches = useBreakpoints$(thresholds)
	return <View><Text>{`${size.width}×${size.height}: ${matches.wide ? 'Wide' : 'Compact'}`}</Text></View>
}
```

The subpaths also expose app activity and desktop insets. AppKit retains zero
safe-area insets; missing or invalid host size is `0×0`, and missing activity
retains the existing `active` fallback. Use the environment service when unknown
activity must remain distinct from active. Install the host before rendering;
replacement is picked up on a later render, without polling the global. This
API describes the primary window rather than the window containing each view:

```tsx
import { useAppState } from '@octane-xplat/platform/lifecycle'
import { useSafeAreaInsets } from '@octane-xplat/platform/safe-area'
import { Text, View } from '@octane-xplat/ui'

export function ActivityStatus() {
	const state = useAppState()
	const insets = useSafeAreaInsets()
	return <View style={{ paddingTop: insets.top }}><Text>{state}</Text></View>
}
```

**AppKit migration:** `useBackHandler` now returns `void`, matching the shared
contract. Remove code that saves and calls its former no-op cleanup function.
The hook intercepts Android hardware back only; it creates no AppKit listener.
Existing shared components can keep the call without a cleanup assignment:

```tsx
import { useBackHandler } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function EditorScreen() {
	useBackHandler(() => false)
	return <Text>Editor</Text>
}
```

The [manual AppKit readers](https://github.com/octane-xplat/octane-xplat/blob/main/examples/probes/platform-state.macos.tsrx)
compare root and subpath values and allow readers to unmount/remount. Authored
source and packed-consumer cases remain unrun; actual native resize/activity,
Octane effects, focus/IME, memory and installed-app behavior remain unqualified.

## Handle incoming AppKit links

The native AppKit host delivers live resize, activity and incoming-link events
to the registrations present when that broadcast starts. Each registration owns
its cleanup, including duplicate callbacks. Removing a reader before its turn
suppresses it; adding or re-registering one starts on the next broadcast. A live
synchronous handler failure cannot block other readers. Async work must handle
its own rejection; the host does not await event handlers. Incoming-link registration can also
deliver queued launch URLs synchronously; if it throws, that registration is
removed and the failed/unattempted URLs stay queued for a later retry:

```ts
import { onDeepLink } from '@octane-xplat/platform'

export function tryWatchIncomingLinks(onURL: (url: string) => void): (() => void) | null {
	try {
		return onDeepLink(onURL)
	} catch {
		return null // Initial delivery failed. Fix the handler before retrying.
	}
}
// Keep a successful cleanup function with the owner and call it when that owner ends.
```

These are native-host source contracts. A returned cleanup function does not
confirm host availability, or acknowledge that a URL was opened or routed. Actual AppKit notification/URL dispatch, signed-app launch,
reentrant native delivery and subscription memory remain unqualified.

## Announce a status

Keep a status such as “Settings saved” visible, and call `announce` after the
operation succeeds to request a screen-reader announcement without moving focus:

```ts
import { announce } from '@octane-xplat/platform'

// First update your screen's visible status, then request the announcement.
announce('Settings saved')
```

Pass a short message translated into the user's language. `announce` returns
nothing; it does not confirm that anyone heard or read the message. The
[maintained example](../../examples/accessibility/announce-status.ts) updates the
visible message before requesting the announcement.

Web uses a polite live region; iOS posts an accessibility announcement; Android
requests one on the foreground activity's content view. In a macOS **AppKit**
app, each nonblank call posts an announcement request at medium priority on the
application, without choosing or retaining a window. Repeated identical messages
produce separate requests, but VoiceOver decides their presentation and timing.
Blank or whitespace-only text does nothing on AppKit. Calls before host setup or
after host termination do nothing and are not replayed. Once the host is set up,
calls can post before any window opens and after a window closes. There are no
announcement timers, observers, or retained messages to clean up. A macOS
WKWebView frontend uses the web live region instead.

To check delivery, enable the target's screen reader, trigger a real successful
save, and listen for the message (or check braille output). Confirm focus stays
on the original control. Repeat the same action and check its presentation;
rapid requests may be managed by the screen reader. An API test or a successful
AppKit notification call establishes dispatch only. VoiceOver speech, braille,
and queue behavior have not been verified for this implementation.

AppKit semantics follow Apple's [announcement notification documentation](https://developer.apple.com/documentation/appkit/nsaccessibility-swift.struct/notification/announcementrequested).

## Watch network state

Subscribe to `connectivity` while a feature needs updates, then call the returned
function to release that subscription. NativeScript subscribers share one OS
monitor; registering the same callback twice still gives each registration its
own teardown. A failed initial read, callback or monitor startup rolls back that
registration. A connection type describes the host connection, not whether a
particular server will answer your request.

```ts
import { connectivity, type ConnectivityState } from '@octane-xplat/platform'

const onNetwork = (state: ConnectivityState) => console.log(state.online, state.type)
const stopFirst = connectivity.subscribe(onNetwork)
const stopSecond = connectivity.subscribe(onNetwork)
stopFirst() // The second registration still receives updates.
stopSecond()
```

The experimental Windows adapter reads the current WinRT profile each time.
Its [connection level](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkconnectivitylevel)
determines `online`: local, limited and internet access permit requests even
when the transport is `unknown`. Only recognized Wi-Fi, mobile and Ethernet
transports receive those labels. A missing binding reports `supported: false`;
an absent profile or a `None` level reports known offline state. Native snapshot
reading has been checked on x64; app reconnect event delivery remains unqualified.

```ts
import { connectivity } from '@octane-xplat/platform'

const state = connectivity.getState()
const status = state.supported === false ? 'unknown' : state.online ? state.type : 'offline'
console.log(status)
```

## Store a session token

Use `@octane-xplat/secure-storage` for secrets such as a token returned by your
sign-in flow. A token is a private string your app sends to its server to identify
a signed-in session. Install the leaf with `bun add @octane-xplat/secure-storage`.
Use it from a setup function or event handler:

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

async function rememberSession(token: string): Promise<boolean> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false

	try { return await secureStorage.set('session-token', token) }
	catch { return false }
}

type Session = { status: 'restored'; token: string } | { status: 'missing' | 'unavailable' }
async function restoreSession(): Promise<Session> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return { status: 'unavailable' }
	try {
		const token = await secureStorage.get('session-token')
		return token === null ? { status: 'missing' } : { status: 'restored', token }
	} catch { return { status: 'unavailable' } }
}

async function forgetSession(): Promise<boolean> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false

	try { return await secureStorage.remove('session-token') }
	catch { return false }
}
```

Use the restored value privately in your sign-in flow. Display only a status such
as “session restored”; never put keys, tokens, or native errors in UI or logs.
Check the boolean returned by saving or deleting before reporting success. Keep
the missing and unavailable states separate: only a missing item reads as null,
including after successful deletion. Ordinary
preferences (`storage`) are not a fallback for secrets. Plain browsers report
unsupported; keep the session in memory or require sign-in again.

For macOS setup, packaged bundle identity and the separate development namespace,
follow the [native prerequisites](macos-native.md#prepare-the-app) and
[AppKit secure-storage contract](../../packages/secure-storage/README.md#macos-appkit).
The new bridge cases remain unrun; real Keychain, signing/sandbox and installed-app
qualification are still pending. Availability checks do not establish those results.

Experimental native Windows has a package-scoped Credential Locker leaf.
Unpackaged hosts report unsupported; Windows/account policy can roam saved
credentials. Standalone x64 operations passed with a task namespace, while real
packaged identity and persistence across app launches remain unqualified. See
the [Windows storage boundary](../../packages/secure-storage/README.md#experimental-native-windows).

```ts
if (secureStorage.supported && await secureStorage.isAvailable()) {
	const removed = await secureStorage.remove('session-token')
}
```

## Generate secure random bytes

Use `random` from `@octane-xplat/platform` when a feature needs values an
attacker cannot guess — a sign-in nonce, a salt, or key material. It fills a
byte array from the operating system's secure random source, never from
`Math.random()`:

```ts
import { random } from '@octane-xplat/platform'

const nonce = random.bytes(16)

// Or fill a view you already own — a Uint8Array, DataView, or other typed array.
const salt = new Uint8Array(32)
random.fill(salt)
```

Browsers use `crypto.getRandomValues`, iOS and macOS use `SecRandomCopyBytes`,
and Android uses `java.security.SecureRandom`. The experimental Windows leaf uses
WinRT `CryptographicBuffer`; Windows runtime verification is pending. Check
`random.supported` before generating bytes, and disable or defer the feature
when the host has no bound source. Never weaken the secret.

## Read the installed app version

Use `appInfo` for an About screen or support details. On experimental native
Windows, it reads package identity: `bundleId` is `Package.Id.Name`, `version`
keeps all four `Major.Minor.Build.Revision` numbers, and `build` is the `Build`
field. Unpackaged hosts report unsupported with null fields; a missing version
projection can leave version/build null even when the identifier is available.

```ts
import { appInfo } from '@octane-xplat/platform'

const versionLabel = appInfo.supported
  ? appInfo.version ?? 'Version unavailable'
  : 'App metadata unavailable'
```

Read the values after host startup. The Windows adapter reads lazily, so an
early unavailable read is not cached. Packaged values and app integration still
need Windows qualification; see the
[Windows evidence record](../../.agents/docs/exploration.md#operational-evidence).

## Open settings

Offer a settings action when the user needs to change a system preference.
Check bridge support and availability before calling `open()`. Native macOS
opens the installed System Settings application without choosing a pane; iOS
and Android use their app-specific settings page. A `true` result means the
launch request was accepted, not that the window appeared or a permission
changed. Keep the action explicit so a capability check never launches it.

```ts
import { openSettings } from '@octane-xplat/platform'

export async function showSettings(): Promise<boolean> {
	if (!openSettings.supported || !await openSettings.isAvailable()) return false
	return openSettings.open()
}
```

AppKit resolves the application by bundle identifier through the public
[NSWorkspace lookup](https://developer.apple.com/documentation/appkit/nsworkspace/urlforapplication%28withbundleidentifier%3A%29).
It does not select an app-specific permission page or modify permissions.
A missing bridge is unsupported; a missing application, failed lookup, or rejected
launch returns false. Browsers remain unsupported. Actual AppKit presentation,
activation and packaged/sandbox behavior remain unqualified.

```ts
import { openSettings } from '@octane-xplat/platform'

// In an explicit user action, after checking support/availability:
const accepted = openSettings.open()
console.log(accepted ? 'Use System Settings to change the permission' : 'Settings could not open')
```

## Capability map

| Service                             | Shared shape                                                                                 | Platform notes                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geolocation`                       | `getCurrentPosition(options)`                                                                | `@octane-xplat/geolocation` leaf                                                                                                                                                     |
| `connectivity`                      | `getState()` + `subscribe(listener)`                                                         | web also exposes connection type where `navigator.connection` exists                                                                                                                 |
| `appInfo`                           | `{ supported, version, build, bundleId }`                                                    | Unsupported in a browser; experimental native Windows reads package identity and reports null fields when unavailable                                                                 |
| `openUrl(url)`                      | returns whether an outbound-link request was accepted                                        | WKWebView and native Windows submit asynchronously; this API cannot return the host's eventual result                                                                          |
| `random`                            | `bytes(length)`, `fill(view)` — OS CSPRNG bytes                                              | WinRT CryptographicBuffer candidate on Windows; runtime verification pending                                                                                                         |
| `openSettings`                      | capability; `open()`                                                                         | [AppKit opens System Settings without selecting a pane](#open-settings); iOS/Android open app settings; unsupported on web                                                                                                                                                                   |
| `media.pickImage()`, `pickImages()` | pick existing image(s)                                                                       | `@octane-xplat/media` leaf                                                                                                                                                           |
| `media.capturePhoto()`              | still capture through the OS camera UI                                                       | `@octane-xplat/media` leaf; web uses `<input type="file" capture>` — a real camera flow on phones, a file-picker fallback on desktops                                                |
| `webAuthn`                          | `isAvailable()`, `create(options)`, `get(options)` — raw WebAuthn over the RP's JSON options | web only; native reports `supported: false` — use `authSession`                                                                                                                      |
| `authSession`                       | `open(url, { callbackScheme })` — hosted web ceremony in a system browser                    | iOS/macOS ASWebAuthenticationSession, Android Custom Tab + deep-link return; unsupported on web and Windows                                                                          |
| `@octane-xplat/sqlite`              | `openDatabase(name)` → async `execute`/`select`/`get`/`transaction`/`userVersion`            | own leaf, not a platform service; web persists via an OPFS worker, macOS binds system libsqlite3 through host metadata interop (`db.persistent` reports); Windows `supported: false` |

`media` owns the `camera` and `photos` permission requests for still capture
and image picking. Live-preview permission belongs to `@octane-xplat/camera`,
which requests it when `CameraView` starts. `permissions.getPermissions(kind)`
and `permissions.requestPermissions(kind)` delegate to the owning service for
notifications, media, and location rather than maintaining a second set of
probes — get never prompts, request may. On web, `requestPermissions('camera')`
reports the file-input capture capability — `granted` wherever the DOM
exists — without querying or prompting; starting `CameraView` instead uses
`getUserMedia` to request access for the preview.

```ts
import { media } from '@octane-xplat/media'

// Web requestPermissions('camera') reports 'granted' — the file-input path
// needs no browser permission — so the denial gate only binds on native
// leaves.
export async function webCapture() {
	const status = await media.requestPermissions('camera')
	if (status.status === 'denied') return null

	return media.capturePhoto()
}
```

```ts
import { permissions } from '@octane-xplat/platform'
import { media } from '@octane-xplat/media'

console.log(await media.requestPermissions('photos'))
console.log(await permissions.requestPermissions('camera')) // web: reports capture capability without prompting
```

`files.writeText(name, text)` writes a file on native. On web, it starts a
browser download with the requested name and returns a `FileRef` for the
download's object URL; it does not write to a local filesystem path.

```ts
import { files } from '@octane-xplat/files'

const file = await files.writeText('packing.txt', 'Passport\nCharger')
if (file) console.log(file.name) // web: a download, not a persistent file path
```

`files.readBytes(ref)` and `files.writeBytes(name, bytes)` move binary data
through the same `FileRef` contract: `readBytes` returns a `Uint8Array` and
accepts `maxBytes` (reject oversized files mid-read) plus an abort `signal`;
`writeBytes` writes into the app sandbox on native and downloads on web.
`files.export(name, bytes)` opens the platform save/export UI and resolves
`saved`, `cancelled`, or `unavailable` — it never reports `saved` from
presentation alone. One export can be in flight at a time; a concurrent call
rejects with an `ExportBusyError`.

```ts
import { files } from '@octane-xplat/files'

const picked = await files.pick('image/*')
if (picked) {
	const bytes = await files.readBytes(picked, { maxBytes: 8 * 1024 * 1024 })
	files.release(picked)
	const result = await files.export(picked.name, bytes, { mimeType: 'image/png' })
	if (result === 'saved') console.log('export committed')
}
```

File names for `writeText`/`writeBytes`/`export` must be bare names, not
paths — separators and `..` are rejected. Picked `content://` (Android) and
import-copy (iOS) refs are session-scoped; copy durable data with
`writeBytes` rather than retaining the URI.

## Share text and URLs

Use the shared `share` service to offer text or a link to the system's sharing
options:

```ts
import { share } from '@octane-xplat/share'

const textResult = await share.text('A note to share')
const linkResult = await share.url('https://example.com', 'Example')
```

On iOS, Android, and macOS, these calls open the native share picker. A macOS
WKWebView asks its host to open the picker. In a browser, they use the Web
Share API when available and copy the content when the browser offers
clipboard access. Check the result: `shared` means the share flow was
opened or completed by the target, `copied` means the fallback copied the
content, and `unavailable` means neither option could be offered. The service
does not report whether a recipient ultimately received the content.

```ts
import { share } from '@octane-xplat/share'

const result = await share.url('https://example.com/trips/42', 'Summer trip')
if (result === 'unavailable') console.log('Sharing unavailable')
else if (result === 'copied') console.log('Link copied')
else console.log(result) // shared or cancelled; neither proves recipient delivery
```

For native AppKit, rebuild the host after updating the share package. It owns
its compiled picker bridge and waits for service completion or cancellation;
opening a picker alone is not shared. Keep local files alive until the promise
settles. Actual OS UI and transfer remain unqualified. The separate hosted macOS
webview backend still reports shared on picker launch. See
[native AppKit sharing](../../packages/share/README.md#native-appkit-sharing).

```ts
import { share } from '@octane-xplat/share'
const outcome = await share.file('file:///tmp/trip%20notes.txt')
```

`share.file(path)` opens the same picker for a local file — for example a
recording or a document your app just saved. The path must be an absolute
filesystem path or `file://` URL; Android also accepts `content://` URIs.
On iOS the result is `shared` or `cancelled` (the sheet reports dismissal);
on Android the system chooser reports no outcome, so a launched sheet
resolves `shared`. Browsers cannot share a file by path, so web resolves
`unavailable` — the same call inside a macOS-hosted webview reaches the
AppKit share picker.

```ts
import { files } from '@octane-xplat/files'
import { share } from '@octane-xplat/share'

const saved = await files.writeBytes('clip.mov', bytes)
const result = await share.file(saved.uri, { subject: 'Share clip' })
if (result === 'unavailable') console.log('No file-share path on this target')
```

On Android the package declares its own FileProvider
(`${applicationId}.xplatshare`) covering app-private storage, cache, and
shared external storage — paths outside those roots reject. On iOS, the
sheet's built-in save-to-gallery activities need
`NSPhotoLibraryAddUsageDescription` in `Info.plist`.

Camera capture is stills-only — no maintained NativeScript video-capture
plugin exists, so the contract has no `captureVideo`.
`width`/`height`/`keepAspectRatio`/`saveToGallery` are native-only
`capturePhoto` options. Apps calling `capturePhoto` must set
`NSCameraUsageDescription` — plus `NSPhotoLibraryAddUsageDescription` when
using `saveToGallery` — in their iOS `Info.plist`.

```ts
import { media } from '@octane-xplat/media'

// iOS Info.plist needs the usage descriptions described above.
const image = await media.capturePhoto({
	width: 800,
	height: 600,
	keepAspectRatio: true,
	saveToGallery: false,
})
// The caller owns image until its preview/upload finishes, then files.release(image).
```

## Hash or encrypt app data

Use the [crypto guide](../../packages/crypto/README.md) for secure random bytes,
checksums and authenticated AES encryption. AES keys are separate secrets;
keep them in supported secure storage and save ciphertext with app data. The
portable AES subset uses fresh 12-byte nonces and 16-byte tags. Browsers require
Web Crypto on a secure origin; Android runtime remains unverified.

```ts
import { AESEncryptionKey, aesEncryptAsync } from '@octane-xplat/crypto'

export async function encryptDraft(bytes: Uint8Array) {
 const key = await AESEncryptionKey.generate()
 const sealed = await aesEncryptAsync(bytes, key)
 return { key, encrypted: await sealed.combined() }
}
```

## Print a document or export a PDF

Use the [print/PDF guide](../../packages/print/README.md) for HTML receipts,
reports, or system print UI. Check each operation before offering it: browsers
can print but cannot return a generated file through this API. Native exports
remain app-owned until their preview/upload finishes, then need release.

```ts
import { Print, printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function uploadReport(html: string, upload: (uri: string) => Promise<void>) {
 if (!Print.capabilities.printToFile) throw new Error('PDF export is unavailable')
 const result = await printToFileAsync({ html })
 try { await upload(result.uri) }
 finally { releasePrintFile(result) }
}
```

## Collect a payment

Use the [Stripe checkout guide](../../packages/stripe/README.md) for guest
PaymentIntent checkout. Your app server owns order prices, Intent creation and
payment verification. The client uses a publishable key and Stripe's secure UI.
Native SDK installation needs a rebuild; merchant wallets and successful payments
still need app-specific qualification. Native desktop hosts report unavailable.

```ts
import { initPaymentSheet, presentPaymentSheet } from '@octane-xplat/stripe'

// Call after SDK initialization, with an Intent authorized by the app backend.
export async function pay(paymentIntentClientSecret: string, returnURL: string) {
 const initialized = await initPaymentSheet({ merchantDisplayName: 'Example store',
  paymentIntentClientSecret, returnURL })
 return initialized.error ? initialized : presentPaymentSheet()
}
// Client completion still requires order verification on the server.
```

## Browse the device media library

For a custom gallery or album editor, use the
[media-library guide](../../packages/media-library/README.md). It covers permission
setup, paging, edits, and cleanup. The `media` picker below remains the smaller
choice for selecting an attachment. Media-library supports iOS and implements
Android 10+; Android runtime remains unverified. AppKit support is experimental;
web, GTK and native Windows report unavailable.

```ts
import {
	AssetField,
	MediaLibrary,
	Query,
	requestPermissionsAsync,
} from '@octane-xplat/media-library'

export async function firstLibraryPage() {
	if (!MediaLibrary.supported) return []
	const permission = await requestPermissionsAsync(false, ['photo'])
	if (!permission.granted) return []
	return new Query()
		.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
		.limit(20)
		.exeForMetadata()
}
```

## Pick and capture images

For a smaller upload or an exported crop after picking a photo, follow
[Transform images](../../packages/image-manipulator/README.md). The returned
file is owned separately from the picked image and the editing context.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function smallerPhoto(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.resize({ width: 800 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'jpeg', compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}
```

On macOS AppKit, offer the normal file picker directly from a button. It reads
only selected files and returns app-owned temporary JPEGs with the original
pixel dimensions and aspect ratio. No Photos browsing
or broad photo-library permission is requested. The picker does not depend on
`requestPermissions('photos')`, which still reports `unsupported` on this target.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export async function chooseImage() {
	const image = await media.pickImage() // null on cancel
	if (!image) return null
	try {
		// Bytes outlive the released temporary file; the uri does not.

		return await files.readBytes(image)
	} finally {
		files.release(image)
	}
}
```

Install `@octane-xplat/media`; it owns the NativeScript camera/image-picker
plugins. Import `media` from that leaf. Add app-specific
`NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to iOS
`Info.plist`; gallery saving also needs `NSPhotoLibraryAddUsageDescription`.
Android camera permission and the FileProvider are merged from the camera
plugin. Do not add another image-picker pod declaration to the app Podfile.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

const permission = await media.requestPermissions('camera')
if (permission.granted) {
	const image = await media.capturePhoto({ saveToGallery: false })
	if (image) {
		try {
			// Upload before releasing the temporary reference.
			const body = await files.readBytes(image)
			const response = await fetch('/api/photos', { method: 'POST', body })
			if (!response.ok) throw new Error('Photo upload failed')
		} finally {
			files.release(image)
		}
	}
}
```

Install `@octane-xplat/files` for `files.release`; it revokes a web object URL
or removes a native temporary preview file. On replacement, release the old
reference after its consumers finish; release the current reference at owner
teardown. Do not delete a gallery original or arbitrary user-owned file.
Single selection returns `null` on cancel, multiple selection returns `[]`,
and capture returns `null` on denial, cancellation, absence or a native capture
failure. `requestPermissions('camera')` distinguishes permission/availability before capture;
a granted result alone does not prove the OS capture flow will succeed.
Picker/conversion failures can reject: catch them and retain the prior selection.
Failed browser reads allocate no preview URL, and a failed native conversion
removes its generated temporary JPEG before rejecting.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export async function readSelection() {
	try {
		const images = await media.pickImages()
		try {
			// Finish every read before releasing its temporary source.
			const bytes: Uint8Array[] = []
			for (const image of images) bytes.push(await files.readBytes(image))
			return bytes
		} finally {
			for (const image of images) files.release(image)
		}
	} catch {
		console.log('Could not read the selection')

		return []
	}
}
```

On web, `requestPermissions('camera')` neither queries nor requests camera access — the
file-input capture flow needs no browser permission, so the leaf reports
`granted` wherever the DOM exists and `unsupported` only without one.
Desktop browsers may open a file picker instead of a camera. Successful picks
return `{ name, uri }`; use `uri` for the preview and `files.readBytes(image)`
for upload, as shown above. The picker does not return a data URL. The reference
is temporary; keep it until all preview and upload consumers finish.

Check denial and cancellation on a fresh test app without resetting an existing
app's permissions or data. Then capture once after an already-granted permission,
confirm a non-null result, release it, and verify the app-created preview is gone.
The [nonvisual browser probe](../../apps/web/scripts/optional-services.ts) uses a
synthetic file-input payload and never renders or inspects an image. The
[cleanup tests](../../packages/media/tests/cleanup.test.mjs) inject read/conversion
failures; they do not qualify camera hardware or native permission dialogs.
The [macOS selection checks](../../packages/media/tests/macos-picker.test.mjs)
inject panel/codec/filesystem responses for cancellation, invalid data, cleanup,
single/multiple picks and repeated selection. Packed consumer checks exercise
the macOS public entries. Real panel interaction remains a separate runtime gate.
The isolated [AppKit runtime check](../../packages/media/tests/macos-runtime.mjs)
uses real PNG/JPEG conversion and file IO with an injected panel; it confirms
dimensions and file-byte round-trips without displaying an image.

### AppKit still photos

On AppKit, `getPermissions('camera')` only queries permission. An undecided
status returns `unsupported`; call capture directly from a user action to offer
the sheet before authorization. Checking permission never opens an OS prompt.

```ts
import { media } from '@octane-xplat/media'

export async function cameraPermissionAlreadyGranted() {
	return (await media.getPermissions('camera')).granted
}
```

On macOS AppKit, call capture from a button press. The app opens a sheet with
Capture and Cancel. The first Capture press requests camera access and starts
the preview; frame the photo and press Capture again to take it. Cancel, denial,
a missing or busy camera, or closing the window returns `null`, so keep the
previous image. Preparation and shutter work time out after 15 seconds. The
[maintained action](../../examples/media/capture-photo.macos.ts) also ignores
late results after its screen owner ends. Deterministic sheet checks inject the
camera backend, while the [real-host checks](../../packages/camera/tests/photo-hardware.macos.mjs)
run the production sheet and AVFoundation against the attached hardware: on a
camera-equipped Mac they validate the returned JPEG, and on a Mac with no
camera they qualify the no-device settle. User-granted permission prompts,
physical unplug and OS input still need a human on a camera-equipped Mac.

```ts
import { media } from '@octane-xplat/media'
import type { PickedImage } from '@octane-xplat/media'

// Call from your app's capture button, not during screen mount.
export async function takePhoto(current: PickedImage | null) {
	const next = await media.capturePhoto({ saveToGallery: false })

	return next ?? current
}
```

Set `NSCameraUsageDescription` in the AppKit package configuration. Still
capture requests no microphone access. `saveToGallery: true` rejects before
permission or UI; macOS library saving is unavailable. Width and height resize
the returned JPEG; aspect ratio is preserved by default. Mac cameras use the
default available device; front/rear hints have no AppKit lens mapping.
Movies use the separate [camera session workflow](../../.agents/docs/recipes/camera-movie.md).

```json
{
	"xplat": {
		"targets": {
			"macos": {
				"package": {
					"infoPlist": {
						"NSCameraUsageDescription": "Take photos for your profile."
					}
				}
			}
		}
	}
}
```

```ts
import { media } from '@octane-xplat/media'

export async function takeProfilePhoto() {
	return media.capturePhoto({
		width: 800,
		height: 600,
		keepAspectRatio: true,
		saveToGallery: false,
	})
}
```

## Passkeys and auth ceremonies

For a complete hosted phone sign-in, session restoration and sign-out workflow,
start with [Add sign-in and maintain a session](../app/authentication.md). This
section covers the lower-level capabilities and other provider choices.

A **passkey** lets someone sign in using their device instead of a password.
An **auth ceremony** is the exchange that verifies that sign-in. This is an
advanced integration: it needs a backend (your server) that verifies the
result, plus registered return URLs. A popup returning successfully does not
by itself prove someone is signed in.

This fragment assumes your backend provides `options` and `signInUrl`;
credential verification and callback validation remain app responsibilities.

Two services cover sign-in. On web, `webAuthn` runs the
WebAuthn ceremony in-page: pass the relying party's JSON options
(better-auth/SimpleWebAuthn shape, base64url fields) to `create()` or `get()`
and post the returned JSON credential back. On native, `webAuthn` is
unsupported — a raw platform-authenticator ceremony would require the RP to
host apple-app-site-association/assetlinks.json, so instead `authSession`
runs the whole flow on the app's real HTTPS origin inside a system browser:

```ts
import type { WebAuthnGetOptionsJSON } from '@octane-xplat/platform'
import { webAuthn, authSession } from '@octane-xplat/platform'

export async function signIn(options: WebAuthnGetOptionsJSON, signInUrl: string) {
	if (webAuthn.supported) {
		const credential = await webAuthn.get(options)
		// post credential to the RP's verify endpoint
	} else if (authSession.supported) {
		const result = await authSession.open(signInUrl, { callbackScheme: 'myapp' })
		if (result.type === 'success') {
			// Validate the callback and finish the app-owned sign-in exchange.
		}
	}
}
```

Handle `type: 'cancel'` by leaving the user signed out, and `type: 'error'`
by displaying its `message` with a retry action. Web credential operations can
reject; catch the rejection and keep sign-in available. If neither capability
is supported, show an unavailable state or your app's alternative sign-in
method. Closing a native session should exercise the cancel path; target
runtime verification remains pending. Apps whose backend can issue and redeem
a sign-in attempt get the whole ceremony from `createHostedAuth` in
`@octane-xplat/auth` — a PKCE attempt, the hosted page in a system browser, a
callback exchange, and stored Bearer credentials — instead of wiring
`authSession` themselves. The backend contract plugs in as a `HostedAuthFlow`
(`begin`/`complete`, plus optional `refresh`/`revoke`); the client owns the
ceremony lifecycle, credential storage, and access-token transport:

```ts
import { createHostedAuth } from '@octane-xplat/auth'

const auth = createHostedAuth({
	apiOrigin: 'https://api.example.com',
	flow: myBackendAuthFlow, // see the @octane-xplat/auth README
})
const result = await auth.signIn()
```

```ts
import { authSession } from '@octane-xplat/platform'

export async function hostedSignIn(url: string) {
	if (!authSession.supported) return 'unavailable'
	const result = await authSession.open(url, { callbackScheme: 'sample' })
	if (result.type === 'error') {
		console.log(result.message)

		return 'retry'
	}
	if (result.type === 'cancel') return 'signed-out'

	return result.url // app backend must validate and redeem this callback
}
```

`authSession` needs no iOS/macOS URL-type configuration — the session intercepts
`callbackScheme` itself. On Android the app must declare the scheme's
intent-filter on its main activity, the same registration any incoming deep
link uses; `androidx.browser` (Custom Tabs) arrives transitively with
`@octane-xplat/platform`, no app-side declaration. `prefersEphemeralSession`
asks the iOS/macOS browser for a session without shared cookies.

```ts
import { authSession } from '@octane-xplat/platform'

// Android: register sample://auth/callback in the activity's intent filter.
// Guard on supported — on web this call rejects with UnavailabilityError.
if (authSession.supported) {
	const result = await authSession.open('https://example.com/authorize', {
		callbackScheme: 'sample',
		prefersEphemeralSession: true,
	})
}
```

### AppKit sign-in window ownership

Start native AppKit authentication from a visible key or main window without an
attached sheet. The attempt keeps that window as its anchor when focus changes;
it does not borrow an unrelated window later. Closing that window or terminating
the app retires the attempt, asks the native session to cancel and returns
`type: 'cancel'`. Cancellation failure can leave OS UI open even though JS ownership is retired.
You can then retry from another eligible window. Leaving a
screen alone does not cancel a session, and hiding a window is not window close.

```ts
import { authSession } from '@octane-xplat/platform'

const result = await authSession.open('https://example.com/authorize', {
	callbackScheme: 'myapp',
	prefersEphemeralSession: true,
})
if (result.type === 'cancel') console.log('Sign-in cancelled')
```

The callback scheme and ephemeral preference are captured at the start of the
attempt; mutating your options object later does not change the accepted scheme.
The transport checks that scheme, but your backend must still validate the
callback destination, state, PKCE, nonce and credential exchange. No token or
callback URL should be logged. Missing lifecycle-observer metadata produces an
error rather than starting an untracked session. Failed observer removal leaves
retired callbacks inert but can retain a native observer; runtime cleanup remains
unqualified. A browser session that never completes stays pending until native
cancellation or the window/app closes; there is no fabricated timeout result.

```ts
const options = { callbackScheme: 'myapp', prefersEphemeralSession: true }
const pending = authSession.open('https://example.com/authorize', options)
// Keep options stable; the running attempt already owns its initial values.
const result = await pending
```

The source uses Apple's [presentation-context contract](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/presentationcontextprovider)
and [cancellation API](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/cancel()).
Eleven model cases and an idle cancellation fixture are authored, unrun. Actual
browser/consent presentation, native callbacks, main-thread execution, window
lifetime, credential security, VoiceOver and packaged hosts remain unqualified.
The fixture uses example.com and cannot prove a real sign-in or token exchange:

```sh
bun run probe run examples/probes/auth-session.macos.tsrx --target macos --watch
```

### Register and check a hosted callback

On Android, add this filter inside the existing main NativeScript activity in
`App_Resources/Android/src/main/AndroidManifest.xml`. Replace `sample` and the
host/path with your app's registered callback (`sample://auth/callback` here).
Keep the activity's `singleTask` launch mode so the active ceremony receives
`onNewIntent` rather than a second activity.

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="sample" android:host="auth" android:path="/callback" />
</intent-filter>
```

Use a fresh server-issued state and a short-lived, one-time exchange code for
every attempt. After `authSession.open` returns `success`, send the URL to
your backend for validation and redemption; receiving a URL on the requested
scheme does not authenticate the user. The maintained
[server exchange example](../../examples/auth/README.md) rejects wrong callback
hosts/paths, duplicate code/state parameters, mismatched state, and reused
attempts. It requires app-owned cryptographic verification and storage adapters.
Do not place long-lived session tokens in callback URLs or log their contents.

```ts
import { authSession } from '@octane-xplat/platform'

// App-owned backend methods validate the URL, state, code, and replay.
export async function exchange(
	begin: () => Promise<{ url: string; attempt: string }>,
	redeem: (attempt: string, callbackUrl: string) => Promise<void>,
) {
	const { url, attempt } = await begin()
	if (!authSession.supported) return
	const result = await authSession.open(url, { callbackScheme: 'sample' })
	if (result.type === 'success') await redeem(attempt, result.url)
}
```

To check the integration on a configured app:

1. Open a hosted HTTPS ceremony and finish it. Expect `success`, then a successful
   server code exchange bound to that attempt. Try a wrong state and a reused
   code; both must leave the app signed out.
2. Open another attempt and dismiss the browser/auth sheet. Expect `cancel`.
   An old callback already in Android's activity intent must not become a new
   success. A new callback delivered by `onNewIntent` is scoped to the active
   session; the backend still checks state and replay.
3. Attempt a second `open` while the first is active. Expect `error`; finishing
   the first must allow a retry. Browser launch failure and iOS/macOS native session
   construction/start failure also return `error`, releasing the active slot.
4. On web, expect `authSession.supported === false` and `open()` to reject
   `UnavailabilityError`; use `webAuthn` or ordinary navigation. Catch web credential rejection and handle
   a null credential before posting to your RP.

`node --test packages/platform/tests/auth-session.test.mjs` exercises adapter
callback/cancel/error behavior with mocked NativeScript APIs. It does not qualify
system-browser behavior or a real relying-party exchange on iOS/Android.
Incoming-link routing after authentication belongs to the
[incoming-links recipe](../../.agents/docs/recipes/incoming-links.md).

### Provider SDK sign-in (Apple / Google)

Use the [maintained server exchange boundary](../../examples/auth/README.md) to
forward ID tokens to a server verifier bound to its stored audience and nonce.
The example does not supply a cryptographic verifier or provider registration;
those remain required before a real sign-in can be qualified.

`@octane-xplat/auth` is the provider-SDK path — the native Sign in with
Apple and Google Sign-In SDKs on iOS/Android, their platform web SDKs in the
browser, one shared surface. It is an alternative to the hosted `authSession`
ceremony, not a replacement: use it when the app wants the platform-authentic
button + credential, not a web session on its own origin.

```ts
import { appleAuth, googleAuth } from '@octane-xplat/auth'

// Supply your registered client ID and a fresh backend-issued nonce.
export async function providerSignIn(clientId: string, nonce: string) {
	googleAuth.configure({ clientId })
	const result = await appleAuth.signIn({ scopes: ['email', 'name'], nonce })
	if (result.status === 'success') {
		// result.credential = { idToken, authorizationCode?, user: { id, email?, name? } }
		// hand it to your backend — verification stays app-side
	}

	return result
}
```

Every `signIn` resolves a `SignInResult` — `success` carries the credential,
`cancelled` covers a dismissed sheet/popup, `error` reports the message.
Session storage and token refresh are deliberately out of scope.

```ts
import { appleAuth } from '@octane-xplat/auth'

const result = await appleAuth.signIn()
if (result.status === 'error') console.log(result.message)
else if (result.status === 'cancelled') console.log('Still signed out')
else {
	// Pass to your backend verifier; do not log the credential.
	const response = await fetch('/api/auth/apple', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(result.credential),
	})
	if (!response.ok) throw new Error('Sign-in verification failed')
}
```

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
  Google uses `configure({ hostedFlow })` through ASWebAuthenticationSession.
  Both providers require an AppKit window. See the setup below.

`appleAuth.getCredentialState(userId)` answers whether a previously-granted
Apple credential is still `authorized` — iOS and macOS, `'unknown'` elsewhere.
`googleAuth.signOut()` clears the account selection so the next sign-in
re-prompts. The plugins (`@nativescript/apple-sign-in`,
`@nativescript/google-signin`) are real dependencies of the leaf — apps don't
declare them (decision #51).

```ts
import { appleAuth, googleAuth } from '@octane-xplat/auth'

export async function checkAccount(userId: string) {
	const state = await appleAuth.getCredentialState(userId)
	if (state !== 'authorized') console.log('Ask the user to sign in again')
	await googleAuth.signOut()
}
```

### macOS provider sign-in

Start with a screen containing `AppleSignInButton` or `GoogleSignInButton` and
an `onResult` callback that displays `result.status`. AppKit uses Apple's
official [ASAuthorizationAppleIDButton](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton), including its `type`, `theme`, and
disabled state. Google uses a text trigger for your hosted flow; its `theme`
and `variant` are not applied on AppKit.

For Apple, enable Sign in with Apple on the app's identifier in your Apple
Developer account. Package using that identifier, a signing identity, and a
matching provisioning profile that grants `com.apple.developer.applesignin`.
Put the entitlement in the app's entitlements file and configure that file as
`xplat.targets.macos.package.entitlements`; see [macOS packaging](../start/toolchain.md#experimental-appkit-target).
The CLI does not currently embed a provisioning profile. Use your Apple signing
workflow to embed the matching profile at `YourApp.app/Contents/embedded.provisionprofile`
and sign the final app bundle; adding it after signing requires signing again.
An unsigned fixture or an entitlement file alone cannot qualify a real sign-in.
`appleAuth.configure` has no native client-ID setup: `clientId` and `redirectURI`
are browser-only fields. `supported` checks framework availability, not signing.
Apple's name and email may only arrive on the first authorization. Store them
on your backend when provided; repeat sign-ins may only return the subject ID.

For Google, your backend must own the OAuth client registration, HTTPS Google
return endpoint, token exchange, and verification. Follow [Google's web server OAuth setup](https://developers.google.com/identity/protocols/oauth2/web-server) to register that HTTPS return
URL; after verification, the backend redirects the system browser
to your app's custom scheme with a short-lived, single-use exchange code.
Keep Google client secrets on the backend. A web `clientId` alone does not
configure the AppKit hosted flow. The app adapter connects two backend calls:

```ts
// In your app's .macos.ts startup file. backend is your authenticated HTTPS
// transport; this maintained adapter is an example to copy into your app.
import { googleAuth } from '@octane-xplat/auth'
import { createGoogleHostedFlow } from '../auth/google-hosted.macos'

await googleAuth.configure({
	scopes: ['openid', 'email', 'profile'],
	hostedFlow: createGoogleHostedFlow(backend),
})
const result = await googleAuth.signIn({ nonce: serverIssuedNonce })
```

Copy [google-hosted.macos.ts](../../examples/auth/google-hosted.macos.ts) into
`auth/` beside your startup directory, and implement its `GoogleHostedBackend`:
`begin(options)` returns `{ attemptId, url, callbackScheme }` for a fresh stored
attempt; `complete({ attemptId, callbackURL })` returns the server-verified Google
`AuthCredential`; `signOut()` ends your app session. The adapter passes configured
client IDs, scopes, hosted domain, and the per-call nonce to `begin`. Your backend
must bind them to the attempt, check the exact callback host/path and state,
redeem the code once, and verify Google's signature, issuer, audience, expiry,
nonce, and hosted domain when restricted. Expire cancelled/unused attempts.
A callback URL by itself does not authenticate a user. The existing
[server boundary example](../../examples/auth/README.md) explains these checks;
its session response must be adapted to your credential-returning endpoint.

`googleAuth.signOut()` calls the optional hosted adapter's `signOut` method.
AppKit requests an ephemeral browser session for every Google attempt and caches
no selected account; this does not sign the user out of Google in other browsers
or revoke Google tokens. Other targets ignore `hostedFlow` and use their SDKs.

On a configured app, complete one sign-in, dismiss a second, and retry after an
error. Expect `success`, `cancelled`, and `error` respectively. While either flow
is active, another call to that same API returns `error`; old delegate callbacks
cannot complete a newer attempt. Provider errors stay errors, even when their
text mentions cancellation. `authSession` uses `type: 'cancel'` for a dismissed
browser session. It validates the initial HTTP(S) URL and callback scheme and
releases its active slot after native construction/start failures. Schemes are
passed without a colon, such as `myapp`; no macOS URL-type registration is needed
for the session to intercept them. For Google, `createRequest` must return HTTPS.

Local validation covers adapter regressions, packed declarations, and an isolated
AppKit fixture: official control mounting/update/cleanup, action dispatch, native
Apple delegate cancellation/error dispatch, and credential conversion. These are
not proof of OS pointer input, a user dismissing a real sheet, successful provider
authentication, or a backend exchange. Real Apple success/cancel/state checks and
Google/system-browser completion/cancellation remain pending configured signing,
provider registration, and hosted endpoints.

Declare the optional NativeScript plugin peers used by platform services
in the app’s dependencies. This differs from leaf-owned implementation
dependencies such as the video plugin, which travel with their leaf package. Run
`bun run xplat doctor` from the app root for warning-only checks on missing
declarations. `connectivity` comes from `@nativescript/core` and needs no
plugin.

Native Apple sign-in keeps the initiating visible key/main window and captures
its request options per attempt. Closing that window or the app retires the
controller as cancelled; native dismissal requires the cancel selector (macOS
13+) and remains unqualified. The same lifecycle is separate from browser
`authSession`. See [Apple presenter ownership](../../packages/auth/README.md#keep-apple-sign-in-with-its-initiating-window)
for observer, retry and verification limits.

```ts
import { appleAuth } from '@octane-xplat/auth'

export async function signInWithApple(backendAttemptNonce: string) {
	const result = await appleAuth.signIn({ scopes: ['email'], nonce: backendAttemptNonce })
	if (result.status === 'cancelled') console.log('Apple sign-in cancelled')
	return result
}
```

## Optional capabilities

Some features are not available everywhere. Check support and ask for access
before using the implementation. `getPermissions` reads the current state
without prompting; `requestPermissions` may show the platform prompt:

```ts
import { permissions } from '@octane-xplat/platform'

const result = await permissions.requestPermissions('camera')
if (result.granted) console.log('start camera')
else console.log(`camera unavailable: ${result.status}`) // 'denied' | 'undetermined' | 'unsupported'
```

Your screen should show a useful fallback when a capability is unavailable or
the user declines it.

## Local database

Use SQLite for structured records you edit and query. The
[local storage guide](../app/local-storage.md) builds a complete saved packing
list with migrations, reactive UI, close/reopen checks and visible persistence
failures. Ordinary settings and secrets have separate storage owners.

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

if (supported) {
	const db = await openDatabase('app.db')
	try { console.log(db.persistent ? 'Durable local storage' : 'Session-only storage') }
	finally { await db.close() }
}
```

## Interface shapes

The shared contracts are deliberately small and platform-neutral — services
expose their methods directly, optional capabilities add `supported`,
`isAvailable()`, and a `getPermissions()`/`requestPermissions()` pair, and
calling a method on an absent capability rejects `UnavailabilityError`.
Exact signatures live in the owning package: `ConnectivityImpl` in
`@octane-xplat/platform`, `GeolocationImpl` in `@octane-xplat/geolocation`, and
`MediaImpl` in `@octane-xplat/media`. For example,
`connectivity.getState()` returns `{ online, type }` where `type` is
`'none' | 'wifi' | 'mobile' | 'ethernet' | 'bluetooth' | 'vpn' | 'unknown'`.

```ts
import { connectivity } from '@octane-xplat/platform'

console.log(connectivity.getState().online)
const unsubscribe = connectivity.subscribe((state) => console.log(state.online, state.type))
// Call when the subscribing owner ends:
unsubscribe()
```

### AppKit route updates

Use a subscription for a native macOS network-status label. It receives an
initial sample and subsequent route changes; keep its cleanup function with the
screen owner. While subscribed, `getState()` reuses the latest monitored sample.
Without a subscriber, a native read can wait up to one second for its first
sample. Unknown status is not measured offline, and an available route does not
guarantee internet access or a successful request:

```ts
import { connectivity } from '@octane-xplat/platform'

export function watchRoute(showStatus: (text: string) => void): () => void {
	return connectivity.subscribe((state) => {
		showStatus(state.supported === false ? 'Network status unknown'
			: state.online ? `Route available: ${state.type}` : 'No usable route')
	})
}
// A screen calls watchRoute when mounted and its returned cleanup on unmount.
```

The AppKit service gives registrations independent lifetimes. An exception from
the initial callback releases that registration and reaches its caller; an
exception during later native delivery cannot block other subscribers. The
service retires its last monitor before native cleanup, even when cleanup fails.
These are source contracts; physical disconnect/reconnect, callback delivery,
native monitor memory and installed-app behavior remain unqualified.

## Keep platform code at the edge

Do not import `navigator`, `document`, NativeScript classes, or OS-specific
plugins into a shared screen. If the service does not exist yet, add its
shared contract and web/native leaves rather than adding a one-off conditional.

See the [platform notes](../../.agents/docs/notes/platform-notes.md) for the complete capability map,
accessibility mapping, and native typing details.

## Read an HTTP response before it finishes

Use the optional network leaf when a server sends response bytes over time.
NativeScript's default fetch buffers responses. The network API keeps global
fetch unchanged and has a smaller, explicit request contract; see the
[network guide](../../packages/network/README.md) for request limits,
cancellation, decoder requirements, and target qualification.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try { console.log((await reader.read()).value?.byteLength) }
finally { await reader.cancel(); reader.releaseLock() }
```

## Desktop webview host protocol

A `.web` frontend can run in a browser or a system webview. In a desktop
webview, framework leaves and app-defined services use the same typed host
channel for calls, replies, events, and capability discovery. The protocol
types are shared between the frontend and the native JavaScript host; they are
compile-time contracts, with no runtime schema validator.

```ts
import { desktopHost } from '@octane-xplat/platform/host/web'

const host = desktopHost()
if (host && (await host.supports('clipboard', 'write'))) {
	await host.clipboard.write('Hello from the webview')
}
```

Extend the framework service and event maps with app-owned entries:

```ts
import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

interface InvoiceServices extends FrameworkHostServices {
	invoices: {
		load(id: string): Promise<{ id: string; total: number } | null>
	}
}

interface InvoiceEvents extends FrameworkHostEvents {
	'invoices.changed': { id: string }
}
```

The frontend uses `createHostClient<InvoiceServices, InvoiceEvents>()`; the
host registers the same `InvoiceServices` methods with
`createHostDispatcher<InvoiceServices, InvoiceEvents>()`. `client.call()`
infers arguments and replies, `client.on()` infers event payloads, and
`client.capabilities()` reports the methods registered by that host. Calls
and events carry JSON messages; keep service results and event payloads
serializable. Capability discovery describes availability; it does not
replace handling a failed service call.

```ts
// Continue with InvoiceServices and InvoiceEvents above.
import {
	createHostClient,
	createHostDispatcher,
	type HostTransport,
	type HostReplyPort,
} from '@octane-xplat/platform/host'

// The webview adapter supplies transport and port; the host supplies services.
export function frontend(transport: HostTransport) {
	const client = createHostClient<InvoiceServices, InvoiceEvents>(transport)
	const off = client.on('invoices.changed', (event) => console.log(event.id))

	return {
		load: (id: string) => client.call('invoices', 'load', id),
		capabilities: () => client.capabilities(),
		dispose: () => {
			off()
			client.dispose()
		},
	}
}

export function host(services: InvoiceServices, port: HostReplyPort) {
	const dispatcher = createHostDispatcher<InvoiceServices, InvoiceEvents>(services, port)
	dispatcher.emit('invoices.changed', { id: 'invoice-42' })

	return dispatcher // adapter forwards incoming JSON to dispatcher.dispatch(message)
}
```

`@octane-xplat/platform/host/web` exposes `desktopHost()`, a typed facade for
framework-owned services. It returns `null` outside a desktop webview:

```ts
import { desktopHost } from '@octane-xplat/platform/host/web'

const host = desktopHost()
if (host && (await host.supports('secureStorage', 'set'))) {
	await host.secureStorage.set('preferred-language', 'es')
}
```

The framework map covers `app`, `clipboard`, `files`, `notifications`,
`secureStorage`, `appearance`, `windows`, `system`, and `storage`; events cover
app state, window resize, incoming links, appearance, and window closure. The
host injects bootstrap app info, app state, window size, initial URL, and color
scheme before application code runs. Public platform leaves use this facade or
the typed client. Clipboard, app info, lifecycle, window size, deep links,
outbound links, sharing, files, notifications, secure storage, and color scheme
keep their browser fallbacks outside a desktop host. The synchronous `storage`
API remains `localStorage` on `.web` — its `flush()` stays a no-op — and apps
needing host persistence can call `desktopHost().storage` directly.

```ts
import { storage } from '@octane-xplat/platform'
import { desktopHost, desktopHostBootstrap } from '@octane-xplat/platform/host/web'

storage.setString('last-screen', 'trips') // browser storage
const host = desktopHost()
if (host) await host.storage.set('last-screen', 'trips') // asynchronous host storage
console.log(desktopHostBootstrap()?.windowSize)
```

A macOS WKWebView uses NativeScript in the JavaScriptCore host to implement
native services; Linux keeps its GJS adapter on the same protocol. A standalone
Windows WebView2 host maps the same service names through WebMessage. This
shares the service contract without requiring the mediator runtimes to match. A
future CEF frontend would standardize the web engine, not the host-side
JavaScript runtime (Annotation 2).
