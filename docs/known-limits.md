# Known limits

> What is broken upstream, platform-bound, or deliberately asymmetric in the
> current release — read before promising behavior on a seam.

Each row names a seam and what each target actually does. **Kind**:

- `unsupported` — absent on that target, by capability or by design
- `degraded` — present, but with reduced fidelity or behavior
- `different` — present everywhere, semantics differ
- `broken-upstream` — filed upstream; tracked, not worked around

**Verified** is the version the row was last checked against; the tables are
re-checked in the pre-release docs sweep. Rows marked `desk` are verified
against source only — on-device behavior is still pending.

## Where the real OS widgets live

The shared barrel ships only what can be equal everywhere — self-drawn
controls (`Switch`, `Slider`, `ActivityIndicator`, `Tabs`, `Drawer`,
`Sheet`) and OS-backed controls with a chrome reset (`TextInput`,
`TextArea`). The platform-authentic widgets are opt-in subpath imports, and
a shared `.tsrx` importing them fails the other platform's build on purpose:

| Need                              | Web                                            | iOS                                                             | Android                                                                     |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Recycled list                     | `ScrollView` + `@for`                          | `UITableView` (`ui/ios`)                                        | `RecyclerView` (`ui/android`)                                               |
| Modal dialog                      | `Sheet` / `openSheet`                          | `UIModal` / `openModal` (`ui/ios`)                              | `MaterialDialog` / `openModal` (`ui/android`)                               |
| Edge-swipe drawer                 | `Drawer` (self-drawn, no edge swipe)           | `SideDrawer` (`ui/ios`)                                         | `DrawerLayout` (`ui/android`)                                               |
| OS switch / slider / spinner / tab bar | shared self-drawn set                      | `UISwitch` / `UISlider` / `UIActivityIndicatorView` / `UITabBar` | `MaterialSwitch` / `SeekBar` / `CircularProgressIndicator` / `BottomNavigationView` |
| Hover interactions                | `Hoverable`, `Tooltip` (`ui/web`)              | —                                                               | —                                                                           |
| Liquid glass                      | —                                              | `LiquidGlass` / `LiquidGlassContainer` (`ui/ios`)               | —                                                                           |

`ui/ios` and `ui/android` resolve only in native builds; `ui/web` only in
web builds. `ui/native` is plumbing (root-layout helpers), not components.

## Primitives

