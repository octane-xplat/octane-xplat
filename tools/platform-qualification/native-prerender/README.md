# Native pre-render bootstrap probe

This isolated iOS host tests whether UIKit and Mason can mount content before an explicit NativeScript runtime initialization, and whether a later native-bridge update retains those same objects. It is the first mechanism probe for the native pre-render plan; it does not implement Octane hydration.

`main.swift` creates native application/scene delegates and a Mason container with two UIKit labels from a disposable binary fixture. After three display-link callbacks and a deferred run-loop turn, `Runtime.m` initializes NativeScript and runs the packaged `entry.js` through the normal application entry point, updating the existing label through its JavaScript bridge. The native side checks the text change, view identity and Mason-node identity. Each recorded phase also emits a `BootstrapStage` signpost for optional nonvisual tracing; signposts alone do not prove frame presentation.

The launcher uses UIKit scene lifecycle, as required by the current iOS SDK. Display-link progress and a visible-window flag do not prove compositor presentation. The result explicitly keeps `presentationQualified` and `adoptionQualified` false. This harness also does not qualify NativeScript Label wrappers, compiled JSX, production IR decoding, native CSS, release startup performance or other platforms. The labels are ordinary UIKit labels, not NativeScript's TNSLabel subclass.

## Build

Supply independently built arm64 simulator artifacts. The Mason SDK directory must contain `MasonCore.framework`, `include`, and `dependencies/FontManager`; the NativeScript products directory must contain `NativeScript.framework` and `metadata-arm64.bin`. These are read-only inputs; no dependency framework is rebuilt or patched here.

```sh
export XPLAT_PRERENDER_MASON_SDK=/absolute/path/to/mason-core/ios-host/release
export XPLAT_PRERENDER_RUNTIME_PRODUCTS=/absolute/path/to/Debug-iphonesimulator
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build native pre-render bootstrap probe"}' -- bun turbo run probe:prerender:build --filter=@xplat/platform-qualification
```

The runner writes a disposable app and source/artifact fingerprints below `~/agent-scratch/octane-xplat/native-prerender-bootstrap`. Its `XPR0` fixture is an experimental two-string payload, not the proposed production format. Framework availability, metadata compatibility and native compilation are required; the probe does not silently substitute implementations.

## Run

Only the existing simulator UDID is supported. Reserve it before running; the command waits when another task owns it. The runner installs its own app, clears only its previous result file, launches it, waits for assertions and shuts the simulator down before release. It does not create, clone, erase or delete devices, and does not capture images.

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"],"resident_devices":1},"purpose":"Native pre-render bootstrap probe"}' -- bun turbo run probe:prerender:ios --filter=@xplat/platform-qualification
```

The runner rejects source changes since the last build. Successful results and build fingerprints are retained under `~/dev/reports/octane-xplat/native-prerender-bootstrap`. Exit zero establishes only the assertions described above. The runner also clears and retains optional `selector-parity.json` and `entry-details.json` diagnostics produced by control investigations, preventing earlier results from surviving into a later run. A timeout or runtime crash is a failure, not a pending pass. Cleanup preserves the original probe error and retains any additional failures in `cleanup-errors.json`; an already-shut-down simulator needs no second shutdown. A cleanup failure after otherwise successful assertions still makes the run fail. Do not compare the debug-runtime mechanism timings to release app startup.

The initial experiment using the supplied SDK's `runScriptString` entry point crashed in V8 compilation after native mounting. This harness uses `runMainApplication`; it does not qualify arbitrary script evaluation. Input-specific evidence and native framework hashes belong to the local report, rather than a blanket claim about NativeScript versions.

## Next gate

The maintained plan is `~/dev/plans/octane-xplat/native-prerender-ir.md`; execution state is in Silo topic `native-prerender-adoption`. Follow this probe with compositor presentation evidence and real NativeScript wrapper/Octane adoption, including default/style ownership, geometry caches, lifecycle, events and cleanup. Do not replace the ordinary app bootstrap on the strength of this mechanism check alone.

## AppKit native measurement boundary

The separate AppKit probe loads an explicitly supplied `libxplatmason.dylib` in a native process. It checks nineteen measurement cases against AppKit's constrained intrinsic size: wrapping and resizing, line limits, single-line and empty text, a padded cell, available versus known width, an explicit preferred width, unconstrained sizing and a non-text view. It also checks that measurement preserves the field's preferred width. It creates no window or application JS runtime and captures no images. This checks native measurement, not Home IR mounting, live renderer integration or hydration.

Build the checker under a native build reservation, then release that reservation before running it:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build AppKit native measurement probe"}' -- bun turbo run probe:prerender:appkit:build --filter=@xplat/platform-qualification
export XPLAT_APPKIT_MEASUREMENT_BUILD=/absolute/path/to/printed/build/directory
export XPLAT_APPKIT_MEASUREMENT_LIBRARY=/absolute/path/to/libxplatmason.dylib
bun turbo run probe:prerender:appkit:run --filter=@xplat/platform-qualification
```

Each run preserves native results and source, executable and library hashes below the build directory. Any failed assertion exits nonzero. The shipped facade's callback ignores known/available width; it is a negative control for constrained wrapping. `appkit-measurement/field-measurement.patch` retains an experimental source change for an isolated native build. It measures a wrapping field through its constrained intrinsic size and restores its preferred width; it does not modify the shipped library. Use the same pinned Mason archive/header for baseline and candidate comparisons. Live layout invalidation, reentrancy, accessibility and adoption still need separate checks before retaining that change in the AppKit package.

## Generate control metadata

Before probing real NativeScript controls, generate bridge metadata from the exact UIKit, WebKit, TNSWidgets and Mason headers used by the host:

```sh
export XPLAT_PRERENDER_METADATA_GENERATOR=/absolute/path/to/objc-metadata-generator
export XPLAT_PRERENDER_MASON_SDK=/absolute/path/to/mason-core/ios-host/release
export XPLAT_PRERENDER_CORE_ROOT=/absolute/path/to/node_modules/@nativescript/core
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Generate native control metadata"}' -- bun turbo run probe:prerender:metadata --filter=@xplat/platform-qualification
```

The task uses an explicit umbrella header and the generator's packaged Clang resources. Each invocation writes to a new directory under `~/agent-scratch/octane-xplat/native-prerender-control-metadata`. It rejects compiler error diagnostics even when the generator returns zero, checks required interface declarations, WebKit and NativeScript embedder protocols, the embedder interface, and NativeScript text-helper methods, and records input/framework/output hashes. The printed directory contains `metadata.bin`, YAML declarations, diagnostics and a manifest. This qualifies header generation only; the baseline build still uses its supplied runtime metadata. TNSWidgets alone does not supply every core native helper: a control host also compiles core’s `platforms/ios/src/UIView+NativeScript.m` and `NativeScriptUtils.m` and includes their headers in its bridge metadata. Interface-only metadata can therefore pass while live text updates fail. Core imports also evaluate WebView delegate classes; their WebKit protocols must be available even when the probe screen contains no WebView. An Application/window handoff host additionally links core’s `NativeScriptEmbedder.m`; the singleton lives in core’s native sources, separately from the runtime framework. Native linkage and executing real wrapper adoption remain separate checks.

