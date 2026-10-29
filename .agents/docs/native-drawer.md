# Native drawer dependency review

Decision #133 replaces the initial recommendation (#132): `Drawer` itself
moves to `@octane-xplat/drawer`, with one public API and mobile edge/drag
gestures enabled by default. UI no longer exports Drawer, SideDrawer,
DrawerLayout, or their prop aliases. The user authorized this cutover after
Annotation 1 rejected a weaker mobile shared Drawer.

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function Example() {
	return <Drawer defaultOpen main={null} drawer={null} />
}
```

The leaf owns ui-drawer 0.1.32 and pins gesturehandler 2.1.0 as runtime
dependencies. Web and desktop retain composed panels with the gesture subset
explicit. UI does not depend on or re-export the leaf. Application setup and
migration are in the [drawer guide](../../docs/app/drawer.md).

npm dependencies do not vary by export condition: web-only Drawer consumers
also install these mobile packages, although the packed web bundle excludes
them. In NativeScript apps, installing this leaf opts into native plugin
discovery even if its JS exports are unused. Apps using unrelated widgets
should neither install the leaf nor declare its plugins.

## Historical source review

Reviewed 2026-10-28 at `2368e3f29819effb109c107787b5de316184fdb1` (UI
0.18.0), with the relevant files unchanged at `1cf448ba4`. Opals evidence is
from alignment commit `e0330bf8`, published 0.18.0 by default and currently
linked to this checkout. Opals was read only. Evidence here is source and
existing development artifacts; no devices, screenshots, or release builds ran.

Rechecked against pre-cutover HEAD `ee242b434b13c534794947488d7ecc919f9ce887`:
the four native barrel/wrapper files match the original review, and the UI
manifest still lists ui-drawer only in devDependencies. The implementation
checks below are separate from that historical review.

## Boundaries at the reviewed revision

| Boundary            | Verified finding                                                                                                               | Consequence                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| UI manifest         | `ui-drawer` 0.1.32 is development-only, absent from runtime dependencies and peers; UI has no `sideEffects: false` declaration | The “optional peer” comment describes intent, not a declared peer contract                         |
| iOS barrel          | `src/ios/index.ts` re-exports both LiquidGlass and SideDrawer                                                                  | An unrelated widget import reaches the drawer module through the static graph                      |
| Android barrel      | `src/android/index.ts` re-exports DrawerLayout                                                                                 | The same coupling affects unrelated Android widgets                                                |
| Wrapper evaluation  | Both wrappers import the plugin and call `install()` and `registerElement('drawer', NSDrawer)` at module scope                 | Initialization is tied to module evaluation rather than drawer mounting                            |
| Upstream evaluation | ui-drawer itself calls `installGestures(false)` on import                                                                      | Moving only the wrapper's explicit install call cannot remove import-time effects                  |
| Native discovery    | NativeScript CLI 9.1.1 walks app runtime dependencies recursively and selects packages with NativeScript metadata              | Native compilation is governed by the installed dependency graph, independently of JS tree shaking |

The verified import path is:

```text
LiquidGlass import -> ui/ios barrel -> SideDrawer module
  -> ui-drawer -> gesturehandler -> observable
```

Static export traversal requires dependency resolution. Retained side-effectful
wrapper modules can evaluate even when their component export is unused. A
bundler might optimize some paths, but optionality must not depend on that:
Opals' existing iOS development vendor bundle contains module regions for all
three community packages without a drawer screen. Bundle presence establishes
inclusion, not execution of every included module or a release-size delta.

The intended contract is established by wrapper comments and
[toolchain notes](notes/toolchain-notes.md): consumers own these
optional plugins. The source boundary does not enforce feature-level
optionality. This is an Xplat packaging/barrel mismatch, not evidence of an
upstream plugin defect. Existing packed-consumer tests explicitly supply the
drawer plugin, so they do not prove unrelated native widget imports work
without it.

For Opals, drawer code and drawer-specific initialization are incidental to
LiquidGlass. The app's native renderer and native Vite integration remain
separate requirements; this review does not propose removing them. Other
installed features may independently require gesturehandler, so absence checks
must use a minimal consumer before interpreting a whole-app result.

## Gesture value and appearance

The inspected upstream releases are
[ui-drawer v0.1.32](https://github.com/nativescript-community/ui-drawer/blob/v0.1.32/src/ui-drawer/index.ts)
and [gesturehandler v2.1.0](https://github.com/nativescript-community/gesturehandler/blob/v2.1.0/src/gesturehandler/gesturehandler.ios.ts).
Their annotated tags resolve to `fba217d4f82a092755bafca26d78c58edd332b9c`
and `77df351f3458a354990cbcba1e734bec7ec3d8f0`. Use these release tags,
not the stale `gitHead` fields in their manifests, to inspect release source.

| Implementation  | Source evidence                                                                                                                                                                    | Limit of the claim                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ui-drawer       | Custom NativeScript GridLayout; directional slots; thresholded PAN recognition, velocity-based settling, handler arbitration options, translation/animation and backdrop ownership | Supplies gesture/layout/presentation mechanics, not menu rows, typography, or OS chrome; not strictly headless                                         |
| Android wrapper | Uses that same Drawer class; upstream does not instantiate AndroidX DrawerLayout                                                                                                   | Its “AndroidX DrawerLayout behavior” comment is unsupported and should be corrected                                                                    |
| iOS wrapper     | Same custom layout over native views/recognizers                                                                                                                                   | iOS has no general OS side-drawer widget; “platform-authentic” must not imply an OS-provided drawer appearance                                         |
| Shared Drawer   | Mason/native and DOM implementations conditionally render a left panel and dismissible backdrop; no pan handler                                                                    | Reuse suits explicit open/dismiss flows, but would remove the plugin's continuous drag and edge gestures                                               |
| Wrapper state   | Both wrappers drive left-side imperative open/close from `props.open`, swallow promise errors, and do not connect plugin dismissal events                                          | Shared prop aliases overstate equivalence: `defaultOpen` and `onDismiss` are not implemented there; gesture closure can disagree with controlled state |

The main/panel slot shape is retained in the current package API:

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function DrawerExample() {
	return <Drawer defaultOpen main={null} drawer={null} />
}
```

