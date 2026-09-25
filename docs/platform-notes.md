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
| files                  | OPFS/download URLs                                      | `knownFolders`, `File`                                                                  | paths don't transfer; keep opaque `FileRef`                                                          |
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
| status/nav bars        | N/A                                                     | `StatusBar` utils, Android nav bar color                                                | native-only API; web impl no-op                                                                      |
| icons/fonts            | inline SVG, `@font-face`                                | `svgview` (ui-svg → SVGKit/androidsvg), font fallback, `App_Resources` fonts            | `Icon` owns mapping; `Image` routes svg srcs to `svgview`                                            |
| accessibility          | ARIA attrs                                              | `accessible`, `accessibilityLabel/Hint/Value/Role`, `accessibilityLiveRegion`, announce | shared prop names map near-1:1 — keep a11y props on primitives                                       |
| i18n/locale            | `navigator.language`, Intl                              | `Device.language`, Intl                                                                 | i18next binding is DOM-free — shared                                                                 |
| images/media           | `<input type=file>`, canvas                             | imagepicker/camera plugins, `ImageSource`                                               | `media.pickImage()` returns `PickedImage` (preview URI + data URL); call `files.release()` when done |
| biometrics             | WebAuthn                                                | Keychain biometrics plugin                                                              | optional-capability                                                                                  |
| deep links             | URL is the link                                         | `Application` openUrl/continuation                                                      | feeds navigation route table                                                                         |

## Interface shapes (the repeating contracts)

### A11y prop map (shared prop → leaf attrs)

| Shared prop               | Web                                                            | Native                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessible`              | `aria-hidden={!v}` inverse                                     | `accessible` (marks element as a11y node)                                                                                                                                                                                                                |
| `accessibilityLabel`      | `aria-label`                                                   | `accessibilityLabel`                                                                                                                                                                                                                                     |
| `accessibilityHint`       | `aria-description`                                             | `accessibilityHint`                                                                                                                                                                                                                                      |
| `accessibilityValue`      | `aria-valuetext`/`aria-valuenow`                               | `accessibilityValue`                                                                                                                                                                                                                                     |
| `accessibilityRole`       | `role` (ARIA)                                                  | `accessibilityRole` — NS set: `button`,`link`,`search`,`image`,`header`,`adjustable`,`summary`,`text`,`none`,`progressbar`,`checkbox`,`switch`,`tab`,`keyboard_key`,`updates_frequently`,`increment`,`decrement` — map shared names onto this set + ARIA |
| `accessibilityLiveRegion` | `aria-live`                                                    | `accessibilityLiveRegion` ('none'/'polite'/'assertive')                                                                                                                                                                                                  |
| `accessibilityState`      | `aria-disabled`/`aria-selected`/`aria-checked`/`aria-expanded` | per-state NS props + events                                                                                                                                                                                                                              |

NS roles are stringly-typed and narrower than ARIA — the shared `Role` union
covers the intersection; leaf impls translate (e.g. shared `'heading'` → web
`role="heading"` + native `accessibilityRole="header"`).

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