For a standalone CommonJS bundle of core, define `__COMMONJS__` as `true` and select `__CSS_PARSER__` explicitly (for example, `"css-tree"`). The ordinary NativeScript bundler supplies these flags. A text-only bridge check does not exercise stylesheet parsing; require a parsed rule and an actual class-driven native property change before counting CSS as tested.

## First real screen

`Home.tsrx` and `home.css` define the selected purpose-built milestone with real shared `VStack`, `HStack`, `Text` and `Button` components. Initial data is explicit (`name` and `initialCompleted`); actions increment or reset progress without changing the host topology. The CSS includes light/dark colors. This screen is the next producer/adoption target, separate from the disposable two-label XPR0 mechanism fixture. The compilation command below checks authored JSX only; the producer section executes the shared dependency closure separately. Native loading and adoption remain separate qualification steps.

Check compilation with an installed Octane toolchain:

```sh
export XPLAT_PRERENDER_TOOLCHAIN_ROOT=/absolute/path/to/installed/app
bun turbo run probe:prerender:home:check --filter=@xplat/platform-qualification
```

This check compiles the authored component. It does not execute the real shared-component dependency closure, typecheck public props, apply CSS, or qualify native rendering/hydration. Those checks remain required before using the screen as the startup path.

## Produce Home without a device runtime

The bounded producer evaluates the actual shared Home with Octane's native universal compiler and render-only preparation. Its build host supplies explicit mobile-platform/theme inputs and rejects native service reads, calls, allocations and writes. It records the unused SVG factory registration without calling that factory; SVG hosts remain unsupported. It prepares light and dark mode in separate processes, rejects changes to initial host props or topology, then uses the portable CSS engine to resolve both variants. It creates no native views and does not start NativeScript.

Run the producer with the workspace dependencies installed, or select an installed toolchain for the compiler/native CSS normalizer and a CSS-engine package for its parser dependencies:

```sh
export XPLAT_PRERENDER_TOOLCHAIN_ROOT=/absolute/path/to/installed/app
export XPLAT_PRERENDER_CSS_TOOLCHAIN_ROOT=/absolute/path/to/installed/css-engine
bun turbo run probe:prerender:home:produce --filter=@xplat/platform-qualification
```

The default target is iOS. Select Android explicitly to compile its platform leaves and build-host presence facts:

```sh
XPLAT_PRERENDER_HOME_PLATFORM=android bun turbo run probe:prerender:home:produce --filter=@xplat/platform-qualification
```

The manifest records the selected platform and binds it into the producer identity. Native packagers must require the matching target as well as binding their own host/runtime inputs. Android input slop is resolved when the live press owner attaches or commits; render-only preparation does not query ViewConfiguration or substitute another Pressable. Unsupported native render reads still fail.

The command prints a new output directory below `~/agent-scratch/octane-xplat/native-prerender-home-producer`. It contains `resolved.json`, `sheets.json`, `home.bin`, separate prepared trees and a source/bundle fingerprint manifest. `resolved.json` is the readable semantic projection encoded in `home.bin`. The binary's build identity binds producer inputs; a native app packager must also bind its host/runtime inputs and encode the combined identity expected by its native loader. The existing Home native qualification host does that separately.

This producer deliberately supports the selected nineteen-view Home, its explicit seed and a402×874 logical-point CSS environment with light/dark variants. It does not infer arbitrary component eligibility, evaluate client refs/effects, support structural theme changes or establish request-isolated SSR. The mobile live resolver remains the CSS parity reference. New environment dependencies, host kinds and native API use require explicit qualification; successful host generation alone does not establish native mounting, hydration or startup speed.

Exercise the rejecting build-host boundary separately:

```sh
bun turbo run test:prerender:producer --filter=@xplat/platform-qualification
```

## Compile native Home helpers

`home-native/` retains the fixed-screen mounting and font-conversion helpers. They consume the experimental producer’s trusted JSON visual projection: nineteen containers/Labels with resolved light/dark styles. They are fixtures, not the production IR decoder, a complete font implementation, or an app startup integration. Unsupported properties and font weights fail explicitly.

Compile the Objective-C helpers against the exact native SDK inputs:

```sh
export XPLAT_PRERENDER_MASON_SDK=/absolute/path/to/mason-core/ios-host/release
export XPLAT_PRERENDER_CORE_ROOT=/absolute/path/to/node_modules/@nativescript/core
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Compile native Home helpers"}' -- bun turbo run probe:prerender:home:helpers --filter=@xplat/platform-qualification
```

Each invocation writes three object files, compiler arguments and an input/output hash manifest below `~/agent-scratch/octane-xplat/native-prerender-home-helpers`. Link all three, including the Swift `HomeStyleSnapshot` extension, with the host, Mason, TNSWidgets, CoreText and core’s native text helpers. The command creates no app and runs no device; its output explicitly records `linked:false` and `runtimeQualified:false`. Follow the plan’s separate native geometry, style ownership and hydration gates.

## Experimental Home binary codec

`home-codec.mjs` writes `XPH1`; `home-native/HomeArtifact.swift` reads it using Foundation and CryptoKit before any view creation. Both produce the same semantic object as the resolved JSON projection. Check the writer and native reader together, optionally supplying an actual AOT Home projection:

```sh
export XPLAT_HOME_CODEC_INPUT=/absolute/path/to/resolved.json
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Check Home binary codec"}' -- bun turbo run test:prerender:codec --filter=@xplat/platform-qualification
```

The command compiles a host-native Swift checker, exercises valid and malformed inputs, and retains evidence under `~/agent-scratch/octane-xplat/native-prerender-home-codec`. It starts no simulator and does not establish iOS mounting or hydration. Without the optional input, the actual-Home case is explicitly skipped; synthetic codec cases still run.

`android-native/HomeArtifact.java` reads the same XPH1 format into immutable node/style records without Android, UI or NativeScript dependencies. Run its shared conformance cases on an existing JDK; optionally require direct decoding of the Android producer’s original binary/build identity as well:

```sh
export XPLAT_PRERENDER_JAVA_HOME=/absolute/path/to/existing/jdk17/Contents/Home
export XPLAT_HOME_CODEC_PRODUCER=/absolute/path/to/android/producer/output
export XPLAT_HOME_CODEC_INPUT="$XPLAT_HOME_CODEC_PRODUCER/resolved.json"
bun turbo run test:prerender:codec:android --filter=@xplat/platform-qualification
```

