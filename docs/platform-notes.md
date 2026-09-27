# Platform-service notes (`packages/platform`)

> Detailed record of everything non-visual that differs between targets. Pattern is uniform:
> interface in a shared `.ts`, implementation resolved by suffix
> (`*.web.ts` / `*.native.ts`, or `*.ios`/`.android` when they diverge).
> Consumers `import { … } from 'platform/storage'` — never the impl file.
>
> **Owns:** #6 platform services surface · **Status:** surface enumerated ·
> **Blocks on:** Q15, Q18, Q19 · **Decisions:** #11 · **Validated by:**
> `useColorScheme` + `storage` + `useSafeAreaInsets` working on both targets.

## Capability map

| Capability             | Web impl                                                | Native impl                                                                             | Seam notes                                                                                                                        |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Platform.OS`/`select` | `'web'`                                                 | `'ios'`/`'android'`                                                                     | `isNative` const exported from `@octane-xplat/ui` (value-level split, build-time eliminated); OS-level divergence stays in `.ios`/`.android` leaves |
| kv storage             | `localStorage`                                          | `ApplicationSettings` / `@nativescript/preferences`                                     | sync API both sides — keep interface sync                                                                                         |
| secure storage         | `crypto.subtle` + IndexedDB-ish (or just "unsupported") | Keychain/Keystore plugin                                                                | mark optional-capability                                                                                                          |
| files                  | OPFS/download URLs                                      | `knownFolders`, `File`, `@nativescript-community/ui-document-picker`                    | paths don't transfer; keep opaque `FileRef`; Android SAF reads `content://` through `ContentResolver`                             |
| network                | `fetch`, `WebSocket`                                    | `fetch`, `WebSocket` (exist natively)                                                   | shared directly — no wrapper needed                                                                                               |
| haptics                | no-op (or `navigator.vibrate`)                          | `Haptics`/TapticEngine+`Vibrator`                                                       |                                                                                                                                   |
| share                  | `navigator.share`/`clipboard`                           | native share sheet (`SocialShare` plugin)                                               |                                                                                                                                   |
| clipboard              | `navigator.clipboard`                                   | `Utils.copyToClipboard` + `ClipboardManager`/`UIPasteboard` via core                    | permission model differs                                                                                                          |
| notifications          | Notification API / push                                 | local+push plugins, APNs/FCM setup                                                      | big platform gap; per-platform UX anyway                                                                                          |
| permissions            | implicit/feature-detect                                 | runtime permission flows                                                                | model as async `ensure(capability)`                                                                                               |
| device info            | UA/`navigator`                                          | `Device` (os, version, type, region)                                                    |                                                                                                                                   |
| screen/orientation     | `matchMedia`, `resize`                                  | `Screen.mainScreen`, `orientationChanged`, `matchMedia`                                 | `useWindowSize` shared hook                                                                                                       |
| safe area              | `env(safe-area-inset-*)`                                | `iosOverflowSafeArea`, system insets                                                    | `useSafeAreaInsets()` — also primitives/SafeArea                                                                                  |
| appearance             | `prefers-color-scheme` + class toggle                   | `systemAppearanceChanged` + `ns-dark`                                                   | `useColorScheme()` shared                                                                                                         |
| app lifecycle          | `visibilitychange`, `beforeunload`                      | `Application` `suspend`/`resume`/`exit`, `activityBackPressed`                          | `useAppState()`; back button → navigation.md                                                                                      |
| status/nav bars        | theme-color for color; status-bar style is unavailable  | `statusBarStyle` view prop → window appearance flags, Android nav bar color             | native-only style API; web `setStatusBarStyle` intentionally no-ops; ui theme leaf auto-syncs icon appearance to effective scheme |
| icons/fonts            | inline SVG, `@font-face`                                | `svgview` (ui-svg → SVGKit/androidsvg), font fallback, `App_Resources` fonts            | `Icon` owns mapping; `Image` routes svg srcs to `svgview`                                                                         |
| accessibility          | ARIA attrs                                              | `accessible`, `accessibilityLabel/Hint/Value/Role`, `accessibilityLiveRegion`, announce | shared prop names map near-1:1 — keep a11y props on primitives                                                                    |
| i18n/locale            | `navigator.language`, Intl                              | `Device.language`, Intl                                                                 | i18next binding is DOM-free — shared                                                                                              |
| images/media           | `<input type=file>`, canvas                             | imagepicker/camera plugins, `ImageSource`                                               | `media.pickImage()`/`capturePhoto()` return `PickedImage` (preview URI + data URL); call `files.release()` when done              |
| biometrics             | unsupported by this seam; WebAuthn needs an RP ceremony | Keychain biometrics plugin                                                              | optional-capability; use the app's WebAuthn auth flow directly on web                                                             |
| deep links             | URL is the link                                         | `Application` openUrl/continuation                                                      | feeds navigation route table                                                                                                      |

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

