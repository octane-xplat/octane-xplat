# Platform-service notes (`packages/platform`)

> Detailed record of everything non-visual that differs between targets. Pattern is uniform:
> interface in a shared `.ts`; the unsuffixed module is the native default, `.web`
> is the browser override, `.mobile` is shared by iOS/Android, and OS suffixes
> such as `.ios`/`.android` specialize a single platform.
> Consumers `import { … } from 'platform/storage'` — never the impl file.
>
> **Owns:** #6 platform services surface · **Status:** surface enumerated ·
> **Blocks on:** Q15, Q18, Q19 · **Decisions:** #11 · **Validated by:**
> `useColorScheme` + `storage` + `useSafeAreaInsets` working on both targets.

The table mixes original candidate backends with implementation findings.
Use [device services](../platform/platform-services.md) and [known limits](../verify/known-limits.md)
for current support. In particular, web secure storage is unsupported, web
notifications are local-only, and there is no shared `Platform.select` API.
The interface sketches below illustrate the design and are not a substitute
for the published declarations.

```tsx
import { storage, useAppState, useSafeAreaInsets } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

storage.setString('last-trip', '42')
export function Status() {
	const state = useAppState()
	const insets = useSafeAreaInsets()
	return <Text style={{ marginTop: insets.top }}>{state}</Text>
}
```

## Capability map

