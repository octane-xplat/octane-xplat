# Native macOS AppKit support for Lottie

> AppKit Lottie is implemented through a pinned Airbnb engine. This record
> separates its source/build evidence from actual JavaScriptCore runtime checks.

Started from `a4079d54`; the investigation was committed as `b60451c0` before
the implementation follow-up. Decision #95 records the selected engine and
bounded input contract. The AppKit implementation now lives in the normal
`@octane-xplat/lottie` macOS leaf, while web/iOS/Android keep their existing
engines and source behavior.

## Recommendation

Use Airbnb Lottie 4.6.1 with a small `@objc` Swift adapter compiled into the
same macOS leaf library. The supported AppKit sources are inline animation
objects, raw JSON in `src`, absolute local JSON files, `file://` URLs, and
HTTPS JSON URLs. Relative paths, `~/`/`res://` aliases, HTTP URLs, and archive
containers are rejected or unsupported. No new `packages/ui` dependency or
mobile vendor import is involved.

The audited tag is `4.6.1`, upstream commit
`f4db77d7feacba0c2360b84a40c38a6ce8ff399d`. It is a tested candidate, not an
assertion that future releases behave identically.

## Engine choice (source evidence)

| Candidate               | AppKit path                                                                                                     | Assessment                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Airbnb Lottie 4.6.1     | `LottieAnimationView` inherits an actual `NSView`; AppKit content modes and flipped coordinates are implemented | Recommended: native view/layer lifecycle and existing control API closely match our leaf                                                              |
| LottieFiles dotLottie   | macOS 11+; Swift wrapper around Rust engine, with DotLottiePlayer and WgpuNative XCFramework targets            | Viable alternative if dotLottie features drive the choice; needs binary-framework integration, dependency/license inventory and its own runtime audit |
| Samsung rlottie         | C++ renderer produces surface buffers; no ready AppKit view                                                     | Reject for this task: own view, clock, buffer presentation and events required; upstream now declares it unmaintained                                 |
| lottie-web in WKWebView | Browser engine in an embedded web surface                                                                       | Different rendering architecture; not the native AppKit integration requested                                                                         |

