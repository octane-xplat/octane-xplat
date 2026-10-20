# Verify release navigation

Exercise the canonical client in production builds and inspect rendered text
and native objects. These checks capture no screenshots. Source checks, object
drivers, browser input, native callbacks and OS input establish different things.

## Run the checks

1. Install the locked workspace dependencies and build the web harness:

   ```sh
   pnpm install --frozen-lockfile
   pnpm --filter @xplat/web build
   node apps/web/scripts/navigation.ts
   ```

   The script serves `dist` on an ephemeral loopback port and drives Chromium.
   It checks the maintained app's named flows, Back/Forward, guard redirects,
   programmatic layouts, modal links, baked content and malformed URLs.

2. Run the isolated CSR contract fixture:

   ```sh
   pnpm --filter @xplat/web smoke:routing
   ```

   Its generated startup supplies the catalog, context, stacks and incoming-link
   policy. Before running Chromium, the runner checks both installed declarations
   and implementation types. No SSR host is used.

3. Reserve a native build slot and the chosen device when a host resource broker
   is available. Include the device's exclusive key and resident-device slot.
   List devices, then run the selected target:

   ```sh
   xcrun simctl list devices available
   adb devices -l
   python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
   python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
   ```

   Android needs JDK 21; the runner resolves it with
   `/usr/libexec/java_home -v 21`. The isolated project reuses installed patched
   dependencies and excludes optional service plugins. It has its own app ID,
   `org.nativescript.xplat.navigation`, and excludes the ordinary harness timers.

The native runner holds `/tmp/octane-xplat-ios.lock` or
`/tmp/octane-xplat-android.lock` through generation, build, installation, launch,
link delivery and collection. An occupied lock stops the run before device work.
To wait for it, use the explicit setting below. `build-only` checks compilation
and performs no runtime qualification.

```sh
XPLAT_NAVIGATION_WAIT_FOR_LOCK=1 python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android build-only
```

The runner refuses to overwrite a running fixture. It stops only its own app
and preserves other apps and their data. Android signs with an ephemeral key
and removes only this fixture afterward. This is no evidence of production
signing. Shut down any simulator or emulator you started before releasing its
resource reservation.

```text
apps/mobile/navigation-results/ios/result.json
apps/mobile/navigation-results/android/result.json
```

On iOS, the runner uses `simctl install/openurl`. Some simulator versions ask
before opening a scheme URL. With `idb` installed, the runner reads accessibility
metadata and accepts only this fixture's confirmation button. No image analysis
or shared desktop input is needed.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
```

## Guarded browser history and native event contracts

The history refinement passed **130 core/DOM/public-consumer tests**, **74
production Chromium checks**, **59 native object-driver tests** and the
**53-task** package/dependent type gate. Browser checks cover guard denial on
Back/Forward, fresh account data after admission, direction-preserving retry,
redirects, render failure, overlap, owner replacement, missing outlets and
foreign-history correction. Correction falls back to the admitted URL and a
new owned base if the browser refuses or fails to acknowledge the traversal.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/browser-router-host.web.test.tsrx src/router-instance.test.ts src/routing-core.test.ts src/default-router-runtime.test.ts src/routing-package.test.ts src/browser-route-transitions.web.test.ts
node apps/web/scripts/routing-contract.mjs
```