Source inspection does not establish mobile gesture quality, scroll/back-gesture
coexistence, accessibility, or focus behavior. Neither the wrappers nor shared
Drawer establish a complete accessible modal-navigation contract. Retaining
the proven gesture engine avoids immediately rebuilding its arbitration and
settling machinery, but still requires runtime qualification and state repair.

## Native installation and costs

The runtime chain is `ui-drawer@0.1.32 -> gesturehandler@^2.0.8 ->
observable@^2.0.10`; Opals resolves 2.1.0 and 2.0.11. ui-drawer has no own
`platforms/`; gesturehandler carries Objective-C and Java implementation.
Its shipped Android `include.gradle` declares `androidx.annotation:annotation:1.1.0`
and NativeScript runtime artifacts for its temporary plugin build. No separate
gesturehandler CocoaPod is needed to explain native source inclusion; absence
from Podfile.lock does not mean absence from the binary.

gesturehandler reads `GestureHandlerDelegate` at iOS module evaluation and
mixes lifecycle helpers into NativeScript View/Page prototypes during install.
The default install does not enable its optional replacement of all ordinary
NativeScript gesture observers. These are broader effects than allocating a
drawer view; active drawer PAN handlers attach when a drawer initializes.

The old note's assertion that native compilation _requires an app-direct_
gesturehandler declaration is too strong. CLI 9.1.1's
[dependency builder](https://github.com/NativeScript/nativescript-cli/blob/v9.1.1/lib/tools/node-modules/node-modules-dependencies-builder.ts)
traverses runtime dependencies recursively; `getAllProductionPlugins` filters
that result by NativeScript metadata. Opals' existing Android dependencies.json
also records ui-drawer depending on gesturehandler, though both are app-direct
there. This supports transitive discovery, but is not a clean removal test.
Preserve Opals' declarations until clean native preparation/build/startup and
version-resolution checks prove cleanup safe.

Earlier Opals measurements supplied for this review remain development-only:
about 1.1 MiB installed across the three packages; 66,611 bytes of attributed
development JS regions; gesturehandler iOS/Android source totals 73,503 and
122,973 logical bytes. Vendor-region presence was rechecked; those totals
were not remeasured. None establishes IPA/APK growth, startup time, memory,
gesture contention, or accessibility cost. No such deltas were measured here.
The boundary recommendation does not depend on a particular size saving.

## Implementation and qualification

The mobile binding serializes prop changes behind plugin completion events,
seeds uncontrolled state once, and reports user edge opening/dismissal through
`onOpenChange`. Controlled owners accept or reject requests through `open`.
Programmatic transitions do not echo callbacks. Web keyboard handling traps
focus, dismisses on Escape, and restores prior focus. Provide visible controls
on every target; this does not establish full native accessibility support.

```tsx
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/drawer'

export function ControlledDrawer() {
	const [open, setOpen] = useState(false)
	return <Drawer open={open} onOpenChange={setOpen} main={null} drawer={null} />
}
```

### Upstream animation workaround

ui-drawer v0.1.32's `open()` calls `animateToPosition()` without awaiting or
returning it (`src/ui-drawer/index.ts:948–964` in the release tag). Source
inspection proves the promise is not an animation-completion boundary. The
leaf waits for `open`/`close` events, and its private subclass catches failures
at `animateToPosition` to prevent fire-and-forget animation rejections. It
reports those through `onError` (or console error when omitted). No upstream
patch is carried. Reassess the workaround when upgrading: it can be removed
when upstream propagates animation completion/failure from every call site.

Duplicate searches on 2026-10-29 for `animateToPosition` and `open promise
animation` found no focused completion/failure issue. The former returned
[upstream #23](https://github.com/nativescript-community/ui-drawer/issues/23),
which concerns Vue3 component registration. No external report was submitted.

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function CheckedDrawer() {
	return <Drawer main={null} drawer={null} onError={(error) => console.error(error)} />
}
```

### Verified native lifecycle

The isolated iOS probe passed seven assertions on `skymac.local` using an
iPhone 17 Pro simulator (iOS 26.2): host discovery, default opening, attached gesture handler, 280-dip
panel width, main slot, native close, and the dismissal callback. The measured
host/main were 320×480 dips and the panel 280×480. This is native layout and
handler evidence; it does not qualify OS-input gestures or accessibility.
The probe runner seeds gesturehandler directly, so this run does not establish
clean transitive-only native plugin discovery. The mobile harness retains its
independent gesturehandler declaration for Motion.

The first runtime probe found that the host's initial layout could precede the
panel's readiness: defaultOpen stayed closed despite later valid slot bounds.
The wrapper now observes the panel's layout, defers its readiness check until
that event's listeners complete, and gates opening on the plugin's isSideReady.
The maintained mobile test covers initial opening after slot layout.

### Focused verification

- Drawer unit/component suites: ten passing tests across six native
  binding tests and four web tests, including focus wrapping and queued
  controlled-state acceptance. These use a fake native host and jsdom.
- Existing UI state-role suite: 17 web tests passed after moving Drawer coverage.
- Packed consumer: six declaration conditions passed; its web bundle excludes
  mobile plugins, and source-built iOS/Android UI barrels exclude drawer
  initialization with third-party native runtimes externalized.
- Targeted typechecks passed for UI, Drawer and the creator; the demos' required
  declaration generation passed. A complete dependent-app typecheck sweep was
  not repeated after the user's request to limit heavy checks.
- macOS on `skymac.local`: four AppKit probe assertions passed for mount,
  panel presence, close and reopen through explicit controls. These dispatch
  handlers; they do not establish OS input, appearance or accessibility parity.
- GTK leaf on Linux/GJS 1.80.2 through `andromeda.local`: importing the
  type-stripped GTK implementation succeeds without mobile dependencies and
  rendering throws the documented unsupported error. No GTK panel is claimed.
- Windows: export/declaration checks only; `ssh windy` confirmed tooling, but
  another qualification run owned the device. Android: unverified at the
  user's request. No release builds, images or release-size comparisons ran.

Repository recipe checking remains blocked by the existing missing
`motion-layout.tsrx` link in `motion-patterns.md`; the new `drawer` recipe has
no reported structural/link error. Existing unrelated changelog/CSS/parity
coverage failures were left unchanged. UI-barrel, compatibility and decision
mirror checks passed (the latter retains existing warnings).

### Remaining target qualification

Source and unit checks do not prove real edge drags, velocity/cancellation,
scroll arbitration, iOS Back-gesture coexistence, Android Back, RTL, rotation,
safe-area layout, VoiceOver/TalkBack focus isolation or reduced-motion OS
integration. The implementation currently uses a physical left edge, matching
the former wrappers; logical RTL edge selection remains a limitation. Web and
desktop have no edge recognizer. GTK4/GJS is not qualified by the Linux WebView
entry. Do not relabel these limitations as OS-native appearance or full parity.

Maintain packed consumer checks for the new package and unrelated UI platform
barrels, mobile startup/layout checks, and the existing Drawer parity fixture
in the owning leaf. Reserve build/device resources for native validation; no
release-size delta is claimed. Initial npm stub/trusted-publisher setup remains
a release prerequisite, not an authorized publication action in this task.

Follow-up acceptance criteria:

- A clean packed native consumer installs only the drawer package and its
  renderer peers, prepares/builds/starts successfully, and resolves the pinned
  gesturehandler version without an app-direct plugin declaration. Android
  remains unverified until a device is available; preserve Opals' pins meanwhile.
- Real mobile input opens from the edge, drags closed, cancels and settles at
  velocity, and emits one state request per user transition. Check controlled
  acceptance/rejection and scroll/system Back coexistence on each OS.
- Native screen-reader navigation isolates the open panel and restores focus;
  visible close controls work without gestures. Check OS reduced-motion,
  rotation and safe-area behavior separately from synthetic handler tests.
- Bootstrap the new npm package and trusted publisher before the first lockstep
  release. No compatibility aliases restore the removed UI exports.

Existing Silo feedback already records undeclared drawer declaration imports;
the initial GitHub drawer/ui-drawer searches found no focused duplicate. The
initial review recorded the additional initialization/appearance mismatch
locally. No external issue was submitted. Recipe `drawer` owns the standalone
contract; `navigation-shell` remains about AppShell/MobileNav, which do not
import this component.