The Java checker compiles with `--release 8`, checks the shared malformed-input/value suite, and prints a UTF-8 JSON debug projection. The optional producer check requires an Android manifest and compares the original `home.bin` against its complete `resolved.json` projection. Source, class and artifact fingerprints plus command logs go below `~/agent-scratch/octane-xplat/native-prerender-android-codec`. Neither this JDK-host check nor the Swift host check proves execution on Android ART, native setter safety, UI mounting, font/layout parity, hydration or startup speed. The separate Android Home mount mode below includes this reader in its APK; the host codec check alone remains insufficient.

Both readers preflight the complete artifact, including the unused theme. They reject unsupported style values, malformed UTF-8, duplicate keys/provenance, non-finite numbers, excessive literal nesting/collections, invalid tree links, incompatible headers/builds/checksums and trailing data. RGBA numeric tokens use decimal syntax consistently; Java numeric suffixes and hexadecimal floating literals are rejected. This remains a packaged fixed-screen contract, not a complete untrusted SSR input boundary or platform style lowerer.

The fixed 80-byte header uses little-endian integers:

| Offset | Field |
| --- | --- |
| 0 | Four-byte magic `XPH1` |
| 4 | Version `u16=1`, reserved flags `u16=0` |
| 8 | Total bytes `u32`, visual node count `u32` |
| 16 | Expected build identity, 32 bytes |
| 48 | Payload SHA-256, 32 bytes |

The payload contains a scope string, initial-data object, ordered node records, then light and dark style records. Each node stores a one-byte container/Label kind, a `u32` parent index (`0xffffffff` for the root), text and portable props. Paths and child lists are derived from parent order. Each theme has one style/provenance record per node. Literal tags represent null, booleans, finite little-endian float64 numbers, UTF-8 strings, arrays and objects; strings and collections have `u32` lengths. No JSON text, native pointers, transient renderer IDs, Mason buffer offsets or native struct layouts are embedded.

Bounds are 1 MiB total, 1,024 nodes, 65,536 bytes per string, literal depth below 16, 1,024 array entries, 256 object entries and 100,000 literal values. The reader rejects unknown versions/flags/tags, bad references, duplicate keys, unsupported style names, invalid UTF-8, non-finite numbers, trailing bytes and mismatched checksums/build identities. The host must supply the expected build digest from its producer/runtime/CSS/initial-data inputs; a checksum provides corruption detection, not authenticity. The native reader also preflights both themes against the fixed Home setter subset before returning an artifact: supported enum strings, numeric types/ranges, zero-only borders, supported font weights, and fully parsed resolved colors. The mounting helper checks scaled length range before native view allocation. This remains the experimental Home contract, not general CSS support.

This is a compatibility experiment, not the frozen production IR. It retains resolved style names and provenance for inspectability; it makes no size or speed claim. Compiler-stable logical identities, environment invalidation, a complete control/property ABI and failure fallback remain separate contracts. JSON is the optional debug projection of the same data, rather than a separate rendering path.

## Retained Home runtime fixtures

The real-screen experiment has separate native and JavaScript entry points:

| Source | Role |
| --- | --- |
| [HomeBootstrap.swift](home-native/HomeBootstrap.swift) | Binary decode, native Home mount, explicit engine gate and identity assertions |
| [home-adoption.ios.js](home-adoption.ios.js) | Prepared-tree matching, root-scoped claims, Page handoff, resize/restore parity, Button updates, sibling isolation and compared style removal |
| [home-fallback.ios.js](home-fallback.ios.js) | Artifact/decode or stale-theme rejection before claims, ordinary Home mount and current-theme/Button checks |
| [home-primitives.ts](home-primitives.ts) | Four actual shared primitive exports, avoiding unrelated public-barrel imports |

These are private qualification fixtures, not app bootstrap APIs. The host build substitutes `__XPLAT_PRERENDER_BUILD_HASH__` exactly once in the Swift source, compiles it as the application entry point with `HomeArtifact.swift`, and links the three native helper objects plus the runtime/Core embedding helpers. It packages `home.bin` and resolves the JavaScript virtual modules `xplat-prerender:artifact` and `xplat-prerender:styles` to the matching debug projection and normalized stylesheets. Retarget Octane imports to the native universal runtime and apply the isolated driver factory patch. Record those inputs with the host build; the baseline two-label launcher is not a Home launcher.

The positive fixture reads binary before engine initialization, then checks the same nineteen native objects through live adoption. For a stale-theme failure, compile Swift with `-D XPLAT_PRERENDER_STALE_THEME` and select `home-fallback.ios.js`: it changes the owning window theme before JS starts. JavaScript rejects the stale preparation without consuming claims, detaches the old native root through Mason and mounts a fresh Home.

The same fallback entry handles native read/decode rejection. The Swift host catches a missing, incompatible or invalid artifact, records a rejected-artifact receipt with zero artifact views, and starts JS with an empty viewport. The normal compiled Home uses its bundled initial data rather than attempting to use rejected artifact data. These qualification cases need no stale-theme compile flag:

```js
const artifactRejected = snapshot.artifactRejected === true
const staleHome = artifactRejected ? null : nativeHost.subviews.objectAtIndex(0)
```

Each case must use a distinct input-bound build identity. A launcher must check the app identifier and matching final result kind. Positive cases require the binary decode event and nineteen adopted views; read/decode failures instead require rejection before engine initialization, zero artifact views and nineteen ordinarily created views. Accepting any generic `passed` event can run the wrong fixture.

The host waits on display-link progress and checks window attachment; compositor presentation remains unqualified. The fixtures intentionally retain diagnostic handles and cover a fixed tree. They do not establish leak freedom, arbitrary environment changes, rollback after partial native application, OS touch or startup performance. The complete host build/producer pipeline still requires an experimental adapter; the maintained compile-only and codec commands above do not build this app.

The native and live hosts use an explicit flex-column viewport so Home's flex growth has the same parent policy before and after adoption. The viewport belongs to the host, outside the nineteen artifact views:

```swift
root.style.display = .Flex
root.style.flexDirection = .Column
```

```js
host.style.display = 'flex'
host.style.flexDirection = 'column'
```

The adoption fixture measures at two changed sizes and the original size, checks all native frames against Mason's computed layout and an ordinary Home, and requires every original frame to return. These are programmatic constraint checks, not OS rotation coverage. On iOS, the Mason foreign-descendant bridge must flush pending UIKit layout before Core lays out foreign views; otherwise Core can clip their frames against stale safe-area insets. The focused fork repair is Mason commit `4040e7d2` (`packages/nativescript-masonkit/common.ts`). Keep that prerequisite when assembling the isolated host SDK; the fixture does not patch installed dependencies.

### Optional native touch qualification

