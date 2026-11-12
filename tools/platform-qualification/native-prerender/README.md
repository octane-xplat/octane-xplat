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

The runner rejects source changes since the last build. Successful results and build fingerprints are retained under `~/dev/reports/octane-xplat/native-prerender-bootstrap`. Exit zero establishes only the assertions described above. The runner also clears and retains optional `selector-parity.json` and `entry-details.json` diagnostics produced by control investigations, preventing earlier results from surviving into a later run. A timeout or runtime crash is a failure, not a pending pass. Do not compare the debug-runtime mechanism timings to release app startup.

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

Each invocation writes two object files, compiler arguments and an input/output hash manifest below `~/agent-scratch/octane-xplat/native-prerender-home-helpers`. These objects still need the host, Mason, TNSWidgets, CoreText and core’s native text helpers at link time. The command creates no app and runs no device; its output explicitly records `linked:false` and `runtimeQualified:false`. Follow the plan’s separate native geometry, style ownership and hydration gates.

## Boundaries for native style loading

Keep selector matching and cascade resolution in the producer for a known initial tree. Native loading still needs explicit property conversion: Mason native lengths use physical pixels, UIKit frames and fonts use logical points, and percentages remain fractions. Read scale from the owning window’s screen and convert each length once. Mason dimension type codes differ from length/percentage type codes; use the named enums from the exact SDK header rather than sharing numeric tags between setters.

For iOS fonts, use the pinned NativeScript behavior as the reference. `NativeScriptUtils.createUIFont` selects the base font, but this repository’s core patch also applies CoreText variable axes, including numeric CSS weight. Calling only the stock helper can choose a different semibold font and text metrics. Keep that small native conversion aligned with the owning core patch; it does not require moving selector matching or the cascade into native code.

A snapshot’s applied values are not the control’s native defaults. Preserve the original native defaults separately before startup styling, then establish live property ownership at adoption. A stock property reset, native-baseline restoration and setter replay can avoid direct per-property cache manipulation, but each required native property family must be verified against ordinary creation and later removal. A font-only comparison does not establish general style ownership.

Use NativeScript’s supported embedding delegate when handing an existing window/controller to Application. The default core SwiftUI host registers one before runtime setup. A custom host that omits it can initialize the root under two UI contexts and tear down the adopted children. Page/Frame ownership, safe-area geometry, lifecycle forwarding and actual/native caches still need their own checks. Compare measured dimensions under the same constraints with ordinary creation: measured size and the final stretched frame are not interchangeable.