Fresh native release runs passed **184 iOS** and **196 Android assertions**.
They confirm that adding a cancellation field to Page/Frame lifecycle
notifications does not veto engine Back. The iOS case also checks the native
edge recognizer after disabling `enableSwipeBackNavigation`. These are SDK
lifecycle/property checks, not OS gesture or asynchronous guard qualification.
The remaining native retained-history integration is explicit in the
[routing contract note](../../.agents/docs/notes/routing-contracts.md#nativescript-back-notification-limitation).
No fresh AppKit/Linux runtime was run for this refinement; Windows has no VM.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

A temporary probe copied the harness's URL schemes into its distinct app ID and
intercepted the iOS launch URL. Text accessibility identified the wrong app's
confirmation. Removing only that task-owned probe installation and its stale
confirmation allowed the maintained run to pass. Check installed scheme owners
when a fixture builds but never reports startup; do not accept another app's
dialog. The owned simulator and emulator were shut down after the runs.

## Guarded retained panes

Rendered-pane Back passed **62 native object-driver tests**, **121 AppKit
native-view checks**, **187 iOS release assertions**, **199 Android release
assertions** and the **50-task** package/dependent gate. Denial keeps the current
pane visible. An admitted retry reruns the loader while preserving retained
view identity, providers and local state. Same-flow redirects start new local
state; superseded history guards cannot reveal their old target. Packed
exports, lint and recipe-link checks also pass.

```sh
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/render-router-host.mobile.test.tsrx src/native-router-host.mobile.test.tsrx src/native-modal-router-host.mobile.test.tsrx src/router-hooks.mobile.test.tsrx src/client-route-entry.mobile.test.tsrx
node apps/macos/test/verify-routing.mjs
```

Frame/OS Back, native modal-dismissal preparation and cross-stack pane redirects
remain outside this completed pane increment. Linux and Windows have source/type
evidence, with no Windows VM available. Native fixture callbacks and AppKit
object checks do not establish OS hit-testing or gesture behavior. The owned
simulator and emulator were shut down after qualification.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

## Guarded Frame Back

The Frame refinement passed **65 native object-driver tests**, **131
core/DOM/public-consumer tests**, **74 production Chromium checks**, **197 iOS release assertions**, **210 Android
release assertions**, **121 AppKit checks**, and the **50-task** dependent gate.
The mobile fixture checks guard refusal without an engine pop, fresh account
data, retained Page/local-state identity, redirected candidate staging and
preservation after render failure. Android's fourth real OS Back press verifies
that a guard refuses before the Activity can pop the Frame. Packed exports and
the declaration graph pass.

```sh
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/native-router-host.mobile.test.tsrx src/render-router-host.mobile.test.tsrx src/native-modal-router-host.mobile.test.tsrx src/client-route-entry.mobile.test.tsrx src/router-hooks.mobile.test.tsrx
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

The original runs qualified programmatic iOS Back. Later checks below cover
[prepared history redirects and guarded dismissal](#prepared-history-redirects-and-guarded-dismissal)
and [iOS Frame edge Back](#qualify-ios-frame-edge-back). Interactive previews
and external native modal-dismissal interception remain unqualified.
The iOS run used the owned iPhone 18 Pro/iOS 27 simulator; Android used the owned
emulator. Both were shut down after qualification. Linux/Windows evidence is
source/types for this increment, and Windows has no VM.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
node apps/macos/test/verify-routing.mjs
```

## Declared and runtime contract checks

The contract refinement passed 138 focused core/DOM/public-consumer tests,
52 native host object-driver tests, three native hook checks, and eight CLI
generation checks. The consumer fixture rejects unsafe DTO reads, erased
catalog maps, computed declared paths and incompatible default setup. Shared
renderer cases check explicit-instance ownership and missing-instance errors.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts src/router-instance.test.ts src/route-registry.test.ts src/define-route.test.ts src/router-hooks.web.test.tsrx
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/router-hooks.mobile.test.tsrx
node --test packages/cli/test/route-generation.test.mjs
```

After migrating the fixtures to immutable declared contracts, production
Chromium again passed 38 checks, iOS passed 130 release assertions and Android
passed 143. Runtime registrations install genuinely new paths; failed rendering
uses separate declared failure routes. The package/dependent type gate passed
53 tasks, including macOS, Linux and Windows source checks. Packed exports and
the declaration graph passed. These are not fresh desktop runtime runs;
Windows still has no VM available.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/cli --filter=...@xplat/mobile --concurrency=2
pnpm --filter @octane-xplat/ui pack:check
```

## Runtime destinations from data

The runtime-destination refinement passed 92 focused core/DOM/consumer tests
and 54 native host/hook object-driver checks. Two additional activation-time
guard and redirect cases passed in the final 67-test core/DOM subset. These
check async search validation, cancellation, opaque ownership, stale registry
handling, and real `NavLink` components consuming the intact value through `to`.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/routing-core.test.ts src/router-instance.test.ts src/default-router-runtime.test.ts src/validated-destination.web.test.tsrx src/routing-package.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/validated-destination.mobile.test.tsrx
```

Production Chromium passed **44 checks**, iOS passed **134 release assertions**,
and Android passed **147**. The browser fixture uses actual pointer activation;
the new native checked-link cases dispatch installed tap observers and do not
establish OS hit-testing. Validation leaves loading and pending UI untouched;
activation rechecks authorization and current definitions. The 50-task
UI/mobile/web dependent type gate passed, as did generated declarations and
packed exports. Desktop evidence for this refinement is source/type checking;
Windows has no VM. Owned simulators/emulators were shut down afterward.

```sh
pnpm --filter @xplat/web smoke:routing
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@xplat/mobile --filter=...@xplat/web --concurrency=2
```

## Scoped search editing

The search-editing refinement passed **50 focused core/DOM/consumer tests**,
four native renderer hook checks and eight CLI generation checks. The public
consumer suite repeats its full negative contract checks with web module
suffixes enabled. The production fixture checks both installed declarations
and authored sources, preventing hook forwarding from silently erasing types.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/router-instance.test.ts src/router-hooks.web.test.tsrx src/routing-package.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/router-hooks.mobile.test.tsrx
```

Runtime checks passed **50 Chromium**, **140 iOS**, **153 Android** and **56
AppKit** assertions. They cover default search replacement, opt-in history push,
Back restoration, loader reruns, removed/defaulted fields and stale-entry
refusal. AppKit uses real native views without opening a window. Native hook
callbacks and object drivers do not establish OS input or assistive-technology
behavior. Linux and Windows have source/type evidence for this refinement;
Windows has no VM. Owned mobile devices were shut down after qualification.

```sh
node apps/web/scripts/routing-contract.mjs
node apps/macos/test/verify-routing.mjs
```

The AppKit fixture also migrated its synthetic file catalog to generated-style
sealing and declares render-failure routes in its initial catalog. It no longer
asserts catalog evidence or replaces a declared path at runtime.

```ts
const catalog = sealGeneratedRouteCatalog<FileContracts>(globManifest)
```

## Typed navigation components

The component refinement passed **43 distinct browser DOM tests** across
focused navigation, menu, tab, link and hook runs. Native object rendering
passed **20 tests**. The public package consumer checks valid and
invalid inputs, readonly arrays, nested links, explicit instances and opaque
values, including web module-suffix resolution. A cancellation test confirms
that a prevented menu selection neither loads nor closes its surface.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/navigation-item.web.test.tsrx src/menu-family.web.test.tsrx src/tablist.web.test.tsrx src/nav-link.web.test.tsrx src/router-hooks.web.test.tsrx src/routing-package.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/navigation-item.mobile.test.tsrx src/validated-destination.mobile.test.tsrx src/router-hooks.mobile.test.tsrx src/menu-family.mobile.test.tsrx src/tablist.mobile.test.tsrx
```

Production checks passed **62 Chromium**, **164 iOS**, **177 Android**, and
**101 AppKit** assertions. Chromium exercises twelve composed link surfaces,
including keyboard activation in top-bar menus. The mobile release apps activate eight composed component kinds through real
native controls. AppKit also checks standalone `NavLink` with a provider-bound
opaque destination, for nine kinds. They verify prepared data and owning-flow
navigation. AppKit uses
accessibility actions without opening a window; mobile fixture handler checks
do not establish OS touch/hit-testing. Linux and Windows have source/type
coverage for this refinement; Windows runtime remains unavailable.

```sh
node apps/web/scripts/routing-contract.mjs
node apps/macos/test/verify-routing.mjs
```

## Loading and recovery feedback

The feedback refinement passed **100 distinct core/DOM tests** across focused
runs, **21 native object/renderer tests**, the public consumer type fixture,
the **50-task** dependent typecheck gate, lint and packed-declaration checks.
The consumer fixture rejects the removed nullable pending field, mutable
feedback params, and result/data reads before narrowing. Shared renderer cases
reject ambient typed reads under custom catalogs while allowing inherited
status and Back availability.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/router-instance.test.ts src/default-router-runtime.test.ts src/router-hooks.web.test.tsrx src/nav-link.web.test.tsrx src/navigation-item.web.test.tsrx src/menu-family.web.test.tsrx src/tablist.web.test.tsrx src/routing-package.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/router-hooks.mobile.test.tsrx
```

Runtime checks passed **67 production Chromium**, **167 iOS release**, **180
Android release**, and **107 AppKit native-view** assertions. Browser checks
cover visible pending/error feedback, retained content/URL, a real Retry
button, and recovery from a failed cold CSR load without extra history. Mobile
checks observe real native label updates and independent flow feedback while
a loader waits/fails. AppKit checks recovery state after failed staging while
retaining the native view. Mobile handler/native-object evidence and AppKit
accessibility actions do not establish OS touch or keyboard behavior. Linux
and Windows have source/type evidence for this refinement; no Windows VM was
available. The owned mobile devices were shut down afterward.

```sh
node apps/web/scripts/routing-contract.mjs
node apps/macos/test/verify-routing.mjs
```

## Browser root-owner teardown

The root-owner fix passed **71 focused browser/core tests**, **69 production
Chromium checks** and the **50-task** dependent typecheck gate. A runtime
regression first demonstrated that ended roots retained prepared DTOs. It now
checks that teardown clears current/saved route data and owned Back state,
that old saved data cannot return, and that a new root reloads the current URL
once with fresh context, fresh local state and unchanged browser history length.
The queued bootstrap is tied to its mounting lifetime. Browser URLs and
application-owned stores are preserved.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/browser-router-host.web.test.tsrx src/router-instance.test.ts
node apps/web/scripts/routing-contract.mjs
```

Only browser runtime behavior changed. Native targets retain the preceding
167 iOS / 180 Android / 107 AppKit runtime evidence, with fresh source/type
checks for this change. Linux and Windows have source/type evidence; no Windows
VM was available. Temporary ordinary-component key probes passed DOM and
native object-driver lifetimes, but immediate keyed NativeScript outlet
remounts during Frame restoration remain unqualified.

## Refined browser adapter check

The canonical production Chromium fixture passed **38 assertions** on
2026-10-19 after removal of the old router implementation. It verifies validated
search and guard context, one initial loader/context read, DOM commitment before
navigation resolves, refresh identity, replacement, Back/Forward, nested modal
flows and dismissal. Failed render candidates preserve content, URL and history.
It also checks generated startup, named Tabs and configured incoming schemes,
plus real View Transition completion, custom forward/Back types, animated modal
retention, overlapping animation, reduced motion and unsupported-browser skips.

```sh
node apps/web/scripts/routing-contract.mjs
```

Window scroll restoration, decoded fragments, modal scroll preservation, direct
preparation, and title/meta restoration have separate jsdom coverage. That is
DOM evidence rather than browser scrolling or assistive-technology qualification.
Browser host/coordinator tests also cover deferred callbacks and supersession.
Native custom Frame transitions have the separate release evidence below.
NativeScript `view` content motion for routed modals and retained panes, and
AppKit routed-modal content motion, are covered by the release fixtures noted
below. GTK and Windows report the `view` subset as `skipped`/`unsupported`;
Windows has no VM here, so that path has source/type evidence only.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/browser-route-transitions.web.test.ts src/browser-router-host.web.test.tsrx src/route-scroll.web.test.tsrx src/route-tabs.web.test.tsrx src/nav-link.web.test.tsrx
```

## Refined native adapter checks

The native transition refinement passed **130 iOS** and **143 Android** release
assertions on 2026-10-19. The iOS run used the available iPhone 18 Pro simulator
on iOS 27.0. The fixture supplies a custom NativeScript `Transition` instance,
checks actual forward/reverse engine hooks and confirms a single factory call
per entry plus retained Page state after Back. Android additionally records
animator start/end callbacks; no visual capture or analysis is involved. The
release fixture also drives `view` content motion: it asserts custom starting
values and intermediate opacity on the router-owned modal GridLayout and the
pane `masonview`, settled `finished` results, restoration to neutral values,
forward/Back directions and dismissal interruption. `page` factories remain
Frame-only; the `view` executor never targets an application screen.

```text
iOS: ios:1 -> ios:2
Android: enter/exit start+end -> popEnter/popExit start+end
```


The canonical release fixture passed **124 assertions on iOS** and **137 on
Android** on 2026-10-19. It checks explicit instances and generated default
startup, cold/warm scheme delivery, structured guard/loader outcomes, retained
Pages and panes, provider updates, independent histories, refresh, replace,
reset, Back and owner cleanup. Modal checks cover multiple screens, nested
surfaces, dismissal, retained state and failed root takeover.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

Shared Tabs checks preserve inactive pane state and bind navigation to the
rendering flow. The iOS platform-tab sequence checks item identity and named
Frame histories. Native callback dispatch establishes those callback paths;
it does not establish physical tab hit-testing.

```text
Tab selection → owning pane → prepared entry → rendered commit
Back within modal → previous modal entry
Dismiss modal → retained presenter
```

Android additionally sends three real OS Back key events, covering an internal
modal step, dismissal at its base and restoration of a root Page. The retained
pane checks also exercise activity Back against the visible pane while a hidden
pane retains its own history. Predictive gestures and physical buttons remain
unverified.

```text
Activity Back → interceptors → top modal → visible Frame/pane → OS fallback
```

## AppKit retained panes

Build the framework's Mason facade against its pinned engine source and provide
the dylib path. The fixture checks its consumer types, builds production JS and
runs the JavaScriptCore/AppKit host. A missing library fails explicitly.

```sh
bash packages/macos-renderer/native/xplatmason/build.sh MASON_SOURCE_DIRECTORY
XPLAT_MASON_LIB="$PWD/packages/macos-renderer/native/xplatmason/libxplatmason.dylib" \
  pnpm --filter @xplat/macos test:routing
```

The current canonical fixture passed **202 checks** with a locally built
engine. Actual NSView checks cover visibility, identity, providers, retained
state, history, failed-candidate rollback, Tabs, owner cleanup, generated
client startup and the AppKit modal adapter. The public standalone pane host
explicitly refuses modal requests; the default AppKit client composes a separate
modal adapter. These are controlled native-view/surface checks, without window
focus, OS hit-testing or packaged engine-discovery qualification.

```text
ROUTING_FIXTURE_OK checks=202
```

### AppKit custom pane motion

The current fixture passes **202 native-view checks**, including 15 new
assertions/waits for the public `defineAppKitTransition` helper. They read an
intermediate opacity, separate navigation from animation completion, restore
neutral wrapper values, reverse Back on the retained view, contain factory
failure, keep simultaneous pane effects independent, and interrupt/restore on
owner removal. The fixture enables motion explicitly for deterministic samples;
system reduced-motion skips and live preference changes use deterministic tests.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/appkit-route-transition.test.ts
pnpm --filter @xplat/macos test:routing
```

The helper uses the existing numeric controller and AppKit writer. These are
actual native property checks; they do not establish OS input, frame pacing,
outgoing snapshots, modal-surface motion or native GTK effects. See the
[engine note](../../.agents/docs/notes/routing-transitions.md#appkit-retained-pane-executor)
for the observed animation-proxy limitation and the local executor boundary.

## Linux WebKitGTK

The canonical production bundle passed **13 maintained harness checks** on
2026-10-19 in a Linux container using GTK/WebKitGTK and Xvfb. These cover mount,
counter input, textarea input, retained tabs, routed counter/Back, virtual-list
states, sheet/overlay dismissal and absence of unhandled errors. Run the built
host with the maintained harness script on a Linux machine with its documented
GJS, GTK, libadwaita and WebKitGTK dependencies installed:

```sh
pnpm --filter @xplat/linux build
XPLAT_PROBE_APP_ID=org.octane.xplat.routing.cutover \
XPLAT_SELFTEST_SCRIPT="$PWD/apps/linux/host/harness-selftest.web.js" \
xvfb-run -a dbus-run-session -- \
  apps/linux/dist/linux/octane-xplat/octane-xplat --self-test
```

The run reused cached image
`sha256:250e217a92c1b39a7251f0267159ef014512a36f9b730a77b0cdabe5dd1f166b`
with read-only bundle/script mounts, networking disabled, and software rendering.
It did not install packages in the existing guest, which lacked the required
typelibs. The host served the app at `xplat://localhost/`. The check dispatches
DOM handlers inside the actual Linux host; it does not prove OS pointer/keyboard
delivery or the separate native GTK renderer.

```text
SELFTEST_RESULT {"checks":13,"failed":[]}
```


## Native GTK retained panes

The experimental GTK renderer has a separate maintained fixture using public
routing imports and the exact example in the GTK guide. Build assertions reject
NativeScript Frame/modal integration in its module graph; consumer type cases
reject unknown paths, missing/wrong params and undeclared flows. These checks do
not depend on a Linux runtime.

```sh
pnpm --filter @octane-xplat/linux-gtk typecheck
node --test packages/linux-gtk-renderer/test/build.test.mjs
pnpm --filter @octane-xplat/linux-gtk exec vite build --config test/fixtures/vite.routing.config.mjs
```

On a Linux host with GJS, GTK4, Xvfb and D-Bus, execute the resulting module.
The command uses GTK metadata and emitted signals; it captures no images.

```sh
xvfb-run -a dbus-run-session -- gjs -m packages/linux-gtk-renderer/test/fixtures/dist/routing/app.js
```

The GJS 1.82.3 / GTK 4.18.6 check passed **13 assertions** on Debian 13 arm64:
route commits, GTK rendering, event-driven local updates, hidden retained entries,
Back with widget/state identity, explicit modal rejection preserving the screen,
and native child disposal. The owned `gtk-smoke` VM was stopped afterward.
Its Mason typelib is absent, so this is Gtk.Box fallback evidence; the native
Mason layout test remains skipped. It does not qualify geometry, visual parity,
OS input, Wayland, generated GTK startup, window lifecycle or the complete shared
UI. The independent pane host reports skipped motion and has no modal surface.
The main Linux WebKitGTK host retains its separate browser-routing evidence.

## Replace an outlet owner

The owner-remount regressions cover a new native outlet navigating while its
old Frame returns to the declaring Page, and delayed cleanup notifications
that must not cancel the new owner's attempt. Run the focused suite with:

```sh
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/native-router-host.mobile.test.tsrx src/native-modal-router-host.mobile.test.tsrx src/router-hooks.mobile.test.tsrx
```

The suite passed **48 checks**. The release fixture replaces an owner with fresh
account context, repeats the replacement while a routed modal is open, and
checks new screen identity and Back availability. Release runs passed **174 iOS**
and **187 Android** assertions. The AppKit fixture passed
**112 checks**, including a common keyed owner ending both root and named panes.
These checks inspect native objects and data; they do not inspect visual
animation snapshots or establish OS hit-testing.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
node apps/macos/test/verify-routing.mjs
```


## Baked types and runtime data

The baked refinement passed **27 CLI checks** for strict JSON, inferred
named/default sibling output, Markdown contracts, type-only generation and
preservation of the previous valid artifact after an invalid bake.

```sh
pnpm --filter @octane-xplat/cli build
node --test packages/cli/test/route-data.test.mjs packages/cli/test/route-generation.test.mjs
```

Production checks passed **14 web**, **180 iOS**, **193 Android** and **118 AppKit**
assertions. They include rendered baked data, rendered Markdown and Back to the
declaring content. Mobile and AppKit release output excludes the fixture's
build-only marker. The generated catalogs contain no executable sibling loader
imports. Type fixtures import a throwing Node-dependent sibling without running
it. Linux and Windows have source/type evidence for this refinement; Windows
runtime remains unavailable.

```sh
pnpm --filter @xplat/web build
node apps/web/scripts/navigation.ts
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
node apps/macos/test/verify-routing.mjs
```

## Callable Standard Schema search validation

Run the contract regressions from the repository root:

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/define-route.test.ts src/route-table.test.ts src/routing-core.test.ts src/router-instance.test.ts src/routing-package.test.ts
```

The callable-schema cases exercise synchronous and asynchronous protocol
success and failure through programmatic and named-file catalogs, selecting
web, iOS, Android, mobile, macOS, Linux and Windows leaves in the host-free
preparation engine. They assert numeric validated data and no guard/loader work
on protocol issues; the ordinary callable returns a deliberately different
value and must never run. Public consumer fixtures separately check distinct
schema input/output types for callable programmatic and file definitions.
The combined run passed 155 tests. Explicit strict checks of the source fixture
and the guide schema, all 50 UI/dependent tasks, and the packed export/declaration
graph passed. The navigation skill was reviewed; its existing parser guidance
remains valid. These are core execution and compiler checks, not device or
browser-host runs.

The record-output follow-up passed 97 core/consumer tests, 19 generated-contract
tests and seven generation/consumer fixtures against a fresh UI tarball. Its
negative cases include scalar schema output, a callable hiding scalar protocol
output, and array/Date parser output. A valid callable with a scalar ordinary
return retains its object protocol output. Generated checks run under web,
native, macOS, Linux and Windows conditions. All 53 UI/CLI dependent tasks and
the packed declaration/export graph passed. The 1,024-route benchmark passed
all five compiler conditions (1.77–1.82 seconds for compilation); these timings
describe TypeScript, not target runtime speed.

## Account changes and sign-in returns

Run the shared controlled sign-in example in unit tests and production Chromium:

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/authentication-routing.web.test.tsrx
pnpm --filter @xplat/web smoke:routing-auth
```

The four Octane DOM renderer/jsdom cases and **20 production Chromium checks**
use the same maintained example. The browser command typechecks its sources,
builds the DOM client, visits a private URL, and exercises cold/warm links,
expired sign-in/retry, Back/Forward after expiry and an account switch, modal
cancellation with a late SDK result, modal success, malformed/untrusted returns,
and cleanup. Protected loaders never run on denied traversal; accepted returns
load current-account data once and replace the login entry. A return started
by the retiring owner is cancelled; its replacement consumes the intent once.

The example mounts an explicit browser-host instance and supplies controlled SDK
promises. This qualifies production DOM, browser history and owner lifetimes;
it does not exchange credentials with an identity provider or establish a
generated application's provider integration. The
canonical generated cold-start path has the separate main routing check.

The native routing commands on this page also run a renderer-neutral controlled
sign-in example on the actual iOS/Android Frame and modal hosts, and AppKit
retained views and panels. The 18 assertions cover guard denial before loading,
expired sign-in and retry, replacement-owner return exactly once, warm URL
requests, expiry releasing private views/history, modal cancellation with a late
SDK result, modal success, invalid return text, and cancellation of a return
whose loader ignores its signal. Application-owned load records remain intact.
The full fixtures pass **267 iOS, 264 Android and 243 AppKit checks**, including
their other navigation cases and settlement waits. The native object-driver
suite passes 79 tests, including this same authentication protocol.

```sh
pnpm --filter @octane-xplat/ui test:native
```

These native auth checks request URLs in an already running application and
control sign-in callbacks. OS-delivered cold/warm links have separate host
evidence; their combination with a real identity provider, OS authentication
dialogs, physical input and assistive technology remains unqualified. Windows
has no runtime evidence.

## What counts as evidence

A native report must finish with `pass: true` and every assertion must pass.
A successful build or live process alone is insufficient. Keep failed attempts
and their diagnostics when a later run succeeds; investigate intermittent
failures rather than erasing them from the record.

```json
{ "target": "android", "results": [], "pass": true }
```

The abbreviated shape above shows the success field; a real accepted report
contains the named assertions. Logs and full JSON reports are gitignored under
the target's results directory. Timeouts, occupied resources, unavailable SDKs
and missing devices are unsuccessful runs, never runtime passes.

```sh
cat apps/mobile/navigation-results/android/result.json
```

Windows has no VM in this task and is checked through source/types only. The
Linux result above qualifies the WebKitGTK host within its stated limits.
Rendering error boundaries have separate component tests;
the native navigation fixture does not qualify every renderer boundary,
accessibility behavior or unrelated UI component.

```sh
pnpm typecheck:windows
pnpm typecheck:linux
```


## Prepared history redirects and guarded dismissal

The prepared-handoff refinement passed **134 core/DOM/consumer tests**, **68
native object-driver tests**, and **79 production Chromium checks**. Browser
checks exercise both imperative Back and actual browser history traversal into
a modal redirect without restoring the rejected target.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/routing-core.test.ts src/router-instance.test.ts src/browser-router-host.web.test.tsrx src/router-hooks.web.test.tsrx src/default-router-runtime.test.ts src/routing-package.test.ts
node apps/web/scripts/routing-contract.mjs
```

Fresh release runs passed **210 iOS** and **223 Android assertions**. They check
Frame-to-pane redirects, modal history redirects, unchanged source Page/history,
one prepared loader result, refusal to dismiss a modal after presenter denial,
and retained presenter state with fresh account data on retry. Nested dismissal
refreshes the existing parent modal. Android also exercises OS Back guard denial.
The AppKit fixture passed **126 native-view checks**, including cross-pane
history redirects with an unchanged source view/history and one loader result.
These checks predate the [iOS Frame edge qualification](#qualify-ios-frame-edge-back)
and do not establish native modal-dismissal gesture interception.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

The dependent type gate passed **50 tasks**, including platform programs, and
the UI packed declaration graph passed. Linux and Windows have source/type
evidence for this refinement; there is no Windows VM. The earlier Linux
WebKitGTK runtime result remains historical.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@xplat/mobile --filter=...@xplat/macos --concurrency=2
pnpm --filter @octane-xplat/ui pack:check
```


## Programmatic baked data types

The programmatic baked-map refinement passed **89 focused tests** and **nine
CLI generation checks**. Installed and source declarations retain the DTO for
each map key, including root and normalized parameter patterns. Generated default
registration and explicit instances infer the same data. Negative fixtures
reject invented fields, optional/missing map proofs, extra destinations and
caller-selected baked metadata without actual input. A runtime live/baked mode
retains its output union, and erased optional loaders remain unknown.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/route-table.test.ts src/define-route.test.ts src/routing-core.test.ts src/routing-package.test.ts
node --test packages/cli/test/route-generation.test.mjs
pnpm --filter @octane-xplat/ui pack:check
```

The **53-task package/dependent gate** and UI packed declaration check passed.
This refinement changes type metadata only. Platform programs are checked by
the package/dependent gate; these checks do not claim new browser/device runtime
behavior for the programmatic map example. The earlier rendered baked-file
checks remain separate evidence.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/cli --filter=...@xplat/mobile --concurrency=2
```


## Qualify iOS Frame edge Back

The iOS 27 release fixture passed **225 assertions**. Real idb edge swipes enter
the canonical router on root and selected-tab Frames. Guard denial preserves the
current Page/history; an admitted swipe loads fresh account data before revealing
the retained target. Short drags do not prepare navigation. Full-content drags
cannot bypass preparation because router-owned Pages disable UIKit's built-in
pop gestures. The adapter uses NativeScript pan observation and starts the native
Back transition after release and admission; it provides no interactive preview.

```sh
# Requires an owned iOS 26+ simulator and idb. No images are captured.
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
```

The runner sends each requested OS swipe once and acknowledges it through the
fixture's own phase file. Ten focused tests additionally cover cancelled,
reversed and stale drags, duplicate requests, teardown, owner isolation and RTL
direction. Those tests do not qualify OS RTL, scrolling-control arbitration or
assistive input. Rendered-pane swipe Back, native modal-dismissal interception
and general unsaved-change blocking remain separate work. Six raw UIKit delegate
checks run after canonical disposal as boundary feasibility evidence; they do not
resume an interactive pop. The original isolated probe app crashed before case
execution and supplies no gesture evidence.

```text
completed OS edge drag → release → current guards/loaders → admitted Frame Back
                                         ↓ denial
                                  source Page retained
```

## Keep native modal dismissal guarded

The final iOS source passed **227 assertions twice** without callback diagnostics;
Android passed **224 assertions**. The runner waits for native input readiness
before sending each OS action. The 28 native modal tests, 10 gesture tests,
50-task dependent typecheck gate and packed declaration/export check passed.

Routed native modals use fullscreen presentation with direct SDK cancellation
disabled. The iOS fixture checks the native `modalInPresentation` flag and sends
a real downward OS drag while presenter access is denied; the modal and presenter
must stay in place without another load. Android sends a fifth actual OS Back
press while access is denied, proving that the owner-scoped Back handler still
prepares the presenter with SDK cancellation disabled. An admitted retry then
refreshes the presenter once and closes normally. Forced native closure remains
a cleanup reconciliation path, not guarded user navigation.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

NativeScript 9.1.3 uses the cancellation option for iOS presentation blocking and
Android outside-touch cancellation. It does not make the Android DialogFragment
non-cancelable; the existing claimed Back event remains necessary. These checks
do not establish interactive sheet dismissal, predictive Back animation or an
unsaved-change blocker.

## Unsaved navigation confirmation

The maintained production/browser and native fixtures passed **88 Chromium**,
**238 iOS**, **235 Android** and **142 AppKit** checks. Browser pointer actions
choose Keep editing or Leave screen; held requests do not read context, load,
change the committed URL or replace source state. Approval reads current account
context once. Browser Back/Forward refusal corrects URL position; a later attempt
can proceed in its original direction.

```sh
node apps/web/scripts/routing-contract.mjs
```

Native release checks use real iOS edge swipes and Android Back key events, then
invoke confirmation controls programmatically. They verify refusal before any
pop/load, fresh retained-target data after approval, inactive older-entry
isolation, obsolete controls and modal-owned confirmation. AppKit checks actual
retained native-view identity and releases held work during forced owner cleanup.
These checks do not establish native confirmation-button hit-testing, OS RTL,
predictive animation, interactive modal dismissal, document unload or process exit.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
node apps/macos/test/verify-routing.mjs
```

Focused controller/protocol tests cover multiple registrations, reset, removal,
supersession, registry change, disposal and context snapshot timing. The same
hook cases run through DOM and native object renderers, including duplicate-href
entry identity. Consumer types require boolean conditions and blocked-state
narrowing; they reject fabricated loader DTOs and unvalidated search assumptions.
Linux WebKitGTK passed 16 handler-driven checks in the actual production WebView
under Xvfb, including Test → Unsaved edits, retained editor identity on refusal,
and admitted Back. The harness script is `apps/linux/host/harness-selftest.web.js`;
this does not qualify OS input or the separate GTK/GJS renderer. The 50-task
dependent typecheck gate passes. Windows evidence is source/types; no VM was available.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/navigation-blocker.test.ts src/router-instance-blocker.test.ts src/router-instance.test.ts src/router-hooks.web.test.tsrx src/browser-router-host.web.test.tsrx src/routing-package.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/router-hooks.mobile.test.tsrx
```

## AppKit routed modals in an attached window

The maintained AppKit fixture now attaches its route tree to a real NSWindow
and passes **171 assertions**. It checks hidden staging without stealing focus,
source-provider inheritance, separate modal history, nested dismissal, guarded
Escape callbacks, unsaved confirmation, retained presenter state, raw host
closure and whole-owner cleanup. AppKit modal effects report skipped separately
from successful navigation. No screenshots were captured or inspected.

```sh
node apps/macos/test/verify-routing.mjs
node apps/macos/test/verify-overlays.mjs
```

The renderer's **285 tests**, including per-view native-layout reentry and hidden
surface focus/input ownership, pass. Native Escape/outside callbacks and
confirmation controls in the routed fixture are invoked programmatically;
keyboard/pointer hit-testing and accessibility are not established by these checks.
Other platform adapters did not change in this increment. Their earlier runtime
evidence remains separate, and Windows still has no runtime VM.

```sh
node --test packages/macos-renderer/test/*.test.ts
```

The existing standalone overlay runner stopped before its assertions because
its window did not become key (`key=false`, `main=false`). A temporary run with
automation suppression disabled, under an exclusive desktop reservation, had
the same result. No existing-overlay runtime pass is claimed for this increment;
its unit coverage and the attached routed-modal checks passed independently.
No acceptance criteria were relaxed to bypass that prerequisite.

## Qualify route-generation watching

The generation/watch checks exercise real filesystem changes and the built CLI.
They add, rename, remove and recreate source trees; repair configuration and
missing modules; reject silent output relocation; retain last-good artifacts on
failure; and ensure cancelled baking cannot publish late data. The dev fixture
starts a real Vite HTTP server and verifies contract updates and process shutdown.
It launches no browser engine and captures no images.

```sh
pnpm --filter @octane-xplat/cli build
node --test packages/cli/test/route-watch*.test.mjs packages/cli/test/route-generation*.test.mjs packages/cli/test/route-data.test.mjs
node --test packages/cli/test/web-targets.test.mjs
```

Web target detection checks all six conventional Vite configuration formats
against the installed Vite public loader. CLI dev/build selection and agent
workspace/platform discovery agree. The real CLI dev-watch fixture uses an
ES-module JavaScript config, serves HTTP, observes a route addition and verifies
server shutdown. This is Node/filesystem/HTTP evidence, without a browser engine.
The focused config/watch run passed nine tests; discovery/server/dev-bridge
regressions passed 21 tests. The CLI dependent type gate passed 46 tasks. These
results were collected on macOS and do not establish Windows process behavior.

The dependency-free watch lifecycle cases also run in a Node 22 Linux container
against its own filesystem. That is Linux watcher/cancellation evidence; it does
not establish Linux Vite rendering or device HMR. Windows has source/type checks
and no runtime VM. Network/virtualized filesystem delivery remains a separate
qualification. The owned-process group tests skip Windows rather than claiming
POSIX cleanup there.

```sh
node --test packages/cli/test/route-watch-lifecycle.test.mjs
```

The final local generation/watch suite passed 43 tests on macOS/Node, including
the built CLI and real Vite server. Four lifecycle cases passed separately in
the Linux Node 22 container. The CLI/app dependent gate passed 46 tasks; these
results do not establish target-renderer HMR or Windows process/filesystem behavior.

A separate live Chromium/Vite check now covers generated startup, editing the
active screen, adding/renaming/removing file routes, and changes to configured
context and programmatic routes. Seven DOM/runtime assertions passed with seven
generation passes and six document loads. Every changed destination resolved and
rendered through the generated client without restarting the server; removed
destinations stopped matching. Browser and generation error arrays were empty.

```sh
pnpm --filter @xplat/web smoke:routing-watch
```

The fixture uses the real watcher and generator against its own temporary files,
then closes the browser, Vite server and watcher before deleting them. It captures
no images and stays outside the lightweight PR gate. The observed document reloads
mean this does not establish retained component state during development updates.
Native/device HMR remains unqualified by this browser check.

The TSX fixture also produced a nonfatal dependency-scan warning in Vite 8.3.0:
the scanner tried to resolve the types-only JSX facade as a runtime entry. Vite
skipped dependency pre-bundling and all seven routing assertions passed. This is
an outstanding toolchain warning, not a warning-free dev-server qualification.
The [toolchain note](../../.agents/docs/toolchain.md#tsx-dependency-scan-warning)
records the narrow reproduction and evidence limits.

## Check platform route contracts

The maintained generation fixture checks incompatible loader, search-input,
validated-search and guard-context variants. Positive cases use generated local
callback types without a registry cycle. Shared navigation, href, redirects,
links and hooks reject platform-only literals; a validated destination remains
usable. Explicit instances accept only their target catalog's paths. Plain
TypeScript/JavaScript helpers cannot create phantom screen contracts.

```sh
pnpm --filter @octane-xplat/ui typegen
pnpm --filter @octane-xplat/cli build
node --test packages/cli/test/route-platform-contracts.test.mjs
```

The fixture runs consumer TypeScript programs with web, native, macOS, Linux and
Windows conditions. It also bundles and executes all seven generated catalog
variants in Node: web, iOS, Android, generic mobile, macOS, Linux and Windows.
Those checks verify selected loaders, availability JSON and the distinction
between unknown patterns and unavailable screens. They do not run a native
renderer or establish Windows OS behavior. `XPLAT_ROUTING_UI_PACKAGE` can point
the same fixture at an extracted UI package for declaration/export-map checks.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts src/route-table.test.ts src/route-registry.test.ts src/routing-core.test.ts src/router-instance.test.ts src/define-route.test.ts src/default-router-runtime.test.ts
```

The main public routing-consumer fixture also checks all five compiler
conditions. To check a distribution, set its extracted package directory below.
The fixture creates a private package scope and verifies the resolved package
path so an ancestor's workspace self-reference cannot produce a false packed
result. Workspace and extracted-archive runs both pass; these remain compiler
checks, including for Windows.

```sh
XPLAT_ROUTING_UI_PACKAGE=/absolute/path/to/extracted/package \
  pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts
```

At the routing-cutover qualification pass on 2026-10-20, all five platform-contract fixtures passed through workspace and
extracted tarball entry points. The combined generation/watch suite passed 24
tests, core/package checks passed 158 tests, and production Chromium passed 108
navigation assertions. The UI/CLI dependent type gate passed 53 tasks, including
mobile, AppKit, Linux and Windows programs. No new native-device runtime run is
claimed for this typing increment; Windows still has no runtime VM.

Both declaration distributions also passed the 1,024-route benchmark under all
five conditions after the availability change. Workspace samples compiled in
1.73–1.76 seconds and packed samples in 1.74–1.77 seconds. All destinations were
returned by language-service completion, negative types remained errors, and
loader edits refreshed the inferred data. These are single-run TypeScript
measurements on the machine described below.

The later callback-diagnostic refinement adds negative cases for malformed
guards, loaders, search schemas, head values and error boundaries. Generated
`RouteExportChecks` reject them without executing application modules. Runtime
catalog construction throws source-aware `route/invalid-export` errors instead
of discarding bad behavior. Six compiler/catalog fixtures pass through workspace
and packed package entry points; focused core/package tests pass 153 checks,
including malformed guard and baked-loader cases. The dependent gate passes
53 tasks and both declaration distributions retain all 1,024 benchmark
destinations under all five package conditions. This is compiler/host-free
runtime evidence; no new native-device or Windows runtime pass is implied.

The callback fixture also rejects callable guards returning booleans and search
parsers returning scalars. Those shapes formerly compiled even though preparation
rejected them. Object/void and async return checks now match the programmatic
authoring contract. The existing packed UI artifact is reused when only the CLI's
generated constraints change; this does not imply a newly packed UI build.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/route-table.test.ts src/define-route.test.ts src/routing-core.test.ts src/routing-package.test.ts src/router-instance.test.ts
```

## Check large route catalogs

Use the maintained benchmark to check whether generated routing contracts remain
precise and responsive as a catalog grows. It creates file routes and a configured
programmatic manifest, runs the real generator without executing screens or baked
loaders, and consumes the generated application registration. There is no handwritten
module augmentation or unchecked destination cast in the fixture.

```sh
pnpm bench:routing-types --output research/routing-types.json
pnpm bench:routing-types --sizes 1024 --conditions web,native,macos,linux,windows
```

Each catalog includes an index, a static route, an optional parameter, a splat,
validated search defaults, guard-added context and distinct live/baked loader DTOs.
The compiler must accept correct navigation and reject unknown paths, missing params,
invalid tabs and invented DTO fields. The language service must complete every
destination, show a typed loader property, and update its properties after a real
loader-return edit. Five repeated requests measure cached destination completions.

```sh
pnpm bench:routing-types --sizes 32,128,512,1024 --output research/routing-types.json
```

The default consumes workspace package declarations through the public export map.
To repeat against a package tarball, extract it and supply its `package/` directory;
its declared dependencies/peers must resolve as they would in an installed consumer.
The qualification run used an actual `pnpm pack` archive and the installed workspace
dependencies, without source aliases. The command below assumes that archive has
already been extracted into `research/routing-package/`.

```sh
pnpm bench:routing-types --sizes 1024 --conditions web,native,macos,linux,windows \
  --ui-package research/routing-package/package --output research/routing-packed-types.json
```

On an Apple M4 running macOS, Node 26.10.0 and TypeScript 5.9.3 produced these
workspace/web results. These are single-run observations, not portable timing budgets.

| Destinations | Compile | Cold completions | Cached completions (5 requests) | Completion after loader edit | Type instantiations | Sample peak RSS |
| --- | --- | --- | --- | --- | --- | --- |
| 32 | 383 ms | 250 ms | 0.3–0.6 ms | 41 ms | 21,529 | 485 MiB |
| 128 | 511 ms | 318 ms | 0.7–1.1 ms | 82 ms | 77,422 | 538 MiB |
| 512 | 948 ms | 655 ms | 2.4–3.2 ms | 348 ms | 300,994 | 675 MiB |
| 1,024 | 1,527 ms | 1,328 ms | 4.9–6.2 ms | 777 ms | 599,090 | 891 MiB |

At 1,024 destinations, the other workspace conditions compiled in 1.67–1.82 seconds;
the five extracted-tarball conditions compiled in 1.57–1.80 seconds. Every run
returned all 1,024 destination completions and passed the type assertions and loader
edit check. The full sample process peaked at 923 MiB across these runs: this
includes the generator, compiler, language service and Node overhead, rather than
measuring an editor's heap alone. Type instantiations grew approximately linearly
over the measured sizes; no inference implementation change was needed.

Each sample runs in a fresh process with a 120-second timeout and disposes its
language service and temporary fixture. JSON output includes versions, route counts,
timings, type/instantiation counts and process peak RSS. This is a manual contributor
check outside the lightweight PR gate.

```sh
pnpm bench:routing-types --help
```

These checks exercise TypeScript's language service on TSX, not a running editor,
the TSRX editor plugin, renderer startup, HMR or OS navigation. The `linux` condition
selects web routing declarations; `windows` uses the native declaration fallback.
Windows runtime remains unverified without a VM. Existing source/TSRX and packed
consumer checks remain separate requirements.

## Browser routed modal focus

Routed modals use the shared overlay focus manager in a body portal. A focus
owner stays attached to the modal flow while its screens are replaced. The
background is inert, the dialog's accessible name follows `head.title` (fallback:
“Dialog”), Tab stays inside and Escape requests guarded canonical dismissal.
A connected opener receives focus on dismissal; a stable DOM ID can locate its
replacement after revalidation. A remaining parent modal supplies the fallback.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/browser-router-host.web.test.tsrx src/modal-focus.web.test.tsrx
pnpm --filter @xplat/web smoke:routing
```

The focused suite passed 49 tests. It covers dialog naming, per-flow focus
ownership, nested dialogs, guarded Escape refusal, failed staging and restoration
to a re-rendered opener. The production Chromium suite passed 96 assertions,
including actual browser Tab/Escape input, rejection of focus into the inert
presenter, modal screen changes and opener restoration. The UI dependent gate
passed 50 tasks; packed exports/declarations and lint passed. No images were
captured or inspected.

This establishes DOM semantics and browser keyboard behavior, not screen-reader
input, OS-level key dispatch, native modal focus or ordinary page-change focus.
If an opener disappears without a replacement or parent modal, this integration
does not choose another application control. Apps should retain a meaningful
return target where the workflow requires one. Existing native/desktop runtime
results remain separate from this browser refinement.

## Page focus and entry scroll

Successful browser page changes focus an explicit HTML autofocus target, then a
visible level-one heading, a main landmark or the document body. Disabled or
hidden targets are skipped. The router temporarily makes noninteractive targets
focusable and preserves authored tabindex changes. Each rendered entry supplies
its own DOM container, so hidden outlet/staging content does not become the target.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/browser-router-host.web.test.tsrx src/modal-focus.web.test.tsrx src/browser-route-effects.web.test.ts
pnpm --filter @xplat/web smoke:routing
```

The focused suite passed 55 tests. The production Chromium suite passed 108
assertions, including heading focus before navigation resolves, actual Tab input,
refresh preservation, distinct focus/scroll for two same-URL history entries,
Back/Forward, decoded fragment focus/scroll, modal background preservation and
return to a noninteractive heading. A superseded loader cannot change the latest
focus, scroll or metadata. Temporary focus state is released with its owner.

The separate Linux check passed 13 assertions inside the real WebKitGTK host,
including the same-URL entries, fragments, modal isolation/return and late-loader
effects. It exposed a noninteractive modal-return target that needed a temporary
tabindex; the shared focus helper now covers both page focus and modal return.
These checks use DOM calls/handlers, with no OS keyboard/pointer or screen-reader
input and no images. They qualify the WebKitGTK DOM target; the separate native
GTK renderer and Windows runtime remain unqualified by this check.

To run the maintained Linux check, retain the production fixture and note the
printed `artifactDirectory`. Pass that path to the builder below. It makes a
copy and adds the actual Linux platform bridge required by the host's normal
readiness check; the routing bundle is unchanged. The next command prints a
`linuxArtifactDirectory` for the host.

```sh
XPLAT_ROUTING_ARTIFACT_DIR="$PWD/research/routing-effects" pnpm --filter @xplat/web smoke:routing
node apps/linux/scripts/routing-effects-build.mjs \
  "/absolute/path/from/artifactDirectory" "$PWD/research/routing-effects"
```

On Linux with the [host dependencies](../../apps/linux/host/README.md) installed,
use the printed Linux artifact path as `--bundle`. The qualification run used the
cached Debian GTK/WebKitGTK container already recorded above, software rendering,
read-only source/artifact mounts, disabled networking and an owned Xvfb/D-Bus
session. The host's bridge readiness check remained enabled.

```sh
XPLAT_SELFTEST_SCRIPT="$PWD/apps/linux/host/routing-effects-selftest.web.js" \
xvfb-run -a dbus-run-session -- gjs packages/cli/src/linux/host/gjs-host.js \
  --bundle "/absolute/path/from/linuxArtifactDirectory" --self-test
```

Document positions are restored against the committed DOM. Nested scrollers and
layout shifts after that commit remain application-owned. No additional live
region is inserted alongside heading focus. DOM semantics and browser keyboard
behavior do not establish actual assistive-technology announcements or native
focus policy. The public native APIs and existing native runtime evidence remain
separate; Windows still has no runtime VM.

## Native control and viewport retention

The release fixtures run the same retained-control protocol on root pages and
named panes. Each entry owns a text input and a measured scroll viewport. The
checks move two entries to different offsets, go Back, refresh, supersede a
loader that ignores cancellation and present/dismiss an independently scrolled
modal. They assert native control identity, offsets, explicit blur/focus and
released refs. The shared protocol is
`packages/ui/tests/route-retention-example.tsrx`.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_UDID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
node apps/macos/test/verify-routing.mjs
pnpm --filter @octane-xplat/ui exec vitest run src/scrollable-area-offset.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/scrollable-area-handle.mobile.test.tsrx
```

Reserve the selected build/device resources using the mobile commands described
above. The AppKit fixture passed **281 checks** on an attached native window, using
its retained root pane.
The release fixtures passed **299 iOS and 296 Android assertions**, including
both retention modes. The iOS retry used an owned accessibility companion after
a stale connection stopped the first run before routing assertions. Owned test
devices were shut down after the run.
The handle regression checks a Mason-shaped peer without NativeScript's
ScrollView methods. Platform unit tests check iOS offsets, Android dip-to-pixel
conversion and Windows outer-ScrollViewer calls; Windows has no runtime VM.

AppKit inactive panes keep measured geometry while hidden, preventing native
scroll-range clamping from discarding their offset. Mason mobile scrolling uses
the actual SDK offset APIs; iOS's setter currently has no animated form. These
are programmatic focus/scroll checks. OS touch/keyboard input, gesture arbitration
and assistive-technology behavior require separate evidence; no images were used.

## Check programmatic screen inference

Programmatic definitions infer preparation before checking a named or inline
screen. Use the preparation builder to read a named screen's inferred props;
register the finished definition. Inline callbacks follow validator, guard,
loader dependency order. A named parser value can be declared independently
when arranging fields in another order.

```ts
import { defineRoute, defineRoutes, type RouteScreenProps } from '@octane-xplat/ui/routing/core'
const item = defineRoute({ path: '/items/:id', loader: ({ params }) => ({ title: params.id }) })
function Item(props: RouteScreenProps<typeof item>) { return props.data.title }
export const routes = defineRoutes([item.screen(Item)])
```

The maintained consumer fixture checks complete search/data types, named-screen
mismatches, unfinished builders, removed flat options, immutable definitions,
loader-free data and resolved async guard results. It compiles under the default
entry plus web, native, macOS, Linux and Windows conditions. The extracted-package
mode asserts that resolution reaches the supplied archive's files, preventing an
ancestor workspace package from silently satisfying the check.

```sh
pnpm --filter @octane-xplat/ui typegen
pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts src/define-route.test.ts
XPLAT_ROUTING_UI_PACKAGE="/absolute/path/to/extracted/package" \
  pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts
XPLAT_ROUTING_UI_PACKAGE="/absolute/path/to/extracted/package" \
  node --test packages/cli/test/route-platform-contracts.test.mjs
```

Qualification on 2026-10-20 passed 235 focused routing tests, 78 native object-driver
tests, 19 generation tests, seven extracted-package generation fixtures, the
extracted-package consumer check, and all 53 dependent UI/CLI typecheck tasks.
Four complete guide/skill/internal example modules passed strict TypeScript;
the 53-guide production docs build, package integrity, lint and recipe checks passed.
These source/package checks are distinct from renderer execution.

The 1,024-route benchmark passed for workspace and extracted-package declarations
under all five platform conditions on Node 26.10.0, TypeScript 5.9.3 and Apple M4.
Compiler time was 2.0–2.5 seconds, cold completion 1.8–2.9 seconds, post-edit
completion 0.9–1.1 seconds and peak process RSS 853–971 MiB. This measures the
language service on macOS; it does not execute the target OS.

```sh
pnpm bench:routing-types --sizes 1024 --conditions web,native,macos,linux,windows
pnpm bench:routing-types --sizes 1024 --conditions web,native,macos,linux,windows \
  --ui-package "/absolute/path/to/extracted/package"
```

The migrated production Chromium journey passed 108 assertions and live Vite
generation passed seven checks. AppKit passed 172 native-object checks; the real
WebKitGTK host passed 13 DOM/handler checks. The release app passed 238 assertions
on the iPhone 18 Pro iOS 27 simulator and 235 on the owned Android emulator.
Both devices were shut down after qualification. Native checks exercise SDK
objects and dispatched handlers; they do not establish physical input or
screen-reader acceptance. No images were captured or inspected.
WebKitGTK does not establish native GTK renderer support, physical desktop input
or screen-reader behavior. Windows has source/type evidence and no runtime VM.

## Check named search interfaces

Search validators retain ordinary named output interfaces through file and
programmatic contracts, including async parsers and Standard Schema. The current
qualification passes 257 focused routing tests, 20 generation tests and eight
extracted-package generation fixtures. The package consumer checks preserve
whole search/data types and reject array, Date, Map, Set, RegExp, callable and
scalar roots. Runtime preparation rejects exotic JavaScript outputs before
its guards/loaders and accepts plain or null-prototype field objects.

```sh
pnpm --filter @octane-xplat/cli build
pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts src/define-route.test.ts src/routing-core.test.ts
node --test packages/cli/test/route-generation.test.mjs packages/cli/test/route-platform-contracts.test.mjs
```

The 53-task UI/CLI dependent gate passes. Current runtime regressions pass 111
production Chromium checks, 20 browser auth checks, 249 iOS release assertions,
246 Android release assertions, 202 AppKit checks and 14 WebKitGTK checks.
An extracted UI package also runs the public pane protocol with 308 archive
modules and zero workspace UI modules. These are the measured clients;
Windows remains source/type evidence without a VM.

The 1,024-route compiler/editor benchmark passes web/native/macOS/Linux/Windows
conditions with workspace and extracted-package declarations. Compilation spans
1.96–3.02 seconds, cold completion 1.71–2.15 seconds, post-edit completion
0.84–0.97 seconds and peak RSS 745–1,019 MiB on the current Node 26.10.0,
TypeScript 5.9.3 Apple M4 setup. Timings include normal machine variation and
measure language-service work, rather than target rendering or a running editor.

## Qualify owned pane hosts

The [complete pane walkthrough](../app/navigation.md#bind-a-custom-router-to-rendering)
uses public imports throughout. Its maintained shared example checks prepared
screen data, retained view identity/local state, entry-owned matches, live source
providers, independent histories, explicit modal refusal, and flow cleanup.
The creator disposes the instance; removing one pane leaves another usable.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/RouterPane.web.test.tsrx src/routing-package.test.ts
pnpm --filter @xplat/web smoke:routing
```

Qualification on 2026-10-20 passed 244 focused routing tests, 78 native
object-driver tests, all 50 dependent typecheck tasks, strict checks of the new
TSRX fixture/test source, and seven live Vite generation checks. Consumer
negatives cover finite pane names, original host witnesses and readonly binding
operations under all five platform conditions. Runtime checks reject cross-instance
attachment, cloned bindings and host reuse, including after disposal; a failed
construction can retry with repaired configuration.

| Executed target | Result and scope |
| --- | --- |
| Production Chromium | 111 journey checks, including the shared public pane protocol and unchanged browser URL/history. |
| iOS 27, iPhone 18 Pro simulator | 249 release assertions, including 11 public pane assertions against actual native objects. |
| Android, owned emulator | 246 release assertions, including the same 11 public pane assertions. |
| AppKit | 187 native-object/wait checks, including the same public protocol. |
| WebKitGTK | 14 host checks, including the public pane protocol in the unchanged production routing bundle. |
| Extracted UI archive, Chromium | All 11 public pane assertions; 307 archive UI modules, zero workspace UI source modules, and the web conditional entry verified. |

The archive check copies the shared example into a separate private consumer
scope. It resolves and bundles the supplied archive, rejects workspace UI source
in its module graph, and launches the built result in Chromium. Existing peer
dependencies and a local Playwright Chromium engine must be available; this
command installs neither. For a disposable extraction without dependencies,
link the workspace peers before running it from the repository root.

```sh
routing_ui_package='/absolute/path/to/disposable/extracted/package'
ln -s "$PWD/packages/ui/node_modules" "$routing_ui_package/node_modules"
XPLAT_ROUTING_UI_PACKAGE="$routing_ui_package" \
  pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts
pnpm --filter @xplat/web smoke:routing-pane-packed "$routing_ui_package"
```

The shared fixture uses module-level JSX components. The installed universal
compiler rejects inline JSX screen callbacks; see the
[pinned compiler source](https://github.com/octanejs/octane/blob/8c2e38a76477a9568cd56ec8377dc47cf042be59/packages/octane/src/compiler/compile-universal.js#L4879).
Native and WebKitGTK checks use SDK/DOM objects and controlled callbacks, without
physical input, hit-testing, screen-reader or image analysis. Both owned mobile
devices were shut down. WebKitGTK does not qualify the native GTK renderer;
Windows remains source/type-only because no runtime VM is available.

## Evaluate agent routing tasks

Use the routing evaluation to measure whether a coding agent can build common
routes in a fresh starter from the public guides, the starter's agent skill
and ordinary compiler, lint and test output. Each task copies the packed web
starter, adds the guides as `.xplat-docs/`, runs your agent command, then
grades the result. The agent never sees the graders.

```sh
pnpm eval:routing --mode reference
pnpm eval:routing --mode baseline
pnpm eval:routing --mode agent --agent 'my-agent --cwd {dir} --prompt-file {prompt_file}' --trials 3
```

The six tasks are a first typed detail route, validated search with history-
preserving updates, a guarded account route that returns after sign-in, a
loader failure with retry, two tabs whose histories stay in their own stacks,
and a programmatic route registered from data without module augmentation.
Grading regenerates routes and requires unchanged generated files, rejects
casts, compiler suppressions and module augmentation in changed sources, then
runs app typecheck and lint. Hidden type fixtures must accept valid
destinations and reject missing params or unsupported search values. Hidden
jsdom tests drive links and buttons by their visible text and check URLs,
history length and rendered text; the starter's counter test must still pass.

`reference` applies maintained solutions and must pass every task; `baseline`
grades the untouched starter and must fail every task. Run both after changing
a task or grader. Agent runs write `results.json`, each app's `changes.diff`,
the agent log and the agent's `FRICTION.md`; collect friction from those notes
rather than inferring it from pass/fail alone. Pass `--base DIR` to reuse a
packed starter from an earlier run. These are jsdom/web results from one
starter configuration; they do not qualify native targets, real browsers or
other agents.