The adoption fixture normally invokes registered tap callbacks directly. An installed `home-os-input` marker in the app's Documents directory instead makes it wait for external HID taps. Each `input-ready.json` receipt names the button, its center in owning-window points, and the expected counter state:

```json
{"version":1,"step":1,"id":"home-complete","point":{"x":201,"y":400},"expectedCount":"4","window":{"width":402,"height":874}}
```

The host runner must install the app and own the designated simulator exclusively, clear old completion/error receipts, then start the input driver before launching the app. The driver creates the marker, starts a private `idb_companion` socket and writes `input-driver-ready.json`. The host waits for that ready file, launches the app, and accepts success only after both the native result and `os-input.json` pass:

```sh
bun turbo run probe:prerender:home:input --filter=@xplat/platform-qualification -- "$BUNDLE_ID" "$REPORT_DIRECTORY"
```

This command requires existing `idb` and `idb_companion` executables. It sends only HID taps on the designated simulator; it does not capture or inspect images. The driver validates both request steps, waits for the same nineteen-view adoption fixture to complete, and requires its OS-input flag. Its final receipt records the two actions and driver source hash. Stop the driver and let it clean up its companion/marker before shutting down the simulator and releasing the reservation. This remains a private host-fixture protocol, not an app interaction API.

## Boundaries for native style loading

Keep selector matching and cascade resolution in the producer for a known initial tree. Native loading still needs explicit property conversion: numeric Mason lengths use physical pixels, UIKit frames and fonts use logical points, and percentages remain fractions. Read scale from the owning window’s screen and convert each length once. The native border-radius string parser already applies scale; pass the logical radius to it. Multiplying it first triples effective radii at scale3. Mason dimension type codes differ from length/percentage type codes; use the named enums from the exact SDK header rather than sharing numeric tags between setters. Lower colors to the same rounded ARGB bytes as live NativeScript Color; the SDK’s UIColor-to-Mason conversion can truncate alpha.

The helper snapshot includes background properties, text RGBA, effective font metrics and all four effective corner values. `HomeStyleSnapshot.swift` reads corner units, x/y values and shape exponents using the exact SDK’s named `StyleKeys`. This diagnostic buffer access is separate from the IR contract. Mason’s native `borderRadius` string can stay stale after JavaScript writes the shared buffer; compare effective corners rather than treating that string as rendered state. Geometry and string equality alone can miss a paint mismatch.

Control initialization belongs to native lowering too. NativeScript Label creation enables native interaction; the driver gives foreign Labels a zero minimum width. The helper establishes those defaults before authored styles. In the examined SDK, the native bulk `setBorderWidth` implementation assigns padding. For this fixture’s zero-width border subset, use the individual edge setters instead; nonzero borders remain unsupported. Recheck these boundaries against the exact SDK when upgrading rather than inferring native setter behavior from its name.

For iOS fonts, use the pinned NativeScript behavior as the reference. `NativeScriptUtils.createUIFont` selects the base font, but this repository’s core patch also applies CoreText variable axes, including numeric CSS weight. Calling only the stock helper can choose a different semibold font and text metrics. Keep that small native conversion aligned with the owning core patch; it does not require moving selector matching or the cascade into native code.

A snapshot’s applied values are not the control’s native defaults. Preserve the original native defaults separately before startup styling, then establish live property ownership at adoption. A stock property reset, native-baseline restoration and setter replay can avoid direct per-property cache manipulation, but each required native property family must be verified against ordinary creation and later removal. A font-only comparison does not establish general style ownership.

For the fixed Home experiment, the native helper retains font, text color and radius defaults on each view. Restore those baselines after validating the whole prepared tree and immediately before live commit, without yielding between restoration and live setter application. That lets live property initialization capture canonical defaults. The radius baseline uses explicit zero: an empty native radius string does not clear existing corners. The pre-style journal is available through native KVC for this experiment:

```ts
const defaults = nativeView.valueForKey('prerenderDefaults')
const radius = defaults.objectForKey('borderRadius')
```

This journal remains native runtime state, never serialized pointers or fonts in the artifact. The iOS Home comparison covers initial font/color/effective-corner preservation and removal against ordinary Home. It does not establish complete style ownership, Label initialization parity, leak freedom, or a production adoption API.

Use NativeScript’s supported embedding delegate when handing an existing window/controller to Application. The default core SwiftUI host registers one before runtime setup. A custom host that omits it can initialize the root under two UI contexts and tear down the adopted children. Page/Frame ownership, safe-area geometry, lifecycle forwarding and actual/native caches still need their own checks. Compare measured dimensions under the same constraints with ordinary creation: measured size and the final stretched frame are not interchangeable.

## Qualify root-scoped view creation

`driver-root-factory.patch` is an isolated experiment against `@nativescript-community/octane` 0.2.5 **with the repository’s canonical driver patch already applied**. It adds a per-root factory during command application. It is not registered in the patch manifest or used by ordinary apps. `check-driver.mjs` copies an explicit installed driver into a new scratch directory, applies the experimental patch there, and executes that source against a small host boundary. It never changes the supplied installation.

```sh
export XPLAT_PRERENDER_DRIVER_ROOT=/absolute/path/to/node_modules/@nativescript-community/octane
bun turbo run probe:prerender:driver:check --filter=@xplat/platform-qualification
```

The check covers aborted batches, text folding, ordinary creation, undefined fallback, same-root and cross-root ownership rejection, reuse after disposal, Mason defaults, and cleanup after a later creation fails. Its result includes source/patch hashes and `nativeQualified:false`. This is a driver command test, not an Octane reconciliation or native lifecycle test. The separate native Home experiment exercises actual compiled shared components, Page integration, state updates, native identities and independent sibling disposal.

In the experiment, the factory receives transient Octane command IDs, host tags and initial props. Returning `undefined` selects normal registered creation. A returned object must be a NativeScript `ViewBase` without a live driver owner. The factory does not run during preparation/abort, for logical text nodes, or for element-registry hot replacement. It does run for command-driven recreation. For example, after validating the complete prepared tree, an adoption host can supply a root-local lookup:

```ts
const root = createNativeScriptRoot(host, {
  createView(id, type, props) {
    return claims.get(id)
  },
})
```

The lookup alone is not hydration. The host must first match the complete prepared logical tree to the artifact, bind ordinary wrappers to existing native objects, preserve canonical native defaults, and consume each claim once. Never serialize Octane command IDs or replace the global element registry to claim a screen. Clear the claims after the initial commit so later creation follows the normal path. A failed apply is not rolled back: dispose that root and release any unconsumed native claims before fallback. The experimental patch makes remove/destroy tolerate hosts that never reached creation, allowing that disposal path.

## Match before claiming

