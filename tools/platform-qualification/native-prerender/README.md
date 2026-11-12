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

`Home.tsrx` and `home.css` define the selected purpose-built milestone with real shared `VStack`, `HStack`, `Text` and `Button` components. Initial data is explicit (`name` and `initialCompleted`); actions increment or reset progress without changing the host topology. The CSS includes light/dark colors. This screen is the next producer/adoption target, separate from the disposable two-label XPR0 mechanism fixture. The maintained commands below check compilation only; native loading and adoption of this screen remain separate experimental work.

Check compilation with an installed Octane toolchain:

```sh
export XPLAT_PRERENDER_TOOLCHAIN_ROOT=/absolute/path/to/installed/app
bun turbo run probe:prerender:home:check --filter=@xplat/platform-qualification
```

This check compiles the authored component. It does not execute the real shared-component dependency closure, typecheck public props, apply CSS, or qualify native rendering/hydration. Those checks remain required before using the screen as the startup path.

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

The fixed 80-byte header uses little-endian integers:

| Offset | Field |
| --- | --- |
| 0 | Four-byte magic `XPH1` |
| 4 | Version `u16=1`, reserved flags `u16=0` |
| 8 | Total bytes `u32`, visual node count `u32` |
| 16 | Expected build identity, 32 bytes |
| 48 | Payload SHA-256, 32 bytes |

The payload contains a scope string, initial-data object, ordered node records, then light and dark style records. Each node stores a one-byte container/Label kind, a `u32` parent index (`0xffffffff` for the root), text and portable props. Paths and child lists are derived from parent order. Each theme has one style/provenance record per node. Literal tags represent null, booleans, finite little-endian float64 numbers, UTF-8 strings, arrays and objects; strings and collections have `u32` lengths. No JSON text, native pointers, transient renderer IDs, Mason buffer offsets or native struct layouts are embedded.

Bounds are 1 MiB total, 1,024 nodes, 65,536 bytes per string, literal depth below 16, 1,024 array entries, 256 object entries and 100,000 literal values. The reader rejects unknown versions/flags/tags, bad references, duplicate keys, unsupported style names, invalid UTF-8, non-finite numbers, trailing bytes and mismatched checksums/build identities. The host must supply the expected build digest from its producer/runtime/CSS/initial-data inputs; a checksum provides corruption detection, not authenticity. Unsupported native property values still require semantic lowering validation before mounting.

This is a compatibility experiment, not the frozen production IR. It retains resolved style names and provenance for inspectability; it makes no size or speed claim. Compiler-stable logical identities, environment invalidation, a complete control/property ABI and failure fallback remain separate contracts. JSON is the optional debug projection of the same data, rather than a separate rendering path.

## Retained Home runtime fixtures

The real-screen experiment has separate native and JavaScript entry points:

| Source | Role |
| --- | --- |
| [HomeBootstrap.swift](home-native/HomeBootstrap.swift) | Binary decode, native Home mount, explicit engine gate and identity assertions |
| [home-adoption.ios.js](home-adoption.ios.js) | Prepared-tree matching, root-scoped claims, Page handoff, Button updates, sibling isolation and compared style removal |
| [home-fallback.ios.js](home-fallback.ios.js) | Stale-theme rejection before claims, ordinary Home mount and current-theme/Button checks |
| [home-primitives.ts](home-primitives.ts) | Four actual shared primitive exports, avoiding unrelated public-barrel imports |

These are private qualification fixtures, not app bootstrap APIs. The host build substitutes `__XPLAT_PRERENDER_BUILD_HASH__` exactly once in the Swift source, compiles it as the application entry point with `HomeArtifact.swift`, and links the three native helper objects plus the runtime/Core embedding helpers. It packages `home.bin` and resolves the JavaScript virtual modules `xplat-prerender:artifact` and `xplat-prerender:styles` to the matching debug projection and normalized stylesheets. Retarget Octane imports to the native universal runtime and apply the isolated driver factory patch. Record those inputs with the host build; the baseline two-label launcher is not a Home launcher.

The positive fixture reads binary before engine initialization, then checks the same nineteen native objects through live adoption. The failure fixture requires compiling Swift with `-D XPLAT_PRERENDER_STALE_THEME` and selecting `home-fallback.ios.js`: it changes the owning window theme before JS starts. JavaScript rejects the stale preparation without consuming claims, detaches the old native root through Mason and mounts a fresh Home. These cases must use distinct input-bound build identities. A launcher must check the app identifier, binary decode event, nineteen visual nodes and the matching final result kind; accepting any generic `passed` event can run the wrong fixture.

The host waits on display-link progress and checks window attachment; compositor presentation remains unqualified. The fixtures intentionally retain diagnostic handles and cover a fixed tree. They do not establish leak freedom, arbitrary environment changes, rollback after partial native application, OS touch or startup performance. The complete host build/producer pipeline still requires an experimental adapter; the maintained compile-only and codec commands above do not build this app.

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
