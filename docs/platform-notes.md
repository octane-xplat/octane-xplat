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

| Capability             | Web impl                                                | Native impl                                                                             | Seam notes                                                                                           |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Platform.OS`/`select` | `'web'`                                                 | `'ios'`/`'android'`                                                                     | value-level split, build-time eliminated                                                             |
| kv storage             | `localStorage`                                          | `ApplicationSettings` / `@nativescript/preferences`                                     | sync API both sides — keep interface sync                                                            |
| secure storage         | `crypto.subtle` + IndexedDB-ish (or just "unsupported") | Keychain/Keystore plugin                                                                | mark optional-capability                                                                             |
| files                  | OPFS/download URLs                                      | `knownFolders`, `File`, `@nativescript-community/ui-document-picker`                    | paths don't transfer; keep opaque `FileRef`; Android SAF reads `content://` through `ContentResolver` |
| network                | `fetch`, `WebSocket`                                    | `fetch`, `WebSocket` (exist natively)                                                   | shared directly — no wrapper needed                                                                  |
| haptics                | no-op (or `navigator.vibrate`)                          | `Haptics`/TapticEngine+`Vibrator`                                                       |                                                                                                      |
| share                  | `navigator.share`/`clipboard`                           | native share sheet (`SocialShare` plugin)                                               |                                                                                                      |
| clipboard              | `navigator.clipboard`                                   | `Clipboard`/plugin                                                                      | permission model differs                                                                             |
| notifications          | Notification API / push                                 | local+push plugins, APNs/FCM setup                                                      | big platform gap; per-platform UX anyway                                                             |
| permissions            | implicit/feature-detect                                 | runtime permission flows                                                                | model as async `ensure(capability)`                                                                  |
| device info            | UA/`navigator`                                          | `Device` (os, version, type, region)                                                    |                                                                                                      |
| screen/orientation     | `matchMedia`, `resize`                                  | `Screen.mainScreen`, `orientationChanged`, `matchMedia`                                 | `useWindowSize` shared hook                                                                          |
| safe area              | `env(safe-area-inset-*)`                                | `iosOverflowSafeArea`, system insets                                                    | `useSafeAreaInsets()` — also primitives/SafeArea                                                     |
| appearance             | `prefers-color-scheme` + class toggle                   | `systemAppearanceChanged` + `ns-dark`                                                   | `useColorScheme()` shared                                                                            |
| app lifecycle          | `visibilitychange`, `beforeunload`                      | `Application` `suspend`/`resume`/`exit`, `activityBackPressed`                          | `useAppState()`; back button → navigation.md                                                         |
| status/nav bars        | theme-color for color; status-bar style is unavailable | `StatusBar` utils, Android nav bar color                                                | native-only style API; web `setStatusBarStyle` intentionally no-ops                                  |
| icons/fonts            | inline SVG, `@font-face`                                | `svgview` (ui-svg → SVGKit/androidsvg), font fallback, `App_Resources` fonts            | `Icon` owns mapping; `Image` routes svg srcs to `svgview`                                            |
| accessibility          | ARIA attrs                                              | `accessible`, `accessibilityLabel/Hint/Value/Role`, `accessibilityLiveRegion`, announce | shared prop names map near-1:1 — keep a11y props on primitives                                       |
| i18n/locale            | `navigator.language`, Intl                              | `Device.language`, Intl                                                                 | i18next binding is DOM-free — shared                                                                 |
| images/media           | `<input type=file>`, canvas                             | imagepicker/camera plugins, `ImageSource`                                               | `media.pickImage()` returns `PickedImage` (preview URI + data URL); call `files.release()` when done |
| biometrics             | unsupported by this seam; WebAuthn needs an RP ceremony | Keychain biometrics plugin                                                              | optional-capability; use the app's WebAuthn auth flow directly on web                                |
| deep links             | URL is the link                                         | `Application` openUrl/continuation                                                      | feeds navigation route table                                                                         |

## Interface shapes (the repeating contracts)

### A11y prop map (shared prop → leaf attrs)

| Shared prop               | Web                                                            | Native                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessible`              | `aria-hidden={!v}` inverse                                     | `accessible` (marks element as a11y node)                                                                                                                                                                                                                |
| `accessibilityLabel`      | `aria-label`                                                   | `accessibilityLabel`                                                                                                                                                                                                                                     |
| `accessibilityHint`       | `aria-description`                                             | `accessibilityHint`                                                                                                                                                                                                                                      |
| `accessibilityValue`      | `aria-valuetext`/`aria-valuenow`                               | `accessibilityValue`                                                                                                                                                                                                                                     |
| `accessibilityRole`       | `role` (ARIA)                                                  | `accessibilityRole` — shared roles map to NS values: `heading`→`header`, `progressbar`→`progressBar`, `radio`→`radioButton`, `spinbutton`→`spinButton`, `tab`→`button` + selected state; other shared names keep their NS spelling |
| `accessibilityLiveRegion` | `aria-live`                                                    | `accessibilityLiveRegion` ('none'/'polite'/'assertive')                                                                                                                                                                                                  |
| `accessibilityState`      | `aria-disabled`/`aria-selected`/`aria-checked`/`aria-expanded` | NativeScript accepts one state enum; the leaf priority is disabled → selected → checked/unchecked. `busy` and `expanded` are web-only.                                                                                                                                 |

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
// Hardware/software back → navigation layer feeds it, screens may intercept:
function useBackHandler(fn: () => boolean /* handled? */): void
// activityBackPressed / popstate

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

## Two typing gotchas

> [!IMPORTANT]
> `references.d.ts`/`@nativescript/types` give native API typings
> (objc/java-ish globals). Scope them to `*.native.*` files via the native
> tsconfig only — never let UIKit types leak into shared typecheck.

> [!IMPORTANT]
> `platform` interfaces should be defined in `.ts` (no hooks at the interface
> layer); hook-shaped accessors (`useSafeAreaInsets`) live in `.tsx` wrappers
> inside the renderer glob.