`match-tree.mjs` checks the initial container/Label visual projection, complete portable host props, flattened Label text, logical node count and reachability. It returns a map from this prepared batch’s transient command IDs to artifact-local visual indices. It does not mutate either tree or consume native claims. The caller still verifies native classes, environment/build compatibility and wrapper ownership. Logical text ownership and generic stable compiler addresses remain separate IR work.

```js
const addresses = matchPreparedVisualTree(prepared.batch.commands, artifact.nodes, 27)
// Only after successful matching may the root factory consume these claims.
```

Run the device-free contract cases through the owning workspace:

```sh
bun turbo run test:prerender:adoption --filter=@xplat/platform-qualification
```

These cases reject changed props/inline styles, text, kinds and addresses, duplicate or unreachable nodes, invalid insertion order/anchors, unknown initial mutations and nonportable property values. They do not establish native rendering or make this fixed-subset matcher an untrusted production IR validator.


## Optional native lifetime qualification

The adoption fixture can retire its comparison references and unmount Home after the usual identity, geometry, style and button checks. Native Swift keeps weak observations of the original nineteen views and Mason nodes; the JS phase clears consumed claim/diagnostic handles, checks unloaded lifecycle and detached Button observers, then runs eight explicit garbage collections. Success requires all nineteen original views and all nineteen original nodes to be gone. The owning Page and viewport remain. This is one fixed-screen cleanup check, not a proof of bounded memory over repeated cycles or every control family.

For this mode, the owning Home launcher must perform these steps:

1. Install the matching Home app. Clear old `native-handover.json`, `lifetime-js.json`, `lifetime-result.json` and ordinary completion/error receipts. Write `Documents/home-lifetime` before launching.
2. Wait for the native final event with `homeLifetimeQualified:true`, then require `lifetime-result.json` to report `passed:true` with empty live-view and live-node index arrays. Retain that result and `lifetime-js.json` with the ordinary adoption evidence. An ordinary `entry-details.json` pass does not establish lifetime success.
3. Clear the marker, terminate the fixture and shut down the owned simulator before reservation release. For normal adoption, ensure the lifetime marker is absent.

Keep the guarded Home launcher under a distinct filename or generate it after the native build. The experimental build generator writes `run.mjs`; that baseline launcher can run the older two-label probe. A Home launcher must verify the app identifier, binary build identity and nineteen-node native decode before accepting its result.

The forced collection and bootstrap-release handshake are test mechanisms. Production ownership transfer must retire startup references when the live tree accepts ownership; it must not depend on forced GC or diagnostic files.


## Android bootstrap mechanism

The separate Android host tests native layout before engine initialization. A native Application subclass defers the stock NativeScript `onCreate` path while a plain Activity creates a Mason container and two Core `StyleableTextView` labels from XPR0. After three callbacks with nonzero layout, the stock Application initializer starts the runtime and its ordinary module entry installs one Java/JS bridge controller. The controller binds the actual current Activity, updates its original widget and releases that binding on destruction. Native assertions check unchanged views, child order, Mason node objects and raw Rust handles within each Activity. The runtime and its Java helpers are read-only inputs.

Supply the qualified SDKs, an existing Android SDK platform36 and a Java installation. The fixture currently requires NativeScript Android9.1.1 and Core9.1.3:

```sh
export XPLAT_PRERENDER_ANDROID_RUNTIME_ROOT=/absolute/path/to/@nativescript/android
export XPLAT_PRERENDER_CORE_ROOT=/absolute/path/to/@nativescript/core
export XPLAT_PRERENDER_ANDROID_MASON_SDK=/absolute/path/to/mason-core/android-host
export XPLAT_PRERENDER_ANDROID_SDK=/absolute/path/to/android-sdk
export XPLAT_PRERENDER_JAVA_HOME=/absolute/path/to/jdk-17
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build Android native bootstrap probe"}' -- bun turbo run probe:prerender:android:build --filter=@xplat/platform-qualification
```

The command snapshots the AARs, runtime Java/internal assets, wrapper and metadata generator into a fresh scratch project. It compiles Java, generates bridge metadata and assembles a debug APK. No device starts, no native dependency is rebuilt, and the shared SDK directories are unchanged. Gradle resolves the declared Android libraries through its normal dependency cache. Inspect the printed build directory and retained compile/metadata/assembly logs if a check fails.

Release the build reservation, then use that directory for the device phase:

```sh
export XPLAT_PRERENDER_ANDROID_BUILD=/absolute/path/to/printed/build/directory
goddard-agent resource run --json '{"resources":{"exclusive":["android:elegant-fir-probe"],"resident_devices":1},"purpose":"Run Android native bootstrap probe"}' -- bun turbo run probe:prerender:android --filter=@xplat/platform-qualification
```

The runner reuses only the existing `elegant-fir-probe` AVD on Android35 ARM64. It refuses a second Android emulator, verifies the actual AVD console identity, installs its own `org.octanexplat.prerenderbootstrap.android` app, clears that app's previous receipt and retains app-UID-scoped logs. It shuts down its owned emulator before returning. Source, copied SDK, generated input, driver and APK hashes guard the run. Reports go to fresh directories below `~/dev/reports/octane-xplat/native-prerender-android-bootstrap`. No images are captured or inspected.

The run also requests one Activity recreation after startup. It requires the old controller binding to be released, a replacement Activity to reach layout with its own original objects, and the same JS runtime/controller to bind it without reinitializing the engine. Pre-runtime Activity destruction cancels pending frame/startup callbacks. Native event history remains process-scoped and records Activity generations so a recreated instance cannot overwrite the initial proof. Each complete receipt replaces its predecessor through a same-directory atomic rename, allowing concurrent ADB reads. This handles the probe’s basic recreation flow; it does not forward the complete NativeScript Core Activity lifecycle or preserve component state through a renderer.

A pass establishes this two-label mechanism only. The container currently wraps its content; full viewport sizing remains a separate check. NativeScript wrapper/Octane hydration, Android Home IR, full NativeScript Core Activity lifecycle handoff, CSS parity, compositor presentation, release performance, process-death restoration and renderer state across configuration changes remain unqualified. The artificial runtime delay and debug APK are unsuitable for startup-performance comparisons.


### Android actual Home native mount control

After producing the Android Home, select its output for a separate native mount APK. Use the Android SDK inputs and build reservation above; keep the two-label wrapper/Application flags unset:

```sh
export XPLAT_PRERENDER_ANDROID_HOME_PRODUCER=/absolute/path/to/android/producer/output
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build Android native Home mount"}' -- bun turbo run probe:prerender:android:build --filter=@xplat/platform-qualification
```

The packager requires an intact Android producer manifest and binary, snapshots the readable projection, and binds the producer identity with its frozen native sources and SDK inputs. It changes only the binary header's build identity. The separate `org.octanexplat.prerenderhome.android` app decodes XPH1 before any Home allocation, lowers its selected light/dark styles into real Mason containers and Core `StyleableTextView` labels, and sizes a native Mason viewport directly from Android's available measure bounds. That viewport is the Activity content root, with native window-attachment counters. This fixed lowerer requires Android28+, fontScale1 and the recorded system font stack; unsupported inputs fail explicitly.