| Seam                     | Web                                              | iOS                                                          | Android             | Kind       | Verified    |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------ | ------------------- | ---------- | ----------- |
| `ScrollBox`              | scrolls (aliases `ScrollView`)                   | plain inline container — use `ScrollView` to scroll          | same as iOS         | `different` | 0.5.0      |
| `Pager`                  | scroll-snap row; `onPageChange` fires ~90ms after the scroll goes idle  | UICollectionView paging via `@nativescript-community/ui-pager` (required peer — the app must declare it for `/ns/m`); per-page Octane roots; unverified on device | ViewPager2 via the same plugin; unverified on device | `different` | post-0.5.0·desk |
| `SearchInput`            | `<input type=search>`; webkit's own ✕ hidden so the drawn one matches   | TextField, `returnKeyType=search`; glyph tint via `svgview` `currentColor` unverified              | same as iOS         | `different` | post-0.5.0·desk |
| `SegmentedControl`       | equal-width segments (`width:0`+`flex-grow` — `flex-basis` is dead on NS) | identical classes/geometry; tap only (no arrow-key nav) — Space/Enter on web | same as iOS      | `different` | post-0.5.0·desk |
| `ContextMenu` trigger    | right-click                                      | long-press                                                   | long-press          | `different` | 0.5.0      |
| `PinInput` / `InputTags` | backspace-removes tag via the `web` escape bag   | chip ✕ remove only; no paste-to-fill                         | same as iOS         | `degraded`  | 0.5.0      |
| `TextArea` `onSubmit`    | fires on Cmd/Ctrl+Enter                          | fires only when `returnKeyType` is `done`/`send`             | same as iOS         | `different` | 0.5.0      |
| Nested `Text`/`RichText` | spans nest                                       | flat sibling spans — context carries inherited styles        | same as iOS         | `different` | 0.5.0      |
| `line-height`            | total line box                                   | additive inter-line spacing                                  | same as iOS         | `different` | 0.5.0      |
| `useMeasure` `x`/`y`     | viewport-relative                                | screen-relative dips                                         | same as iOS         | `different` | 0.5.0      |
| `ref` value              | `HTMLElement`                                    | NativeScript `View`                                          | NativeScript `View` | `different` | 0.5.0      |
| `onInput`/`onChange`     | can re-dispatch — keep handlers idempotent       | once per edit                                                | same as iOS         | `degraded`  | 0.5.0      |
| `accessibilityState`     | independent ARIA booleans                        | single enum, strongest wins (disabled→selected→checked)      | same as iOS         | `degraded`  | 0.5.0      |
| `accessibilityRole`      | full ARIA spellings                              | narrower NS enum (`tab`→`button`, `heading`→`header`, …)     | same as iOS         | `different` | 0.5.0      |
| `Icon`/`Image` SVG       | DOM `<svg>`                                      | SVGKit                                                       | AndroidSVG — no SVG filters, limited text/radial gradients | `degraded` | 0.5.0·desk |
| `Table`/`Select`/menus   | bounded, unvirtualized                           | bounded, unvirtualized — large data → `UITableView`          | → `RecyclerView`    | `degraded`  | 0.5.0      |
| `WebView` document pixels | Chromium iframe                                 | WKWebView                                                  | android.webkit.WebView — page content renders in each engine; only the frame chrome is normalized | `different` | 0.5.0·desk |
| `WebView` `onError`      | iframe `error` event does not fire reliably cross-browser | `loadFinished` carries the error string             | same as iOS         | `degraded`  | 0.5.0·desk |
| `WebView` `scrollEnabled={false}` | `scrolling="no"` (deprecated attr, still honored) | `scrollView.scrollEnabled`                       | touch-move interception — drag text selection inside the frame is lost | `degraded`  | 0.5.0·desk |
| `WebView` `sandbox`      | typed prop, default token list applied           | unsupported — no-op (WKWebView is already isolated)          | same as iOS         | `unsupported` | 0.5.0·desk |
| `WebView` JS bridge      | unsupported — no `injectedJavaScript`/`postMessage`; use the `web:` bag | unsupported — use the `ios:` bag | unsupported — use the `android:` bag | `unsupported` | 0.5.0·desk |

Overlay roots (`Sheet`/`openSheet`, `UIModal`, `MaterialDialog`) mount a
separate Octane root on every platform — `useContext` does not cross into
them. Theme classes are forwarded; read context inside the overlay or pass
values down.

The self-drawn set compiles on both leaves, passes the web smoke suite, and
renders in the harness `components` sweep on iOS; Android nested-stack
sweeps remain skipped on #11444.

## Navigation