Sources: [Airbnb package manifest](https://github.com/airbnb/lottie-ios/blob/4.6.1/Package.swift),
[AppKit base](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/macOS/LottieAnimationViewBase.macOS.swift),
[dotLottie manifest](https://github.com/LottieFiles/dotlottie-ios/blob/main/Package.swift),
[dotLottie license](https://github.com/LottieFiles/dotlottie-ios/blob/main/LICENSE),
[rlottie status and surface API](https://github.com/Samsung/rlottie/blob/master/README.md).
The alternatives were source-audited, not compiled or run here.

Airbnb's `CompatibleAnimationView` is guarded by `canImport(UIKit)` and inherits
`UIView`. It is not a macOS bridge. Expose only our adapter's Objective-C-safe
methods, scalar properties, `NSView`, strings/errors and completion blocks;
keep Swift models/enums/async APIs behind that boundary.
[Compatibility wrapper](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/iOS/Compatibility/CompatibleAnimationView.swift).

## Existing bridge and build machinery

`packages/cli/src/macos/native.mjs` discovers transitive installed leaves under
`platforms/macos`. It compiles Swift, emits a generated Objective-C header,
validates public headers and generates combined SDK/leaf metadata. The
bootstrap loads libraries with `dlopen` before app JavaScript. Both the leaf
fixture and the component probe use this real prebuilt
JavaScriptCore/NativeScript host.

The leaf configuration now also accepts scoped Swift whole-module
optimization, explicit system imports for the generated Swift header, app
resources, and third-party notice files. The engine is compiled as sources in
one leaf module, avoiding a SwiftPM resolver, XCFramework slice selection,
binary framework paths and separately importable Swift modules. Native inputs
must remain inside `platforms/macos`.

A source-in-one-module route avoids those module/binary gaps. The leaf contains
the pinned upstream `Sources` plus `XplatAppKitLottie.swift`. UIKit code is
excluded by upstream conditional compilation; AppKit never imports
`packages/lottie/src/vendor/ui-lottie`. The source pin and dependency licenses
are documented next to the copied files.

`packages/macos-renderer/src/index.mjs:makeNode` has a fixed host vocabulary;
mobile `xplatlottie` registration cannot work there. The leaf uses the
supported `flexboxlayout` host, and the adapter adds its `LottieAnimationView`
as a direct AppKit child pinned to all four host edges with Auto Layout. The
renderer owns the host's style, size, and accessibility. The adapter removes
its native child and constraints during disposal; it does not add that child to
the renderer's virtual child list.

## Shared contract mapping

| Public surface                     | Native mapping / ownership                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                             | Serialize JSON in JS; parse `Data` in Swift. It wins over `src`. Parse failure emits `onError`, never `onLoaded`.                                                                                                      |
| Raw JSON `src`                     | Uses the same parser as `data`.                                                                                                                                                                                        |
| Absolute file / `file://`          | Read and parse off the UI thread; install on the main thread. Relative paths are rejected.                                                                                                                             |
| `~/`, `res://`, relative paths     | Unsupported on AppKit; the leaf does not map bundle aliases or working-directory paths.                                                                                                                                |
| HTTPS URL                          | `URLSession` fetch with HTTP status handling, cancellation and a source-generation token. A successful remote fetch is not covered by the deterministic runtime fixture. Source-relative image assets are unsupported. |
| HTTP URL                           | Rejected; AppKit remote sources require HTTPS.                                                                                                                                                                         |
| `.lottie` / `.zip`                 | Rejected; archive and multi-animation selection are not part of this leaf contract.                                                                                                                                    |
| `autoPlay`, `playing`              | Apply after a successful load; controlled `playing` wins. Pause/resume use engine methods.                                                                                                                             |
| `progress`, `seekTo`               | Clamp finite values to 0..1, set the playhead, and read real-time progress during playback. Seeking while playing resumes from the requested position.                                                                 |
| `duration()` / `onLoaded.duration` | Engine seconds × 1000; return zero before successful load.                                                                                                                                                             |
| `speed`, `setSpeed`                | Finite values set `animationSpeed`. Positive speed 2 was exercised; zero/negative direction behavior is unverified.                                                                                                    |
| `loop`                             | `.loop` / `.playOnce`; looping playback does not emit a finite end event.                                                                                                                                              |
| `play`, `pause`, `stop`            | Resume from current position, freeze current position, stop/reset to zero respectively.                                                                                                                                |
| `onEnded`                          | Only a genuine finite completion with `finished == true`; cancellation is not completion.                                                                                                                              |
| `fit`                              | contain → `scaleAspectFit`, cover → `scaleAspectFill`, fill → `scaleToFill`. Mapping and source setter compile; pixel parity and live resize have not been visually checked.                                           |
| `ref`, `native`                    | Stable `LottieHandle`; cleanup removes the AppKit view. `native` is the real `LottieAnimationView`; the adapter stays private.                                                                                         |

Loading API sources: [animation helpers](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationHelpers.swift),
[dotLottie helpers](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/DotLottie/DotLottieFileHelpers.swift).
Playback source: [view API](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationView.swift).

The adapter uses `.mainThread`, the engine exercised in the feasibility
fixture. Availability of the Core Animation engine is not evidence that every
animation works in it. AppKit's view tracks attachment to a window; app
background and window-detach behavior remain to be characterized. View changes
and JS callbacks run on the host main thread. Source replacement invalidates
generations and cancels downloads; disposal clears callbacks, stops playback,
removes constraints and the native child, and releases animation data.

## Packaging and dependency requirements

Airbnb's [license](https://github.com/airbnb/lottie-ios/blob/4.6.1/LICENSE) is
Apache-2.0. The copied source embeds ZIPFoundation 0.9.20, EpoxyCore 0.11.0,
and LRUCache 1.0.4. Their license texts are kept beside the vendored source
and included by the macOS packager. The adapter does not depend on the SwiftPM
manifest's separate `swift` package; it is not a Lottie runtime target
dependency.

The implementation packages `platforms/macos` source with the leaf, copies
`PrivacyInfo.xcprivacy` into app Resources, and appends the engine/dependency
licenses to `Contents/Resources/licenses/THIRD-PARTY-NOTICES.txt`. Sources,
resources and notice files participate in native input hashing. No app-side
engine dependency is added. The host target remains arm64 macOS 13.5+; upstream's
wider deployment range does not extend that support claim.

The full AppKit package path has not been exercised as a signed/notarized app.
Relocation, hardened-runtime distribution, install-name inspection in a
consumer app, and notarization remain release checks.

## Evidence and remaining acceptance gates

The retained native fixture in `packages/lottie/tests/appkit-feasibility`
builds the real leaf and adapter through the production macOS builder. Run it
from the repository root:

```sh
pnpm exec node packages/lottie/tests/appkit-feasibility/run.mjs
```

It creates disposable build artifacts in ignored `research/` and starts the
real JSC host. It uses a locally authored solid-layer animation, no downloaded
artwork, screenshots, or visible window. It requires Xcode, compatible
metadata-generator libclang, and the bundled CLI host.

**Native source/build evidence:** the production builder compiled the pinned
Airbnb source and adapter into the leaf dylib, generated metadata, and reported
the privacy manifest and license notice as packaged inputs. Scoped
`-whole-module-optimization` brought compilation within the existing 180-second
per-command timeout. Explicit AppKit/QuartzCore imports let the generated
Objective-C header validate. The installed Swift compiler rejected an
unsupported `-emit-module-doc-path` flag; removing it and keeping module output
in the staging directory fixed the build path.

**Adapter runtime:** the 22-assertion fixture exercises JSON parsing, millisecond duration,
real `NSView` mounting and constraints, normalized seeking, speed/fit/loop
properties, intermediate progress, pause stability, finite completion and its
Swift block callback into JavaScript, looping without finite completion,
stop/reset, absolute local-file loading, HTTP rejection, malformed JSON errors,
and disposal. Runtime claims require the
`LOTTIE_APPKIT_INTEGRATION_OK` marker and process exit 0. Core Animation mode
was not tested.

**Component runtime:** the 20-assertion `examples/probes/lottie.macos.tsrx` mounts the public
component, checks its ref and window-attached view, exercises loaded, seek,
play/pause/end, speed, loop, error, and unmount cleanup. It runs as part of
`pnpm smoke:macos`. Neither fixture captures or inspects a screenshot.

The original feasibility run showed that a detached host view would not play.
The passing fixture attaches to a hidden `NSWindow`, without ordering it
onscreen, and requires both the success marker and process exit 0. The component
probe uses the regular AppKit harness. These checks establish runtime behavior,
not physical mouse input, VoiceOver, pixels, or visual parity.

Remaining checks: successful HTTPS fetch, source-replacement races, repeated
mount/disposal, remote image/font assets, app background/window-detach policy,
live-resize appearance, Core Animation mode, and a signed packaged app. No
visual analysis was authorized or performed.

## Parallel declaration repair boundary

No changes to public props, export conditions, generated declarations, typegen,
or packed-consumer checks are made here. The existing workspace and publish
export maps route the `macos` source condition to `src/index.macos.ts`; this
change only adds the top-level `xplat.macos` native-build configuration in the
same `package.json`. The parallel declaration repair owns the missing macOS
type route/generated entry. Its exact source overlaps are `src/props.ts` (the
shared `src` form description and `LottieHandle.native` documentation) and the
generated macOS declaration entry that imports those props. The adapter uses
the existing `LottieProps` and `LottieHandle` contract. Consume the parallel
repair's declaration entry rather than independently rewriting it.

The Lottie recipe, package README, primitive guide, known-limits page, shared
demo, and maintained AppKit probe now describe the same source boundary.
Coverage and runtime execution are recorded separately in Silo's
`recipe_audit`. Web/iOS/Android implementation files and runtime paths are
unchanged by this AppKit addition.
