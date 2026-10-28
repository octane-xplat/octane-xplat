# Native drawer dependency review

Recommend retaining `@nativescript-community/ui-drawer` for opt-in mobile
gestures in a dedicated leaf package, removing its wrappers from the UI platform
barrels. Keep shared `Drawer` as the dependency-free choice. This applies the
existing leaf criteria (#51, #53, #60); it does not authorize implementation.
Decision #132 is provisional pending packed-consumer and native qualification.

Reviewed 2026-10-28 at `2368e3f29819effb109c107787b5de316184fdb1` (UI
0.18.0), with the relevant files unchanged at `1cf448ba4`. Opals evidence is
from alignment commit `e0330bf8`, published 0.18.0 by default and currently
linked to this checkout. Opals was read only. Evidence here is source and
existing development artifacts; no devices, screenshots, or release builds ran.

## Current boundaries

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

The common slot shape is visible in the existing shared API:

```tsx
import { Drawer } from "@octane-xplat/ui";

export function DrawerExample() {
  return <Drawer defaultOpen main={null} drawer={null} />;
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

## Smallest coherent follow-up

Prefer an opt-in `@octane-xplat/drawer` leaf with explicit mobile entry points.
It should own ui-drawer as a real runtime dependency, following #51/#60, with
an explicit compatible gesturehandler version policy. A separate optional
export inside UI could sever barrel reachability but would retain the
undeclared-plugin exception and complicate installation guidance. Adding the
plugin to UI would make native discovery costs apply to unrelated apps. A new
gesture engine or AndroidX-specific rewrite adds unnecessary implementation
and parity work before the current engine is qualified.

Acceptance criteria for a separately authorized implementation:

1. **Hard package boundary:** remove SideDrawer/DrawerLayout value and owning
   prop exports from UI platform barrels; put the native wrappers and types
   in the leaf. Do not leave compatibility re-exports that reconnect the graph.
   Retain current component names in the leaf if useful, while explicitly
   describing their custom implementation. Web/desktop remain on shared
   Drawer with the gesture difference documented; do not silently substitute it.
2. **Declared ownership:** a clean packed consumer installs the drawer leaf
   without app-direct ui-drawer/gesturehandler declarations. Verify one aligned
   gesturehandler version, transitive native discovery, native HTTP module
   resolution in development, and bundled startup on iOS and Android under
   supported package-manager layouts. Add an app-direct pin only if a specific
   reproducible tooling limitation requires it and record that limitation.
3. **No unused initialization:** a minimal packed LiquidGlass consumer and an
   unrelated Android-widget consumer resolve/build/start without the drawer
   leaf or plugins installed. Their development and release module graphs
   exclude ui-drawer and drawer-specific installation. Shared Drawer also works
   without the plugin. If another feature needs gesturehandler, do not claim
   its removal as a drawer saving.
4. **Honest lifecycle/state:** registration and installation occur only through
   the opt-in feature and are idempotent. Account for upstream's own import
   effects rather than marking side-effectful code pure. Reconcile controlled
   open state, initial/default state, gesture/backdrop dismissal callbacks,
   interrupted animations, errors, remount and disposal. Use the shared prop
   contract only where the actual behavior matches it.
5. **Mobile behavior:** qualify real edge drags, velocity/cancellation,
   scroll arbitration, iOS Back gestures, Android Back, RTL, rotation and
   safe-area layout. Qualify accessible open/close controls, focus entry/return,
   background accessibility isolation, VoiceOver/TalkBack and reduced motion.
   Handler dispatch alone does not pass OS-input criteria. Use nonvisual
   evidence unless visual analysis is separately authorized.
6. **Migration and guidance:** make the cutover a breaking Conventional Commit
   and release note with exact new imports/install steps. Update docs, wrapper
   comments, the primitives/known-limits skill references, mobile harness,
   packed-consumer assumptions and relevant navigation-shell recipe coverage.
   Check compatibility/upgrade manifests and starter tests; the current starter
   manifest already omits both plugins, despite the old note saying otherwise.
   Run affected packages/dependents typechecks through Turbo, focused packed
   checks, `pnpm check:recipes`, and required release/package checks.

Reserve native build/device resources for those follow-up phases. No release
size benchmark is needed to choose the boundary; a bounded paired release
build is appropriate only if quantitative savings become a release claim.

Existing Silo feedback already records undeclared drawer declaration imports;
GitHub issue searches for drawer/ui-drawer found no focused duplicate. This
review records the additional initialization/appearance mismatch locally. No
upstream issue was submitted: the confirmed defects belong to Xplat, and no
external report was authorized. No runtime/public workflow changed in this
review; recipe reconciliation and platform qualification remain acceptance
criteria rather than claimed passes.