| Seam                    | Web                                          | iOS                                             | Android                                    | Kind             | Verified |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- | ------------------------------------------ | ---------------- | -------- |
| Push into a named stack | nested-outlet URL push                       | commits but loses bookkeeping ([NS#11444](https://github.com/NativeScript/NativeScript/issues/11444)) | warns loudly and drops — raced pushes can crash the fragment manager | `broken-upstream` | 0.5.0    |
| Hardware back           | browser back → `popstate`                    | — (no hardware back)                            | wired; pop-while-pushed not yet verified live | `different`     | 0.5.0    |
| Route params            | serialize to query string — objects dropped  | objects survive                                 | objects survive                            | `degraded`       | 0.5.0    |
| `popRoute(stack)`       | `history.back()` regardless of `stack`       | pops that stack                                 | pops that stack                            | `different`      | 0.5.0    |

## Platform services

| Seam                          | Web                                                              | iOS                  | Android                       | Kind          | Verified    |
| ----------------------------- | ---------------------------------------------------------------- | -------------------- | ----------------------------- | ------------- | ----------- |
| `appInfo`                     | unsupported — no trustworthy bundle identity                     | `NSBundle` metadata  | package metadata              | `unsupported` | 0.5.0       |
| `openSettings`                | unsupported                                                      | app Settings URL     | app-details intent            | `unsupported` | 0.5.0·desk  |
| `biometrics`                  | unsupported — WebAuthn needs an RP ceremony; call it directly    | FaceID/TouchID       | Keystore biometric            | `unsupported` | 0.5.0·desk  |
| `secureStorage`               | unsupported — no enclave                                         | Keychain             | Keystore                      | `unsupported` | 0.5.0       |
| `haptics`                     | `navigator.vibrate` — Android Chrome only; unsupported elsewhere | Taptic Engine        | Vibrator                      | `degraded`    | 0.5.0       |
| `share`                       | `navigator.share`, else clipboard copy (`'copied'`)              | share sheet          | share sheet                   | `degraded`    | 0.5.0       |
| `systemBars.setStatusBarStyle` | no-op — `setColor` writes `theme-color` meta instead            | works                | works                         | `unsupported` | 0.5.0       |
| `notifications`               | local `Notification` only                                        | local + push (APNs)  | local + push (FCM)            | `degraded`    | 0.5.0·desk  |
| `media.ensure('camera')`      | `getUserMedia`                                                   | unsupported — no capture plugin yet | unsupported      | `unsupported` | 0.5.0·desk  |
| `files`                       | `pick` → blob URL; `writeText` triggers a download               | real file paths      | real paths; SAF `content://` reads | `different` | 0.5.0·desk  |

## Same edge on every target

- **`.tsrx` files don't emit `.d.ts`.** Upstream tsrx#136 → TS#64120/#64053.
  `@octane-xplat/ui` ships a generated `props.d.ts` plus hand-maintained
  shells, so consumers still get full types. — 0.5.0.
- **`.tsrx` infers effect deps from closure reads.** An effect that only
  writes (refs, DOM) and never reads its driving prop compiles to a deps
  array that omits it — declare deps explicitly:
  `useLayoutEffect(fn, [props.value])`. — 0.5.0.
- **Literal `@{` in JSX text** parses as a code block: evaluated and
  discarded on web, a compile error on native. Write `{'@'}{expr}` —
  `<Text>{'@'}{user.handle}</Text>` renders `@handle`. Upstream fix
  intentionally not pursued. — 0.5.0.
- **`.tsrx` files reject `async` top-level functions** — the compiler
  treats them as async components, and an `async` function that never
  awaits still breaks `ns build`. Drop the keyword. — 0.5.0.
- **`Grid` `gap` was removed** — use child margins. The leaves keep a
  one-time console warning as a migration hint for one release. — 0.5.0.
- **`console.debug` doesn't exist on device** — use `console.log`. The
  lint ruleset flags it. — 0.5.0.
- **Deep imports don't extension-resolve** — barrel imports only. — 0.5.0.
- **Deep imports under `@nativescript/core/ui/*`** bundle as a second
  module instance — import from `@nativescript/core` only. Lint-enforced.
  — 0.5.0.
- **Plain `.ts` files escape the compiler's DOM-global checks** — `pnpm
  lint` (`xplat/no-dom-globals`) is the backstop; keep DOM code in `.tsrx`
  leaves where possible. — 0.5.0.
- **No `PLATFORM` constant** — platform divergence goes through leaf
  files, by design. — 0.5.0.
- **Text controls stay OS-backed** — caret, selection UI, IME, autocorrect
  toolbars, secure entry, and keyboard types remain platform-native by
  design. — 0.5.0.
- **`flex-shrink` defaults to 0, not CSS's 1** — NativeScript's shrink
  pass has no min-content floor (it clamps at the explicit `min-*`
  property), so tokens.css normalizes to React Native semantics on all
  targets. Overflow regions opt in with `flex-1`/`shrink` +
  `min-h-0`/`min-w-0`; `ellipsize`/`numberOfLines` text re-enables shrink
  itself. iOS row-axis shrink re-measures the child but keeps natural
  frame width. — post-0.5.0, verified ios-sim 2026-09-26.