| Capability             | Web impl                                                | Native impl                                                                              | Seam notes                                                                                                                                          |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Platform.OS`/`select` | `'web'`                                                 | `'ios'`/`'android'`                                                                      | `isNative` const exported from `@octane-xplat/ui` (value-level split, build-time eliminated); OS-level divergence stays in `.ios`/`.android` leaves |
| kv storage             | `localStorage`                                          | `ApplicationSettings` / `@nativescript/preferences`                                      | sync API both sides — keep interface sync                                                                                                           |
| secure storage         | `crypto.subtle` + IndexedDB-ish (or just "unsupported") | Keychain/Keystore plugin                                                                 | `@octane-xplat/secure-storage` leaf (#72)                                                                                                           |
| files                  | OPFS/download URLs                                      | `knownFolders`, `File`, `@nativescript-community/ui-document-picker`                     | `@octane-xplat/files` leaf (#72); paths don't transfer; keep opaque `FileRef`; Android SAF reads `content://` through `ContentResolver`             |
| network                | `fetch`, `WebSocket`                                    | `fetch`, `WebSocket` (exist natively)                                                    | shared directly — no wrapper needed                                                                                                                 |
| haptics                | no-op (or `navigator.vibrate`)                          | Pulsar bridge (the `@octane-xplat/haptics` leaf engine)                                  | `haptics` service export in the `@octane-xplat/haptics` leaf (#72)                                                                                  |
| share                  | `navigator.share`/`clipboard`                           | native share sheet (`SocialShare` plugin); macOS AppKit share picker via the host bridge | `@octane-xplat/share` leaf — moved out of `platform` (#72)                                                                                          |
| clipboard              | `navigator.clipboard`                                   | `Utils.copyToClipboard` + `ClipboardManager`/`UIPasteboard` via core                     | permission model differs                                                                                                                            |
| notifications          | Notification API / push                                 | local+push plugins, APNs/FCM setup                                                       | `@octane-xplat/notifications` leaf for local delivery (#72); push stays app-level                                                                   |
| permissions            | implicit/feature-detect                                 | runtime permission flows                                                                 | `permissions.ensure(kind)` dispatches to owners registered by the leaves via `__xplatPermissionOwners` (#72)                                        |
| device info            | UA/`navigator`                                          | `Device` (os, version, type, region)                                                     | geolocation lives in the `@octane-xplat/geolocation` leaf (#72)                                                                                     |
| screen/orientation     | `matchMedia`, `resize`                                  | `Screen.mainScreen`, `orientationChanged`, `matchMedia`                                  | `useWindowSize` shared hook                                                                                                                         |
| safe area              | `env(safe-area-inset-*)`                                | `iosOverflowSafeArea`, system insets                                                     | `useSafeAreaInsets()` — also primitives/SafeArea                                                                                                    |
| appearance             | `prefers-color-scheme` + class toggle                   | `systemAppearanceChanged` + `ns-dark`                                                    | `useColorScheme()` shared                                                                                                                           |
| app lifecycle          | `visibilitychange`, `beforeunload`                      | `Application` `suspend`/`resume`/`exit`, `activityBackPressed`                           | `useAppState()`; back button → navigation.md                                                                                                        |
| status/nav bars        | theme-color for color; status-bar style is unavailable  | `statusBarStyle` view prop → window appearance flags, Android nav bar color              | native-only style API; web `setStatusBarStyle` intentionally no-ops; ui theme leaf auto-syncs icon appearance to effective scheme                   |
| icons/fonts            | inline SVG, `@font-face`                                | `svgview` (vendored ui-svg → SVGKit/androidsvg), font fallback, `App_Resources` fonts    | `Icon` owns mapping; `Image` routes svg srcs to `svgview`                                                                                           |
| accessibility          | ARIA attrs                                              | `accessible`, `accessibilityLabel/Hint/Value/Role`, `accessibilityLiveRegion`, announce  | shared prop names map near-1:1 — keep a11y props on primitives                                                                                      |
| i18n/locale            | `navigator.language`, Intl                              | `Device.language`, Intl                                                                  | i18next binding is DOM-free — shared                                                                                                                |
| images/media           | `<input type=file>`, canvas                             | imagepicker/camera plugins, `ImageSource`                                                | `@octane-xplat/media` leaf (#72): `media.pickImage()`/`capturePhoto()` return `PickedImage` (preview URI + data URL)                                |
| biometrics             | unsupported by this seam; local-presence only           | Keychain biometrics plugin                                                               | `@octane-xplat/biometrics` leaf (#72); RP ceremonies go through `webAuthn` (web) / `authSession` (native)                                           |
| passkeys/auth          | `navigator.credentials` create/get                      | ASWebAuthenticationSession hosted ceremony; Android: Custom Tab + deep-link return       | `webAuthn` for raw ceremonies on web, `authSession` for the hosted ceremony on native (decision #66)                                                |
| deep links             | URL is the link                                         | `Application` openUrl/continuation                                                       | feeds navigation route table                                                                                                                        |

## Interface shapes (the repeating contracts)

### A11y prop map (shared prop → leaf attrs)

| Shared prop               | Web                                                            | Native                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessible`              | `aria-hidden={!v}` inverse                                     | `accessible` (marks element as a11y node)                                                                                                                                                                                          |
| `accessibilityLabel`      | `aria-label`                                                   | `accessibilityLabel`                                                                                                                                                                                                               |
| `accessibilityHint`       | `aria-description`                                             | `accessibilityHint`                                                                                                                                                                                                                |
| `accessibilityValue`      | `aria-valuetext`/`aria-valuenow`                               | `accessibilityValue`                                                                                                                                                                                                               |
| `accessibilityRole`       | `role` (ARIA)                                                  | `accessibilityRole` — shared roles map to NS values: `heading`→`header`, `progressbar`→`progressBar`, `radio`→`radioButton`, `spinbutton`→`spinButton`, `tab`→`button` + selected state; other shared names keep their NS spelling |
| `accessibilityLiveRegion` | `aria-live`                                                    | `accessibilityLiveRegion` ('none'/'polite'/'assertive')                                                                                                                                                                            |
| `accessibilityState`      | `aria-disabled`/`aria-selected`/`aria-checked`/`aria-expanded` | NativeScript accepts one state enum; the leaf priority is disabled → selected → checked/unchecked. `busy` and `expanded` are web-only.                                                                                             |

NS roles are stringly-typed and narrower than ARIA. The shared `Role` union is
the portable set; web keeps the ARIA spelling while native translates the
exceptions above (for example shared `'heading'` → web `role="heading"` +
native `accessibilityRole="header"`).

```tsx
import { Text } from '@octane-xplat/ui'

export function Heading() {
	return (
		<Text accessibilityRole="heading" accessibilityLabel="Packing list">
			Packing list
		</Text>
	)
}
```

```ts
// Optional capability — never throws for absence
interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	impl: T | null // usable iff supported && ensured
}

// App lifecycle — shared event vocabulary
type AppState = 'active' | 'background' | 'inactive'
declare function useAppState(): AppState // visibilitychange/pagehide/pageshow
// ↔ Application suspend/resume/exit
// Hardware back → owned by ui's route layer, which auto-installs
// activityBackPressed at screen/stack registration and pops the visible
// stack. This hook is the raw seam (fires after ui's listener — use
// ui's useBackInterceptor/addBackInterceptor to run before the pop):
declare function useBackHandler(fn: () => boolean /* handled? */): void
// activityBackPressed; no-op on web (browser back is URL history)

// Theme
declare function useColorScheme(): 'light' | 'dark'
declare function setColorSchemeOverride(c: 'light' | 'dark' | 'system'): void
// toggles .ns-dark / .dark root class
```

## 2026-09-25 gap decisions

- **Files — desk-source.** `files.native.pick()` now uses
  `@nativescript-community/ui-document-picker` 1.1.29. Its upstream iOS
  implementation presents `UIDocumentPickerViewController`; its Android
  implementation uses `ACTION_OPEN_DOCUMENT` and returns the selected
  `content://` URI on current Android. The leaf keeps that URI opaque, gets
  the display name from `ContentResolver`, and reads text through
  `openInputStream`; app-document writes and temporary-file release retain
  their existing path behavior. The picker and resolver path still need an
  iOS and Android device pass (lab-experiment).
- **Web biometrics — desk-source.** `PublicKeyCredential` availability is not
  enough to implement `verify(reason)`: WebAuthn `create()`/`get()` require a
  relying-party challenge and a registered credential, and the browser owns
  the ceremony. Creating an ephemeral credential would change the contract
  and could leave a passkey behind, so this capability reports
  `supported: false`; product auth flows use `webAuthn` (web) or
  `authSession` (native).
- **Passkey/auth ceremonies — desk-source (decision #66).** The native side
  runs the ceremony on the app's real HTTPS origin in a hosted browser
  session rather than implementing ASAuthorizationController / Credential
  Manager natively: no `apple-app-site-association`/`assetlinks.json` hosting
  on the RP, and the web auth flow ships unchanged — the better-auth Expo
  `openAuthSessionAsync` precedent. `nativescript-inappbrowser` 3.3.0 and the
  community ASWebAuthenticationSession snippet show both APIs are reachable
  from TS without a plugin; core fires `activityNewIntent` with `setIntent()`
  applied, so the Android return path is `activityNewIntent` +
  `resumeEvent`→`getIntent()`. `androidx.browser` arrives via the platform
  package's `platforms/android/include.gradle`. Open: raw native ceremonies
  (the platform-authenticator leaf) for apps willing to host the
  association files; device pass pending (queued experiment).
- **Safe area — desk-source.** Android now reads system-bar insets from the
  foreground activity's root `WindowInsets`, converts pixels through
  `Screen.mainScreen.scale`, and listens for `onApplyWindowInsets` plus
  orientation/resume changes. NativeScript exposes the activity through
  `Application.android.foregroundActivity`; a device pass is still needed to
  confirm gesture-navigation, cutout, rotation, and edge-to-edge values
  (lab-experiment).

## Rules

- **No DOM globals at module scope in shared code.** Guards belong inside
  platform impls, not littered through components. Lint-enforceable
  (see testing.md).
- Optional capabilities return a capability object (`{ supported: boolean }`)
  rather than throwing — share-sheet behavior on desktop web, biometrics, etc.
- Anything async-permission-shaped gets `ensure(): Promise<'granted'|'denied'|'unsupported'>`.
- Platform impls may import `@nativescript/*` plugins or DOM APIs freely —
  that's the point of the boundary. Keep third-party plugin calls _only_ inside `.mobile` or unsuffixed
  native-default files (with web types kept separate).
- Plugin views that are UI (drawer, menu, input-accessory) are **not** here —
  they're `registerElement`'d leaf primitives in `packages/ui`. This package is
  headless capabilities only.

## Haptics, UI sounds, and media playback

These are separate optional capabilities, not additions to `@octane-xplat/ui`
or the existing basic haptics service. Keep the basic impact/notification/
selection wrapper stable. The leaf APIs live in `packages/haptics`,
`packages/sounds`, and `packages/audio`.

| Capability       | Web evidence                                                                                                           | iOS evidence                                                                                                                                                                                                                                      | Android evidence                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advanced haptics | `navigator.vibrate` is used when available; iOS Safari does not expose Web Vibration.                                  | Pulsar 1.4.0 and NativeScript Swift-source configuration are present, fresh 2026-09-30 preparation resolves Pods and Swift packages with one `QBImagePickerController` declaration. Full build and physical output remain separately unqualified. | Pulsar 1.3.0 capability lookup, preset, pattern, and realtime start/stop calls ran on the Xplat emulator without runtime exceptions. Compile SDK 36, target SDK 35; physical tactile output remains unverified.                                                                                                                    |
| UI sounds        | The package builds with preloaded HTML audio; browser autoplay can require a user gesture.                             | Fresh 2026-09-30 CocoaPods installation succeeds; native runtime validation remains pending.                                                                                                                                                      | Stable AudioContext 1.3.3 builds into the SDK 36 APK. UI sound and overlap actions ran without runtime exceptions while the Media3 session remained active. The emulator has audio output disabled, so audible overlap and route coexistence are unverified.                                                                       |
| Full player      | The package builds an `HTMLAudioElement` player with optional Media Session actions; background parity is not claimed. | AVPlayer, Now Playing metadata, remote commands, interruption observation, and audio background mode are implemented, fresh preparation succeeds; runtime behavior remains unverified.                                                            | Media3 `MediaSessionService`, queue transport, system controls, background service declarations, and audio-focus handling are implemented. Emulator playback reached `playing`/`ended`, pause and seek updated the session, and metadata was present. Background continuation and notification/headset controls remain unverified. |

**Package split — decided.** Keep the three services in optional leaf packages
so their native dependencies and build costs stay out of `ui` and the basic
`platform.haptics` service remains unchanged. Pulsar provides advanced native
haptics; Android apps compile with SDK 36 while targeting 35 and supporting
Android 24+.

`@octane-xplat/sounds` uses `@nativescript/audio-context` 1.3.3 on native and
preloaded HTML audio on web. Its native implementation decodes each effect
once and routes overlapping sources through per-voice gain nodes. Android
sound/overlap calls ran without exceptions while the player session remained
active, but emulator audio output is disabled, so audible mixing and route
preservation still need a physical device.

```ts
import { createSoundBank } from '@octane-xplat/sounds'

export async function effect(source: string) {
	const bank = createSoundBank({ maxVoices: 2 })
	await bank.load('saved', source)
	await bank.play('saved')
	return () => bank.dispose() // call when the owning screen is finished
}
```

`@octane-xplat/audio` uses a package-owned Media3 session service on Android,
AVPlayer and remote commands on iOS, and `HTMLAudioElement` plus optional
Media Session actions on web. Android player state and session metadata were
exercised on the emulator. Background continuation, notification/headset
controls, and physical audio remain unverified. The historical iOS duplicate QBImagePicker pod failure is not reproducible in
fresh preparation on 2026-09-30; this does not prove native player runtime
behavior. See [current qualification](optional-service-qualification.md).

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

export async function queue(source: string) {
	const player = createAudioPlayer()
	try {
		await player.setQueue([{ id: 'sample', source }])
		console.log(player.snapshot())
	} finally {
		player.dispose()
	}
}
```

Decision #55 assigns audio session/focus policy to the full audio service.
Effects remain bounded and must not take focus, interrupt long-form playback,
or change its route. Android effect/player session coexistence is confirmed at
the API/session level; audible mixing and route preservation remain a
physical-device test requirement. See [media services](../platform/media-services.md) for
the public API and current evidence. Separate recipes cover advanced haptics,
UI effects, and audio playback.

## Two typing gotchas

> [!IMPORTANT]
> `references.d.ts`/`@nativescript/types` give native API typings
> (objc/java-ish globals). Scope them to mobile/OS-specific or unsuffixed
> native-default files via the mobile tsconfig only — never let UIKit types leak into shared typecheck.

> [!IMPORTANT]
> `platform` interfaces should be defined in `.ts` (no hooks at the interface
> layer); hook-shaped accessors (`useSafeAreaInsets`) live in `.tsx` wrappers
> inside the renderer glob.