```ts
// Optional capability — never throws for absence
interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	impl: T | null // usable iff supported && ensured
}

// App lifecycle — shared event vocabulary
type AppState = 'active' | 'background' | 'inactive'
function useAppState(): AppState // visibilitychange/pagehide/pageshow
// ↔ Application suspend/resume/exit
// Hardware back → owned by ui's route layer, which auto-installs
// activityBackPressed at screen/stack registration and pops the visible
// stack. This hook is the raw seam (fires after ui's listener — use
// ui's useBackInterceptor/addBackInterceptor to run before the pop):
function useBackHandler(fn: () => boolean /* handled? */): void
// activityBackPressed; no-op on web (browser back is URL history)

// Theme
function useColorScheme(): 'light' | 'dark'
function setColorSchemeOverride(c: 'light' | 'dark' | 'system'): void
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
  `supported: false`; product auth flows should call WebAuthn directly.
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
  that's the point of the boundary. Keep third-party plugin calls _only_
  inside `*.native.*` files.
- Plugin views that are UI (drawer, menu, input-accessory) are **not** here —
  they're `registerElement`'d leaf primitives in `packages/ui`. This package is
  headless capabilities only.

## Haptics, UI sounds, and media playback

These are separate optional capabilities, not additions to `@octane-xplat/ui`
or the existing basic haptics service. Keep the basic impact/notification/
selection wrapper stable. The spike lives in `packages/media-probe`; none of
its experimental APIs are shipped.

| Capability | Web evidence | iOS evidence | Android evidence |
| --- | --- | --- | --- |
| Advanced haptics | Browser leaf builds with `navigator.vibrate`; this API is unavailable in iOS Safari and remains best-effort elsewhere. Pulsar's web package was not resolvable from its installed npm distribution (no JS entry files). | Pulsar 1.4.0 Swift package and a NativeScript `NativeSource` bridge were configured, but `ns build ios` stopped in CocoaPods on conflicting `QBImagePickerController` pod sources before Pulsar could compile. | Pulsar 1.3.0 advertises presets, pattern composition, and realtime control; app builds with compile SDK 36, but NativeScript produced an empty probe AAR for the Kotlin bridge. Runtime calls therefore fail. No physical device was available to verify actuation. |
| UI sounds | Web Audio oscillator probe builds; playback still requires a user gesture on autoplay-restricted browsers. | Not run: native preparation is blocked by the existing pod-source conflict. | `@nativescript/audio-context` 1.3.3 is discovered transitively and the harness APK builds at compile SDK 36 (the app's current value is 35). API calls and overlap were exercised, but audio output was not independently observable in this headless emulator. Package size is 8.06 MB unpacked. |
| Full player | Browser `Audio` probe builds; queue/background/system controls are not implemented. | `@nativescript-community/audio` 6.4.11 advertises AVAudioPlayer-based foreground controls; the native app build was blocked before runtime validation. | The same package advertises MediaPlayer-based foreground controls. The remote-source probe stayed in loading and Android logged `MediaPlayer Error (-38, 0)`; no queue, MediaSession/lock-screen controls, or background service were verified. |

**Recommendation — provisional.** Keep three optional leaf packages:
`@octane-xplat/haptics`, `@octane-xplat/sounds`, and `@octane-xplat/audio`.
This isolates native dependencies and their build costs from `ui`. The haptics
package should own a Pulsar adapter if a maintained NativeScript integration
cannot match its presets, timed patterns, realtime control, cancellation, and
capability reporting. The UI-sound leaf can wrap Web Audio on web and
`@nativescript/audio-context` on native, subject to accepting or removing the
compile-SDK-36 requirement. Keep audio simulation opt-in.

The full-player package needs an owned plugin implementation around Android
Media3 `MediaSessionService` and iOS AVPlayer plus Now Playing/remote commands.
`@nativescript-community/audio` is a possible foreground backend, but does not
meet the requested background queue and lock-screen contract. Do not model a
full player as a thin wrapper over that package until those system integrations
exist.

Pulsar currently ships iOS as a Swift package and Android as a Maven artifact;
the NativeScript spike needed app-level SPM/Swift-source configuration for iOS
and could not package its Kotlin source into the plugin AAR. A production leaf
must make those dependencies arrive through the package's NativeScript
integration or an install-time config hook, so apps do not maintain a second,
manual native dependency list. Pulsar's Android API uses API 24+ generally;
its documented envelope/frequency support is API 36+, so capability reporting
must describe device support instead of promising the same effect everywhere.

Proposed contracts stay capability-oriented and asynchronous:

- `haptics.capabilities()`, `playPreset(name)`, `playPattern(pattern)`,
  `startRealtime()`, `updateRealtime({ intensity, sharpness })`, and `stop()`.
  Reports describe support; they do not promise identical tactile output.
- `sounds.preload(id, source)`, `play(id, { volume })`, and `stop(id?)`.
  Bound concurrent voices and release decoded/native resources on dispose.
- `audio.createPlayer({ source, queue?, metadata? })` returns a player with
  play/pause/seek/next, observable state/progress, and dispose. Background
  mode and system controls are explicit capabilities, not assumed on web.

The audio package owns focus/session policy for long-form playback. Short UI
effects use a transient mix/duck policy and must not change the media route,
replace its session, or stop it. Web sound playback must expose its
user-gesture unlock state. Remaining ship gates are a NativeScript-compatible
Pulsar bridge on both mobile platforms, physical-device haptic evidence, local
and remote media tests, queue/background/lock-screen/interruption tests, and
sound/media coexistence tests. This spike does not complete those gates.

The existing [video-playback recipe](../recipes/video-playback.md) covers
hosted video only. When an audio player becomes public, add a separate audio
playback recipe for source loading, controls, background behavior, and system
media controls; keep sound-effect and advanced-haptics workflows separate if
they become supported app-facing tasks.

Candidate references: [Pulsar Android](https://docs.swmansion.com/pulsar/sdk/android/),
[Pulsar iOS](https://docs.swmansion.com/pulsar/sdk/ios/),
[`@nativescript/audio-context`](https://github.com/NativeScript/audio-context),
[`@nativescript-community/audio`](https://github.com/nativescript-community/audio),
[Android background playback](https://developer.android.com/media/media3/session/background-playback),
and [AVPlayer](https://developer.apple.com/documentation/avfoundation/avplayer).

## Two typing gotchas

> [!IMPORTANT]
> `references.d.ts`/`@nativescript/types` give native API typings
> (objc/java-ish globals). Scope them to `*.native.*` files via the native
> tsconfig only — never let UIKit types leak into shared typecheck.

> [!IMPORTANT]
> `platform` interfaces should be defined in `.ts` (no hooks at the interface
> layer); hook-shaped accessors (`useSafeAreaInsets`) live in `.tsx` wrappers
> inside the renderer glob.
