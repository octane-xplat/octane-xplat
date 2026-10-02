# Using device features

> Save a setting, attach a photo, share a link, or use another device feature.

A **service** lets your code use a feature without drawing a screen itself.
For example, a storage service remembers a setting and a sharing service
opens the device's share options. Some features need permission or are not
available on every platform. Check those results and explain them in the app.

## Choose a useful feature

Give your agent an outcome with a fallback: “Let me attach a photo to a trip
item; explain when capture is unavailable.” Use the shared `media` service
for still capture; a live [camera preview](primitives.md#when-a-screen-needs-more) is a
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
consult the [target guide](spec.md#choose-your-targets) and
[known limits](known-limits.md). Sharing is available on macOS through the
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

Other services cover permissions, clipboard, haptics, files, media
picking, notifications, safe-area insets, screen size, and app lifecycle.
A **leaf package** is an add-on installed separately for a feature. Features
that need a NativeScript plugin live in these packages: `@octane-xplat/share` (`share.text`, `share.url`),
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
[maintained example](../examples/accessibility/announce-status.ts) updates the
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
API remains `localStorage` on `.web`; apps needing host persistence can call
`desktopHost().storage` directly.

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

## Capability map

| Service                             | Shared shape                                                                                 | Platform notes                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geolocation`                       | `getCurrentPosition(options)`                                                                | `@octane-xplat/geolocation` leaf                                                                                                                                                     |
| `connectivity`                      | `getState()` + `subscribe(listener)`                                                         | web also exposes connection type where `navigator.connection` exists                                                                                                                 |
| `appInfo`                           | `{ supported, version, build, bundleId }`                                                    | `supported: false` on web — a browser bundle has no trustworthy app identity                                                                                                         |
| `openUrl(url)`                      | returns whether an outbound-link request was accepted                                        | a WKWebView sends the request asynchronously; this synchronous API cannot return the host's eventual result                                                                          |
| `openSettings`                      | capability; `open()`                                                                         | unsupported on web                                                                                                                                                                   |
| `media.pickImage()`, `pickImages()` | pick existing image(s)                                                                       | `@octane-xplat/media` leaf                                                                                                                                                           |
| `media.capturePhoto()`              | still capture through the OS camera UI                                                       | `@octane-xplat/media` leaf; web uses `<input type="file" capture>` — a real camera flow on phones, a file-picker fallback on desktops                                                |
| `webAuthn`                          | `isAvailable()`, `create(options)`, `get(options)` — raw WebAuthn over the RP's JSON options | web only; native reports `supported: false` — use `authSession`                                                                                                                      |
| `authSession`                       | `open(url, { callbackScheme })` — hosted web ceremony in a system browser                    | iOS/macOS ASWebAuthenticationSession, Android Custom Tab + deep-link return; unsupported on web                                                                                      |
| `@octane-xplat/sqlite`              | `openDatabase(name)` → async `execute`/`select`/`get`/`transaction`/`userVersion`            | own leaf, not a platform service; web persists via an OPFS worker, macOS binds system libsqlite3 through host metadata interop (`db.persistent` reports); Windows `supported: false` |

`media` owns the `camera` and `photos` permission requests for still capture
and image picking. Live-preview permission belongs to `@octane-xplat/camera`,
which requests it when `CameraView` starts. `permissions.ensure(kind)`
delegates to the owning service for notifications, media, and location rather
than maintaining a second set of probes. On web, `ensure('camera')` reads the
permission without ever opening a prompt — a state that would require asking
the user reports `unsupported`, and `denied` stays `denied`; starting
`CameraView` instead uses `getUserMedia` to request access for the preview.

```ts
import { media } from '@octane-xplat/media'

// Run capture from a user action even if the browser cannot query permission.
export async function webCapture() {
	const status = await media.ensure('camera')
	if (status === 'denied') return null
	return media.capturePhoto()
}
```

```ts
import { permissions } from '@octane-xplat/platform'
import { media } from '@octane-xplat/media'

console.log(await media.ensure('photos'))
console.log(await permissions.ensure('camera')) // web: reads permission without prompting
```

`files.writeText(name, text)` writes a file on native. On web, it starts a
browser download with the requested name and returns a `FileRef` for the
download's object URL; it does not write to a local filesystem path.

```ts
import { files } from '@octane-xplat/files'

const file = await files.writeText('packing.txt', 'Passport\nCharger')
if (file) console.log(file.name) // web: a download, not a persistent file path
```

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
else console.log('Share flow opened')
```

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

## Pick and capture images

Install `@octane-xplat/media`; it owns the NativeScript camera/image-picker
plugins. Import `media` from that leaf. Add app-specific
`NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to iOS
`Info.plist`; gallery saving also needs `NSPhotoLibraryAddUsageDescription`.
Android camera permission and the FileProvider are merged from the camera
plugin. Do not add another image-picker pod declaration to the app Podfile.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

const permission = await media.ensure('camera')
if (permission === 'granted') {
	const image = await media.capturePhoto({ saveToGallery: false })
	if (image) {
		try {
			// Upload before releasing the temporary reference.
			const response = await fetch('/api/photos', { method: 'POST', body: image.dataUrl })
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
failure. `ensure('camera')` distinguishes permission/availability before capture;
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
			return images.map((image) => image.dataUrl)
		} finally {
			for (const image of images) files.release(image)
		}
	} catch {
		console.log('Could not read the selection')
		return []
	}
}
```

On web, `ensure('camera')` only queries browser permission; it does not request
access. A `prompt` state or unavailable Permissions API reports `unsupported`,
but the file-input capture flow can still be offered from a user action.
Desktop browsers may open a file picker instead of a camera. Successful picks
produce an opaque preview URI plus an upload data URL; neither is a persistent
storage guarantee.

Check denial and cancellation on a fresh test app without resetting an existing
app's permissions or data. Then capture once after an already-granted permission,
confirm a non-null result, release it, and verify the app-created preview is gone.
The [nonvisual browser probe](../apps/web/scripts/optional-services.mjs) uses a
synthetic file-input payload and never renders or inspects an image. The
[cleanup tests](../packages/media/tests/cleanup.test.mjs) inject read/conversion
failures; they do not qualify camera hardware or native permission dialogs.

## Passkeys and auth ceremonies

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
		const credential = await webAuthn.impl?.get(options)
		// post credential to the RP's verify endpoint
	} else if (authSession.supported) {
		const result = await authSession.impl?.open(signInUrl, { callbackScheme: 'myapp' })
		if (result?.type === 'success') {
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
runtime verification remains pending.

```ts
import { authSession } from '@octane-xplat/platform'

export async function hostedSignIn(url: string) {
	const result = await authSession.impl?.open(url, { callbackScheme: 'sample' })
	if (!result) return 'unavailable'
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
const result = await authSession.impl?.open('https://example.com/authorize', {
	callbackScheme: 'sample',
	prefersEphemeralSession: true,
})
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
every attempt. After `authSession.impl.open` returns `success`, send the URL to
your backend for validation and redemption; receiving a URL on the requested
scheme does not authenticate the user. The maintained
[server exchange example](../examples/auth/README.md) rejects wrong callback
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
	const result = await authSession.impl?.open(url, { callbackScheme: 'sample' })
	if (result?.type === 'success') await redeem(attempt, result.url)
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
4. On web, expect `authSession.supported === false` and `impl === null`; use
   `webAuthn` or ordinary navigation. Catch web credential rejection and handle
   a null credential before posting to your RP.

`node --test packages/platform/tests/auth-session.test.mjs` exercises adapter
callback/cancel/error behavior with mocked NativeScript APIs. It does not qualify
system-browser behavior or a real relying-party exchange on iOS/Android.
Incoming-link routing after authentication belongs to the
[incoming-links recipe](../recipes/incoming-links.md).

### Provider SDK sign-in (Apple / Google)

Use the [maintained server exchange boundary](../examples/auth/README.md) to
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
`xplat.targets.macos.package.entitlements`; see [macOS packaging](toolchain.md#experimental-appkit-target).
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

Copy [google-hosted.macos.ts](../examples/auth/google-hosted.macos.ts) into
`auth/` beside your startup directory, and implement its `GoogleHostedBackend`:
`begin(options)` returns `{ attemptId, url, callbackScheme }` for a fresh stored
attempt; `complete({ attemptId, callbackURL })` returns the server-verified Google
`AuthCredential`; `signOut()` ends your app session. The adapter passes configured
client IDs, scopes, hosted domain, and the per-call nonce to `begin`. Your backend
must bind them to the attempt, check the exact callback host/path and state,
redeem the code once, and verify Google's signature, issuer, audience, expiry,
nonce, and hosted domain when restricted. Expire cancelled/unused attempts.
A callback URL by itself does not authenticate a user. The existing
[server boundary example](../examples/auth/README.md) explains these checks;
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

For a few settings, use `storage`. For structured records you need to search,
such as saved trips and their packing items, use a **database**. SQLite stores
those records in tables, and SQL is the language used to read and change them.
This section assumes you know basic SQL or are working with an agent that
can help create the tables and queries.

Install `@octane-xplat/sqlite` separately. It provides the same asynchronous
API on web and native: calls use `await` because they can take time to finish.
The following fragment creates a table and reads its rows:

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

const db = await openDatabase('app.db')
await db.execute('CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)')
const rows = await db.select<{ id: number; name: string }>('SELECT * FROM items')
await db.transaction(async (db) => {
	await db.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
	// A throw here rolls back the insert.
})
await db.close()
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

```ts
import { openDatabase, supported } from '@octane-xplat/sqlite'

if (supported) {
	const db = await openDatabase('app.db')
	try {
		if (!db.persistent) console.log('Changes will not survive closing this session')
	} finally {
		await db.close()
	}
}
```

`getUserVersion`/`setUserVersion` map to `PRAGMA user_version` — the shared
migration hook. `deleteDatabase(name)` removes the file. On native, calls
run on the plugin's worker threads (`threading` option, default on); on web
everything runs inside a spawned Worker, so no query blocks the UI thread
either way.

```ts
import { openDatabase } from '@octane-xplat/sqlite'

const db = await openDatabase('app.db', { threading: true })
try {
	if ((await db.getUserVersion()) < 1) {
		await db.transaction(async (tx) => {
			await tx.execute('CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)')
			await tx.setUserVersion(1)
		})
	}
} finally {
	await db.close()
}
// deleteDatabase('app.db') is for deliberate app-data removal, not normal cleanup.
```

For a handful of flags or strings, `storage` is still the right tool —
open a database when you need queries, joins, or migrations.

## Interface shapes

The shared contracts are deliberately small and platform-neutral — each
optional service may expose a `Capability` object (`supported`, `ensure`,
`impl`), while direct services such as `storage` and `connectivity` expose
methods directly. Exact signatures live in the owning package: `ConnectivityImpl` in
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

## Keep platform code at the edge

Do not import `navigator`, `document`, NativeScript classes, or OS-specific
plugins into a shared screen. If the service does not exist yet, add its
shared contract and web/native leaves rather than adding a one-off conditional.

See the [platform notes](platform-notes.md) for the complete capability map,
accessibility mapping, and native typing details.
