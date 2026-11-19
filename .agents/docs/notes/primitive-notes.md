# Primitive implementation constraints

Use the [component guide](../../../docs/app/components.md) and
[primitive contributor guide](../guides/primitives.md)
for supported APIs. This note carries implementation constraints that are easy
to lose when changing the native driver. It does not duplicate the API inventory
or retain superseded prop sketches.

## Driver semantics

Read [driver semantics](../guides/primitives/driver-semantics.md)
before changing parenting, slots, event aliases, or native prop writes. Text
children require a text host; arbitrary layouts do not render bare text. Native
props assign view properties, not DOM attributes. A prop write can echo an event;
the driver's pending-write suppression owns that echo, not ad hoc leaf guards.

Native portals distinguish component-owned hosts from ownerless services. Use
[portal boundaries](portal-boundaries.md) for root selection, context, and lifetime.
A TSRX expression tail is a statement; output needs a node such as a fragment.
The missing diagnostic is tracked by [Octane #1258](https://github.com/octanejs/octane/issues/1258).

## Liquid Glass measurement

Core 9.1.3's `LiquidGlass`/`LiquidGlassContainer.onMeasure` zero effective padding
and border before delegating. Parents pass border-box sizes, so this measures
content too wide and layout then clips it. Local subclasses in
`packages/ui/src/ios/` call the base GridLayout/AbsoluteLayout measure paths
while retaining core's local-coordinate layout and transform normalization.
Remove these overrides when core drops the padding-zeroing behavior; upstream
tracking is [#11561](https://github.com/NativeScript/NativeScript/issues/11561)
and [#11562](https://github.com/NativeScript/NativeScript/pull/11562).

The foreign-parent → Mason-child max-content case is separate (Xplat #38,
fixed in `@octane-xplat/nativescript-mason-core` ≥ beta.5): an auto-width
glass could retain a padding-only size after a Mason child initially reported
zero. The core engine defers a root measured inside an outer compute and
re-measures the foreign host once it settles — an auto-width glass now grows
to fit (158 pt glass, child at x 19 for a 120 pt child and 19 pt padding,
probe-verified on the iOS simulator). Geometry tests do not establish
interactive child touch delivery.
Current API, fallback, and interaction defaults belong in the
[Liquid Glass guide](../../../docs/app/liquid-glass.md).

## VirtualList evidence boundaries

Use the [VirtualList guide](../../../docs/app/virtual-list.md) for the supported
windowing/scroll contract and [RecyclingList design](../../design/recycling-list.md)
for lifecycle ownership. Keyed windowing is not native view recycling. Preserve
row identity, viewport anchoring during prepend/remeasure, scroll-unit conversion,
and cleanup independently of throughput work.

A mounted row does not establish that an out-of-window seek put it in the
viewport. Measure visible coverage and readiness latency separately. JavaScript
poll intervals are not frame pacing; bounded mounted counts are not process
memory measurements. Variable-height momentum, hardware input, and long-session
memory require their own target evidence.

The [native host integration](masonkit-layout-evaluation.md#native-host-integration)
contract applies when list fixtures change engine packages or aliases.

## Accessibility busy state

Core 9.1.3's `AccessibilityState` is one enum
(`selected | checked | unchecked | disabled`), not independent ARIA booleans; it
has no `busy` member. `nativeAccessibilityState` in `escape-props.ts` ignores
unsupported states and selects the strongest mapped state. The native Button
uses disabled state plus `accessibilityValue: 'Loading'` while busy. Revisit the
mapping if upstream adds a busy state or per-platform traits. Screen-reader
behavior still requires actual assistive-technology verification.

## Evidence lookup

Historical list profiles, driver experiments, and original design sketches are
preserved under Silo `local_artifacts` key `.agents/docs/notes/primitive-notes.md`.
Use [operational evidence](../exploration.md#operational-evidence) for lookup;
consult current qualification rows rather than treating a historical pass as
current performance or accessibility support.

## VirtualList regression runners

### Bounded measurement and reorder regression checks

The maintained `packages/ui/tests/virtual-list.*.tsrx` cases check settled host
sizes and row positions without images. NativeScript measurements wait for valid
layout and listen to its exact `layoutChanged` event. Measured row heights update
positioned cells even when the same rows stay visible. AppKit keeps retained
keyed views in native stack order when items are sorted or reordered.

Run a case with `bun run probe run packages/ui/tests/virtual-list.web.tsrx --target web`.
For iOS, use `virtual-list.mobile.tsrx`, `--target ios`, and `--device` with a
booted simulator ID. For AppKit, use `virtual-list.macos.tsrx --target macos`.
The current focused checks cover Chromium, iOS, and AppKit; they do not establish
Android geometry, OS input, or frame pacing. Browser resize errors remain test
failures.

## Run the nonvisual gates

From the repo root, install with `bun install --frozen-lockfile`, then:

1. Build the harness: `bun run turbo run build --filter=@xplat/web`.
2. From `tools/web-verification`, run `node scripts/bench-virtual-list-contract.ts`.
   It fails on anchor drift greater than 2 pixels, lost keyed state, unbounded
   mounts, or failed empty/disposal checks.
3. From `tools/web-verification`, run `XPLAT_VLIST_INPUT_MS=180000 node scripts/bench-virtual-list-input.ts variable`.
   The JSON separates sampled row geometry, rAF callback intervals, live-list
   collected heap, and collected heap after route disposal. rAF alone does not
   prove compositor presentation timing.
4. From `apps/mobile`, run
   `XPLAT_VLIST_DEVICE=<simulator-UDID> XPLAT_VLIST_INPUT_MS=180000 node scripts/bench-virtual-list-input.ts ios variable`,
   or replace `ios` with `android` and supply an ADB serial. Android requires
   Temurin JDK 21 on `JAVA_HOME`. Use `fixed48` as a measurement control and
   `demo500` for the actual List ×500 demo, including its slots and row state.
   The swipe sequence moves forward through four viewports, then revisits rows.

Native runners require Python 3 and take the exclusive shared advisory lock at
`$TMPDIR/octane-xplat-target-locks/<target>.lock` (through
`scripts/with-native-target-lock.py`, the same directory protocol as
`scripts/with-target-lock.ts`) for build and use. Other native sessions must
use the same lock convention; an advisory lock cannot protect against a
nonparticipating session. The runner fails if busy.
It uses `org.nativescript.xplat.vlistbench` (override with
`XPLAT_VLIST_APP_ID`) to avoid replacing the normal harness app. iOS builds,
installs, and launches with `simctl`; it never reboots an already booted simulator.
Native input is synthetic `idb`/`adb` swipes, explicitly labeled in results.
Android records layout/measure, draw, and total frame-work durations through
`Window.OnFrameMetricsAvailableListener`, plus PSS categories and the final bounded
`gfxinfo framestats` buffer. Window metrics measure frame work, not presentation;
JavaScript sampling intervals remain a separate responsiveness measure.
Header/footer and separator boxes count toward coverage, without increasing
mounted row counts. Reports separate logical row mount/unmount counts from
physical outer-host additions/removals; pooling preserves only those outer hosts.
Large reports use numbered log records to avoid Android
console truncation.

For repeatable Android comparisons, set `XPLAT_VLIST_FRESH_INSTALL=1`. This removes
only the selected benchmark app, including its data, before installing under the
target lock. NativeScript otherwise retains extracted bundle files during an
in-place reinstall, which can run stale code. Use this option only for a disposable
benchmark app. Native memory collection does not force GC: growth is a signal to
investigate, not proof of a leak. No runner captures images.

## Native control implementation map

| Component                   | Web element                  | iOS NativeScript view                         | Android NativeScript view              | Normalization class   |
| --------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------- | --------------------- |
| `Item`                      | `div` via shared `Pressable` | `FlexboxLayout` via shared `Pressable`        | `FlexboxLayout` via shared `Pressable` | `self-drawn`          |
| `SafeArea`                  | `div`                        | `FlexboxLayout`                               | `FlexboxLayout`                        | shared layout wrapper |
| `WebView`                   | sandboxed `iframe`           | `webview` → WKWebView                         | `webview` → android.webkit.WebView     | `hosted`              |
| `UITableView`               | unavailable                  | `listview` → UITableView                      | unavailable                            | `platform-authentic`  |
| `RecyclerView`              | unavailable                  | unavailable                                   | `listview` → RecyclerView              | `platform-authentic`  |
| `UITabBar`                  | unavailable                  | `TabView` / UITabBarController                | unavailable                            | `platform-authentic`  |
| `BottomNavigationView`      | unavailable                  | unavailable                                   | `TabView`                              | `platform-authentic`  |
| `UISwitch`                  | unavailable                  | `switch` → UISwitch                           | unavailable                            | `platform-authentic`  |
| `MaterialSwitch`            | unavailable                  | unavailable                                   | `switch` → SwitchMaterial              | `platform-authentic`  |
| `UISlider`                  | unavailable                  | `slider` → UISlider                           | unavailable                            | `platform-authentic`  |
| `SeekBar`                   | unavailable                  | unavailable                                   | `slider` → SeekBar                     | `platform-authentic`  |
| `UIActivityIndicatorView`   | unavailable                  | `activityindicator` → UIActivityIndicatorView | unavailable                            | `platform-authentic`  |
| `CircularProgressIndicator` | unavailable                  | unavailable                                   | `activityindicator` → ProgressBar      | `platform-authentic`  |
| `LiquidGlass`               | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |
| `LiquidGlassContainer`      | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |

The platform-authentic rows intentionally have no web counterpart. Their
native modifiers and glyph names stay behind platform subpaths; they do not
change the shared components' parity class.