Run the same device task with this build's printed directory:

```sh
export XPLAT_PRERENDER_ANDROID_BUILD=/absolute/path/to/printed/home/build/directory
goddard-agent resource run --json '{"resources":{"exclusive":["android:elegant-fir-probe"],"resident_devices":1},"purpose":"Run Android native Home mount"}' -- bun turbo run probe:prerender:android --filter=@xplat/platform-qualification
```

The Home branch requires all nineteen views to be attached and have nonzero geometry before NativeScript and its runtime library initialize. It compares native kind, parent and text records with the producer, then checks unchanged native views, Mason nodes and raw handles after ordinary runtime startup. Native hierarchy counters reject child detach/reattach during that handoff. The default Home mode does not force Activity recreation; the explicit lease control below does. Cleanup and fingerprint guards remain the same as the bootstrap runner.

This control installs only a small JS verification bridge. It does not create NativeScript wrappers, hydrate Octane, qualify live CSS/font/layout parity, prove compositor presentation or measure release startup. The two-label controls below test their own separate ownership/lifecycle boundaries; they do not fill those Home gaps.

### Android actual Home Octane adoption control

The optional Home adoption mode bundles the actual shared Home, Core wrappers and Octane native universal runtime. Prepare the isolated [root-factory candidate](#qualify-root-scoped-view-creation), then provide that candidate directory and a compiled Mason Core JS SDK compatible with the selected native AAR. Keep the Home producer/SDK inputs above and the two-label flags unset:

```sh
export XPLAT_PRERENDER_ANDROID_HOME_ADOPT=1
export XPLAT_PRERENDER_ANDROID_HOME_DRIVER_ROOT=/absolute/path/to/root-factory/candidate
export XPLAT_PRERENDER_ANDROID_MASON_RUNTIME_ROOT=/absolute/path/to/pinned/mason/js-sdk
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build Android Home adoption control"}' -- bun turbo run probe:prerender:android:build --filter=@xplat/platform-qualification
```

The bundler selects Android shared leaves, retargets Octane imports to one native runtime, maps the candidate driver's older MasonKit imports to the selected Mason Core SDK, and supplies the producer's exact projection/stylesheets. Every bundled input and the output bundle are bound into the native host identity. The host also applies UI's own Android dependency declaration: even this no-icon Home imports an SVG module that evaluates native classes during startup. The generated fixture retains its settings repositories while accepting that plugin script's repository declarations. These are isolated packaging rules, not production resolver changes.

Use the same device command with the printed adoption build directory. The live entry initializes Core's application context through its public custom-Application hook before shared components read the theme. It requires the selected OS theme, prepares and aborts without claiming/mutating views, then matches all27 logical nodes and19 visual records before enabling claims. Commit must consume exactly19 root-local claims. Instance attachment adapters skip native insertion only for the expected existing child and index, while running Mason's foreign-child bookkeeping; ordinary new children retain the ordinary method. Checks cover wrapper/native identity, logical parent/child order, actual Activity context, loading, native Mason/raw handles and zero native hierarchy churn.

The native helper restores font, color, radius and canonical Label text defaults synchronously before commit initializes the live wrappers. This bounded journal is not full CSS/default-removal or font/layout parity qualification. The mode does not hand Home to Core Application/NativeWindow, test OS input, force Activity recreation, establish native deallocation, prove compositor presentation or measure release startup. The candidate driver and instance adapters remain private qualification seams; the production renderer, Core and Mason SDK sources are unchanged.

### Android independent Home style and layout comparison

Add the parity flag to the Home adoption inputs, rebuild, then run the printed build with the same reserved device command:

```sh
export XPLAT_PRERENDER_ANDROID_HOME_PARITY=1
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build Android Home reference comparison"}' -- bun turbo run probe:prerender:android:build --filter=@xplat/platform-qualification
```

The live entry creates an ordinary sibling Home without adoption factories. Its fresh native objects are attached but hidden for measurement. Native observations compare all19 records against the frozen pre-JS snapshot and the adopted tree, then compare both live trees after stylesheet/root-class removal and restoration. Initial/restored comparisons require attached, nonzero geometry and finite computed layout. Fields include native/computed boxes, supported layout and paint values, eight actual corner-radius values, and Label fonts, color, line limits, padding, spacing and overflow. The comparison reads corner values rather than the shorthand getter, which only remembers the last assigned string.

Native observations also require native/Mason child order and distinct ordinary objects. The reference must unmount to an empty native/Mason root and detach before its wrapper tears down; creating it must not consume adoption claims. Raw Mason containers retain the ordinary Block default when no display is specified; resolved display:flex selects Flex. The baseline journal restores actual corner values as well as the recorded shorthand and font/text defaults. This mode checks the selected portrait/theme/fontScale1 environment and supported fields; it does not prove all CSS, resize/theme matrices, window handoff, native deallocation, pixels, compositor presentation or release performance.

### Android Home Activity comparison leases

The native viewport uses Core's native edge-to-edge helper before JS starts. Before drawing, it intersects the content parent's screen bounds with system-bar/cutout-safe window bounds and applies only the missing padding. A parent already inset by Android needs no extra padding. The layout gate requires a child draw traversal, window focus and three stable viewport observations; these are not compositor-presentation evidence. The fixed-environment parity check also requires the cold and accepted live viewport to have equal screen coordinates and dimensions. Manual JS probe layout preserves each native root's current left/top; forcing its origin to zero would discard padding on a full-window parent even while child-local parity passed. Mason wraps its view context, so the viewport retains the actual constructor Activity for window metrics rather than casting `getContext()`.

The Home runner accepts only a complete, live latest Activity generation. A retired reference comparison cancels through an explicit lease error, cleans up its own hidden reference, and emits a cancellation receipt; other errors still fail. Warm Activities first complete native layout before JS binds. The process retains only the cold pre-runtime observation data, so a new generation can compare its own native baseline and live tree with both an ordinary Home and the original cold output. This does not preserve Octane component state across recreation: these controls create new logical owners per generation.

Force retirement while the first hidden reference exists, then require cancellation and successful warm-generation parity with one runtime:

```sh
export XPLAT_PRERENDER_ANDROID_HOME_RECREATE=1
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Build Android Home Activity lease control"}' -- bun turbo run probe:prerender:android:build --filter=@xplat/platform-qualification
```

This flag requires Home parity/adoption and their SDK inputs above. Run its printed build through the same reserved device task. The driver rejects stale completion from an earlier Activity, and fingerprints its event-selection helper along with the driver. The build also snapshots its own packager source for later evidence review. Keep Core Application/main-entry owner restoration and native deallocation as separate gates.

### Android Home OS input

Set `XPLAT_PRERENDER_ANDROID_HOME_INPUT=1` with the Home parity/adoption inputs when building, then run the printed APK through the reserved device task. This can also run with the forced-recreation control. After the latest live Activity completes parity and disposes its hidden reference, the driver uses `adb shell input tap` at each original Button's native screen-space center. It requires actual Activity down/up dispatch, count/status changes3→4→3, attached nonzero native geometry, retained original native/Mason/raw-node identities and zero physical child churn. It never invokes a JS press handler directly. Native observations and coordinates are retained in `home-input.json`; this does not establish pixels, compositor presentation, broader gesture behavior or Core Application/window handoff.

### Android Home Core Application handoff

`XPLAT_PRERENDER_ANDROID_HOME_APPLICATION=1` enables an experimental explicit-content handoff with the Home adoption inputs. It can combine with parity, forced retirement and OS input. The JS entry calls actual `Application.run()` and catches up only Core's own lifecycle observer for the already-running cold Activity. Warm Activities use ordinary observer delivery. The version-pinned observer seam is not a supported late-bootstrap API.

After the full Home commits, Android's real `ActivityCallbacks.resetActivityContent` installs the same wrapper root into its NativeWindow. Native `setContentView` skips physical replacement only for the exact already-installed viewport under the same Activity content parent. Start/stop/post-resume forwarding uses native phase facts and executes native super once. The checker requires one ready/open event, one registered primary window session, matching Application/window/wrapper root owners, and a native content-adoption receipt for both cold and accepted live generations. This explicit-content control creates fresh logical owners per Activity; normal main-entry restoration, Octane component-state preservation, complete Activity callbacks and deallocation remain separate gates.

### Android retired Home object lifetime

Add `XPLAT_PRERENDER_ANDROID_HOME_LIFETIME=1` to the Home Application, forced-recreation and parity inputs. On destruction, the native host captures only Java weak references to the adopted generation's original19 views and19 Mason Node objects, then releases its Scene after normal wrapper destruction. Once the warm generation completes parity, the JS control requests NativeScript/Java GC and samples the weak references on later turns, bounded to eight attempts. The driver requires one retired generation, observed counts19/19 and no surviving objects before optional warm-generation OS taps. A bounded failure reports surviving indices; it does not by itself diagnose a leak. Collection of these Java objects is separate from Rust allocation reclamation or stable memory across repeated cycles.

Retirement restores the native attachment overrides, clears wrapper native/style caches, releases owned parent links and empties explicit native/parent/wrapper arrays. Per-root factory closures capture a small claim state instead of the whole Activity creation scope. Before JS, the Application also initializes widgets' process image Fetcher with its Application context; otherwise Core9.1.3's first image-cache callback can pin a retired Activity. The source/heap evidence and removal condition are recorded in [native adoption boundaries](../../../.agents/docs/native-prerender-adoption.md).

Set `XPLAT_PRERENDER_ANDROID_DUMP_HEAP=1` on the reserved device run to capture a heap when lifetime qualification fails. The driver copies the fixture's dump into its local report and removes its unique device temporary file. Diagnostic capture never turns a failing qualification into a pass; errors preserve the original failure. Keep raw heaps outside Git with other local evidence.

### Android rejected-IR fallback

Build with `XPLAT_PRERENDER_ANDROID_HOME_FALLBACK=build`, Home adoption/Application inputs, and parity/recreation/input flags unset. The packager deliberately changes one build-identity byte while retaining the payload and checksum. The native host catches decoder validation rejection before constructing HomeScene, records whether the runtime/library has started, and posts ordinary startup. The JS path renders the same shared Home with `createNativeScriptRoot(host)` and no adoption factory, then hands that fresh root to Core Application/window ownership.

The checker requires rejection before the only VM start, no decoded/adopted native Home receipt, no installed adoption factory, and all19 ordinary native records with the producer's kind/text/parent order and attached nonzero geometry. This first control covers stale-build preflight rejection and ordinary recovery only; post-claim failure rollback, missing assets, unsupported device inputs, fallback OS input, state restoration and deallocation remain separate gates.

Use `XPLAT_PRERENDER_ANDROID_HOME_FALLBACK=seed` with the same inputs to retain valid native IR at count3 and prepare live Home at count4. Matching throws a typed `AdoptionMismatch` before host setup or claims. That prepared plan aborts; its unused root unmounts with zero factory calls, and the native tree detaches and empties its native/Mason children. Ordinary recovery uses the live seed and existing Core window. The checker requires the pre-JS count3, rejection/abort with zero claims and unattached wrappers, discarded empty native/Mason children, unused-root disposal, then an ordinary attached19-view Home at count4. Other exceptions remain failures. This covers pre-claim mismatch recovery, not rollback after claims or native-object deallocation.

`XPLAT_PRERENDER_ANDROID_HOME_FALLBACK=attach` injects a distinct failure during the seventeenth existing-child native attachment. This exercises disposal after native claims and Core setup have begun. Only that injected error enters the control's recovery path. The failed root unmounts synchronously, its host unloads/tears down, and the native/style claim caches retire before ordinary same-window rendering. Cleanup must leave no wrapper native handles, Activity contexts or loaded state, and discard must empty the remaining native/Mason children. Empty child lists and cleared wrapper handles do not prove native-object or Rust-allocation deallocation. General application/commit exceptions still fail; this is a bounded failure qualification rather than a policy to suppress errors.

Failed insertion can remove a child from Mason's collection while leaving Core parent/context state behind. Recovery therefore owns an explicit claim list and clears parent links as well as contexts/handles before mounting the ordinary root. The version-pinned Core removal seam and dependency rollback gap are recorded in [native adoption boundaries](../../../.agents/docs/native-prerender-adoption.md); requalify them on dependency updates.

After a successful build writes its APK and input manifest, the packager removes that fresh run's reproducible compiler intermediates. It retains the APK, frozen source/SDK inputs, generated app sources and logs for verification. Repeated builds should not retain hundreds of megabytes of compiler output per run.

### Android Label wrapper ownership control

Set `XPLAT_PRERENDER_ANDROID_LABEL_WRAPPERS=1` before the Android build command above to replace direct Java widget mutation with real Core9.1.3 `Label` wrappers. The build bundles actual Core globals/Label and their dependencies with Android resolution, snapshots every bundled JS input, and fingerprints the resulting APK. Bun1.4.4 is required for this optional bundle step. Use the same separate device command with its printed build directory.

Each Label claims its existing StyleableTextView through an instance `createNativeView` callback, after Core sets the Activity context. Ordinary setup/loading/property setters run; no replacement native label is constructed. The native fixture matches Core’s disabled font-padding default. The checker requires retained per-Activity native/Mason identity, established context/loading, a wrapper text update that remeasures the initial tree like the fresh recreated tree, and unchanged single-line height. Destruction unloads/tears down both wrappers, verifies empty context/native handles, retires their claim closures and drops the wrapper array before rebinding.

The native Activity still owns the Mason container. These two wrappers have no NativeScript logical parent, and there is no Octane prepare/commit, root-factory claim transaction, Core Application/NativeWindow handoff or renderer-state restoration. Do not treat this control as Android Home hydration or full style/default parity. In particular, Mason’s ordinary Android child attachment calls native `addView`; adopting already-parented children needs a separately qualified attachment path before the complete tree can hydrate.


### Android Mason parent adoption control

The next bounded control adds the actual Mason View wrapper as the logical parent of the two real Labels. Select a pinned, compiled Mason JS SDK compatible with the selected native AAR, then enable this mode before the same build/device commands:

```sh
export XPLAT_PRERENDER_ANDROID_LABEL_WRAPPERS=1
export XPLAT_PRERENDER_ANDROID_MASON_PARENT=1
export XPLAT_PRERENDER_ANDROID_MASON_ADOPT=1
export XPLAT_PRERENDER_ANDROID_MASON_RUNTIME_ROOT=/absolute/path/to/pinned/mason/js-sdk
```

The experimental per-root adapter checks the complete two-child native order before setup. During child setup it skips native insertion only when the child already belongs to that exact parent at the expected native index, then runs the existing Mason foreign-child bookkeeping. Other attachments call the ordinary wrapper method. Core establishes logical parentage and loading. This is a private probe of an adoption seam, using internal Mason methods; the shared SDK and production renderer are unchanged. Every bundled Mason/Core JS input is snapshotted and hash guarded.

The control checks zero physical additions/removals during initial adoption, then uses ordinary wrapper operations to reverse and restore the two children and insert/remove a new Label. Native Java checks physical order, Mason child order, original node objects/raw handles and actual hierarchy-event counts after each step. It also requires empty native/Mason children and released Label handles on destruction, then repeats adoption and updates on the replacement Activity with one runtime. This does not prove native-object deallocation.

Omit `XPLAT_PRERENDER_ANDROID_MASON_ADOPT` to exercise the ordinary attachment path as a negative control. With the pinned SDK, initial child setup throws Android’s specified-child-already-has-a-parent exception. Preserve the failed run and its exact native log; a timeout or unrelated import failure is not that negative control. The runner reports wrapper failures immediately from the native receipt.

This control still does not hydrate Octane, validate a prepared Home IR transaction, hand off Core Application/NativeWindow ownership or prove general CSS/default removal, viewport sizing, compositor presentation, process-death restoration or startup performance. Reorder/insert/remove here are synchronous wrapper operations, not OS input or a renderer reconciliation qualification.


### Android Core Application and window handoff control

The host uses a native AppCompatActivity and matching AppCompat theme so Core’s actual Activity callbacks can run after native startup. Add this flag to the matched Mason-parent build above:

```sh
export XPLAT_PRERENDER_ANDROID_APPLICATION=1
```

This mode runs actual `Application.run()` before binding the first tree. Core registers its lifecycle observer at that point, after the cold Activity has already launched. The probe invokes only that Core observer’s missed creation/start/resume callbacks using native Activity phase facts. It never broadcasts historical events to other observers. Later Activities bind from a posted callback, after Core’s ordinary observer has created or reattached their window. Access to Core’s private `lifecycleCallbacks` field is an explicit version-pinned probe seam; it is not a supported late-bootstrap API.

The probe installs the real Core ActivityCallbacksImplementation with `setActivityCallbacks`, then uses its Android `resetActivityContent` pipeline to initialize root settings, assign Application root ownership and adopt the root into NativeWindow. The native host skips `setContentView` only when the requested view is its exact already-installed root under the expected Activity content parent. Other content uses the ordinary native setter. Start/stop/post-resume/destruction call the corresponding real Core handlers after native super methods have executed once. The no-op super callbacks represent that completed native phase.

Do not substitute generic `NativeWindow.setContent` in this pinned Core9.1.3 control. Its common root-settings path first calls `_setupAsRootView({})`, then the Android path switches back to the Activity. The resulting context changes tear down and reattach children, even when the native root setter is skipped. The existing Android content pipeline avoids that temporary context and performs NativeWindow adoption itself. Retain attachment counters when investigating an alternative pipeline.

The checker requires one ready event, one registered/primary window session, the same root through Application/NativeWindow/wrapper lookup, exact lifecycle delivery across recreation, and the same window ID after saved-state reattachment. Each Activity’s native root must have one initial window attachment and zero detachments at its passing receipt. The parent/label identity, text remeasurement, ordinary child mutations and teardown checks still run.

This is an explicit-content handoff, with no main entry or legacy launch-event producer. It does not qualify an app’s normal create/launch flow, arbitrary plugin initialization, all Activity callbacks, same-Activity background/foreground restoration, renderer/component state across recreation, process death, Octane/Home IR, general style/default parity, viewport sizing, OS input, compositor presentation, native deallocation or release performance. The callback catch-up and native setter rule remain experimental host integration. No Core or runtime SDK source is modified.


### Android normal app entry and saved JS owner restoration

Add the normal-entry flag to the Application control to run actual `Application.run({ create })` and Core’s Activity `onCreate` content pipeline instead of explicit reset content:

```sh
export XPLAT_PRERENDER_ANDROID_APPLICATION_ENTRY=1
```

The app’s create factory returns the already-prepared wrapper root. Core resolves its ordinary main entry and legacy launch event, records the root in its own activity-root map, and receives actual Activity saved state. The native host forwards `onSaveInstanceState` to Core after native super has executed once. After recreation, Core must restore the same saved JS root: the main factory and launch event must each remain at one call, and root/Label owner IDs and updated text must survive. Native objects and Activity contexts belong to their respective generations.

The probe retains these JS wrappers across destruction while retiring that Activity’s native lease. It restores each Label’s original native factory, clears the Mason root’s cached native/style helpers, and restores its ordinary attachment method. Before the next binding it checks that those old native caches have not returned. It then binds the retained wrappers to the replacement fixture’s native objects and runs the same setup, identity, mutation, text, window and attachment checks. This tests a fixed two-label native topology; it does not prove ordinary native allocation for arbitrary restored trees.

This mode covers live Core wrapper owners and their authored text across one saved-state Activity recreation. It does not qualify Octane component/hook state, route or topology changes, process-death restoration, arbitrary plugin startup, complete Activity callbacks, native object deallocation, broad style/default removal, full Home IR, viewport/pixel presentation or performance. No Core/runtime SDK source changes are needed for this bounded path; private lifecycle catch-up remains version-pinned.
