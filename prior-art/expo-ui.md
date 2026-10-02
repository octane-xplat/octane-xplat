# Expo UI (`@expo/ui`)

> Expo's native-toolkit component library — React props driving real SwiftUI
> (iOS) and Jetpack Compose (Android) trees, with react-dom/react-native-web
> on web. Closest precedent to our shared + `ui/{ios,android}` split: same
> tiered structure, opposite parity bet.

## The model

Three tiers:

- `@expo/ui` — one universal API delegating to SwiftUI on iOS, Compose on
  Android, DOM on web. The parity claim is _platform-native look and feel_
  (each side renders the real toolkit). Ours is _same props → same pixels_
  (self-drawn/chrome-reset) — same structure, the stronger cross-platform
  guarantee.
- `@expo/ui/swift-ui`, `@expo/ui/jetpack-compose` — 1:1 OS-vocabulary
  surfaces, ~45–51 hand-written native components each plus full modifier
  libraries. Our `ui/{ios,android}` subpaths are the analog at much smaller
  scale.
- Drop-in replacements — API-compatible shims for popular RN libraries
  (bottom-sheet etc.). A distribution play against the RN ecosystem; requires
  RN API compatibility we don't have, so it doesn't map — though
  "migrating from X" recipes could borrow the idea.

`Host` marks every crossing between the RN tree and the toolkit tree (like
`<svg>` or a Skia `Canvas`); `RNHostView` is the inverse embedding (RN
content inside a native-toolkit container, e.g. cells in a SwiftUI `List`).
Boundaries are explicit with a documented re-entry rule: render the other
tree's components and you've left the context; reintroduce a Host to go back.

## What transfers

| Expo idea                                                                                       | Our adaptation                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Host` boundary props — `matchContents`, `onLayoutContent`, `ignoreSafeArea`, `layoutDirection` | Props on `hosted` surfaces / subpath widgets. "Content size ≠ frame" is a real gap today (WebView document height, CameraView aspect, full-bleed behind the notch).                                                                                                                                                                                                       |
| `modifiers` array — typed factories returning serializable configs, order-sensitive, spreadable | `ui/{ios,android}/modifiers` subpaths — a generic pipe absorbing the native-prop long tail (`swipeActions`, `listRowSeparator`, `glassEffect`) without prop plumbing. On NS a _custom_ modifier is just a JS function handed the real view object — strictly more powerful than Expo's, which require Swift/Kotlin. Needs platform tagging so `xplat/*` lint still holds. |
| `RNHostView` inverse embedding                                                                  | Octane content inside `UITableView` cells / `RecyclerView` items already crosses this seam implicitly — name the boundary contract rather than leaving it implied.                                                                                                                                                                                                        |
| `Icon.select({ ios: sfSymbol, android: drawable })` — OS-native glyph lookup                    | SF Symbol / Material glyph refs on platform-authentic widgets (tab bars, menus, swipe actions) where app-registered SVG looks off. Shared `Icon` keeps app glyphs for same-pixels.                                                                                                                                                                                        |
| `ListItem` dual API — `leading`/`trailing`/`supportingText` props + compound children for slots | Pattern for `FieldGroup` rows and any settings-list primitive: props cover the terse 90%, slots are the escape hatch.                                                                                                                                                                                                                                                     |
| Per-component "native implementations" doc table (platform → backing widget)                    | For each shared component document: web element \| NS view class \| normalization class \| known divergences. Cheap to produce, instant debugging orientation.                                                                                                                                                                                                            |
| Honest per-component limits ("List doesn't lazily render yet")                                  | Same practice as `docs/verify/known-limits.md` — validation, not a steal.                                                                                                                                                                                                                                                                                                 |

## The island mechanism

Expo can ship those packages because Expo Modules lets them _author_ Swift
and Kotlin. The equivalent on our substrate exists but is inverted:
`@nativescript/swift-ui` (4.x, mature) and `@nativescript/jetpack-compose`
(single stale beta) are **bridge kits, not component libraries** — someone
authors the SwiftUI `View` + a provider (`updateData(NSDictionary)` in,
`onEvent` out), registers it, and `<SwiftUI swiftId>` /
`<JetpackCompose composeId>` embeds it in the NS tree. `NativeScriptView`
is the inverse embedding. The swift-ui plugin itself ships Swift in
`platforms/ios/src` — proof that plugin platform sources compile into the app.

So an island leaf is paved by our existing model: a leaf package ships
`platforms/ios/src/*.swift` (provider + view), declares
`@nativescript/swift-ui` as a real dependency (#51), registers the provider
at import, and wraps `<SwiftUI swiftId>` in an octane component. On Android
the leaf's `platforms/android/include.gradle` can carry the compose flags the
beta plugin currently makes apps hand-wire. Classification is `hosted` by
construction — the frame is ours, the interior is foreign.

Expo UI is MIT. Its toolkit composition code (sheet detents,
`List`+`refreshable`+`swipeActions`, `ContextMenu` previews, `Picker` styles,
`Gauge`) ports onto the provider channel — roughly the toolkit-side majority
of each component; the ExpoModules glue (prop-macro DSL, event emitters) does
not and gets re-skinned onto `updateData`/`onEvent`.

**Posture:** islands are the escalation path, not a rebuild of the platform
tier — they're bounded (serializable props, fixed boundary, toolkit owns
interior layout), so they make good widgets and bad containers. Triggers in
order of inevitability: no NS path exists (Swift Charts, `Model3D` — already
shipped by the plugin — Live Activities, iOS-26-only controls); the plugin
ecosystem's version is dead or dated; self-drawn hits a quality ceiling
(gesture physics, a11y, OS integration). If island porting repeats ~3 times,
the generic version — one provider interpreting a serialized
view-tree+modifier description from JS — is when an `…/swift-ui` package
name earns itself.

## What doesn't transfer

- `useNativeState` and `'worklet'` scroll callbacks (`useScrollGeometryChange`)
  — they exist because RN crosses a bridge; NS JS runs in-process on the UI
  thread and `signal$` already is that mechanism. The API shape is still
  worth noting: one callback delivering `{contentOffset, contentSize,
containerSize}` as a unit for parallax/progress.
- The `swift-ui`/`jetpack-compose` _names_ as general vocabulary packages —
  our `UISwitch` is UIKit `UISwitch`, `MaterialSwitch` is a Material
  Components _view_. The honest OS names we already use are right; toolkit
  names would be false advertising unless an island genuinely hosts one.
- "Everything is a toolkit component" breadth as a goal — reproducing ~50
  hand-written native components per platform is a different product than
  "JS over NS core + declared plugins" (#53).

## Takeaway

Validates the shared + platform-authentic structure (#44–46, #50) from a
different substrate — and shows where its ceiling is. Steal the boundary
props, the `modifiers` pipe, OS-glyph icon selection, and the dual-slot
`ListItem` shape now; treat Expo's component source as an MIT parts bin for
island leaves when a widget has no NS path. See `docs/start/architecture.md`
(normalization classes) and `docs/notes/decisions.md` (#44–46, #50, #51, #53).
