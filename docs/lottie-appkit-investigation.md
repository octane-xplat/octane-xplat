# AppKit Lottie feasibility

> Choose a native macOS engine and identify the evidence and packaging work
> required before replacing the unsupported Lottie leaf.

Investigation record, 2026-10-02, starting from `a4079d54`. This is an
implementation recommendation, not a supported feature or an app-building guide.
The production macOS leaf remains explicitly unsupported. The unchanged leaf
reports `onError` on mount, leaves `ref` empty, and emits no loaded/ended events;
its macOS source export already exists in workspace and publish exports.

## Recommendation

Use Airbnb Lottie 4.6.1 with a small `@objc` Swift adapter compiled into the
same macOS leaf library. Keep the engine in `packages/lottie`; no new UI
package dependencies or mobile vendor imports are needed. First ship inline
JSON and explicit local JSON files only if the remaining acceptance gates are
met and that narrower source support is documented. Do not advertise the whole
mobile source contract on the strength of this experiment.

The audited tag is `4.6.1`, upstream commit
`f4db77d7feacba0c2360b84a40c38a6ce8ff399d`. It is a tested candidate, not an
assertion that future releases behave identically.

## Engine choice (source evidence)

| Candidate | AppKit path | Assessment |
| --- | --- | --- |
| Airbnb Lottie 4.6.1 | `LottieAnimationView` inherits an actual `NSView`; AppKit content modes and flipped coordinates are implemented | Recommended: native view/layer lifecycle and existing control API closely match our leaf |
| LottieFiles dotLottie | macOS 11+; Swift wrapper around Rust engine, with DotLottiePlayer and WgpuNative XCFramework targets | Viable alternative if dotLottie features drive the choice; needs binary-framework integration, dependency/license inventory and its own runtime audit |
| Samsung rlottie | C++ renderer produces surface buffers; no ready AppKit view | Reject for this task: own view, clock, buffer presentation and events required; upstream now declares it unmaintained |
| lottie-web in WKWebView | Browser engine in an embedded web surface | Different rendering architecture; not the native AppKit integration requested |

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
bootstrap loads libraries with `dlopen` before app JavaScript. The experiment
uses this machinery and the real prebuilt JavaScriptCore/NativeScript host.

The configuration accepts `sources`, `headers`, `includePaths`, `frameworks`,
`libraries`, and `defines` only. Framework/library names are system names;
there is no SwiftPM resolver, XCFramework slice selector, `-F`/`-L` configuration,
Swift module dependency output, resource bundle or leaf notice-copy contract.
Native inputs must remain inside `platforms/macos`. Linking a transitive dylib
alone does not make a Swift module importable.

A source-in-one-module route avoids those module/binary gaps. The fixture
copies the pinned upstream `Sources` into a disposable private leaf and adds
its own adapter. UIKit code is excluded by upstream conditional compilation;
it never reads or imports `packages/lottie/src/vendor/ui-lottie`. A production
source vendor must be pinned, reproducibly synchronized, licensed, and scoped
explicitly; do not turn this investigation's temporary copy into a package.

`packages/macos-renderer/src/index.mjs:makeNode` has a fixed host vocabulary;
mobile `xplatlottie` registration cannot work there. Mount a supported host
(e.g. `gridlayout`) and add the adapter's view as a native child, pinning its
four edges to the host with Auto Layout. Forward host size/style/accessibility
normally. Keep direct native children out of renderer child reconciliation and
remove them explicitly on cleanup. This proposed renderer integration has not
been exercised by the feasibility fixture.

## Shared contract mapping

| Public surface | Native mapping / ownership |
| --- | --- |
| `data` | Serialize JSON in JS; parse `Data` in Swift. It wins over `src`. Parse failure emits `onError`, never `onLoaded`. |
| Raw JSON `src` | Same parse path; distinguish from file/URL before loading. |
| Absolute file / `file://` | Convert explicitly to file URL; read/parse off the UI thread; install view on main thread. Relative-path policy must be explicit. |
| `~/`, `res://` | Framework-owned mapping to packaged app resources, not Unix home expansion. Needs asset-copy and bundle lookup tests. |
| HTTPS URL | Native URLSession download with error/status handling, cancellation and a generation token. Engine URL loaders exist but failure detail is limited. Remote image assets need an image provider/base URL policy. |
| `.lottie` / `.zip` | Upstream `DotLottieFile` parses archives with embedded ZIPFoundation. Define multi-animation selection and asset ownership. Arbitrary mobile ZIP layouts are not proven compatible. |
| `autoPlay`, `playing` | Apply after accepted load; controlled `playing` wins. Pause/resume use engine methods. |
| `progress`, `seekTo` | Clamp finite values to 0..1, set `currentProgress`; read `realtimeAnimationProgress` during playback. Seeking cancels active playback; define whether controlled playing restarts it. |
| `duration()` / `onLoaded.duration` | Engine seconds × 1000; return zero before successful load. |
| `speed`, `setSpeed` | `animationSpeed`; validate finite values and verify zero/negative behavior before claiming reverse playback. |
| `loop` | `.loop` / `.playOnce`; never emit `onEnded` per loop iteration. |
| `play`, `pause`, `stop` | Resume from current position, freeze current position, stop/reset to zero respectively. |
| `onEnded` | Only a genuine finite completion with `finished == true`, current load/play generation, and live mount. Cancellation is not completion. |
| `fit` | contain → `scaleAspectFit`, cover → `scaleAspectFill`, fill → `scaleToFill`. Verify resize/cropping numerically; visual parity remains unverified. |
| `ref`, `native` | Stable `LottieHandle`; clear refs on cleanup. Decide/document whether `native` is adapter or `NSView`; do not expose a fake plugin view. |

Loading API sources: [animation helpers](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationHelpers.swift),
[dotLottie helpers](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/DotLottie/DotLottieFileHelpers.swift).
Playback source: [view API](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationView.swift).

Use `.mainThread` as the first engine to characterize, then evaluate
`.automatic` / Core Animation separately. Availability of an accelerated
engine is not evidence that every animation works in it. AppKit's view tracks
attachment to a window; adopt explicit background/window-detach policy rather
than assuming mobile app notifications apply. All view mutation and JS
callbacks must run on the host main thread. On source replacement or disposal,
invalidate generations, cancel downloads, clear callback blocks, stop playback,
remove child constraints/view and release the engine. Bound caches separately;
unmount should not indiscriminately clear a process-wide cache.

## Packaging and dependency requirements

Airbnb's [license](https://github.com/airbnb/lottie-ios/blob/4.6.1/LICENSE) is
Apache-2.0. Preserve license/attribution and modification notices. Its source
embeds ZIPFoundation 0.9.20, EpoxyCore 0.11.0 and LRUCache 1.0.4; audit their
embedded notices too (ZIPFoundation/LRUCache carry MIT notices). The SwiftPM
manifest references Airbnb's `swift` package (not a Lottie target runtime
dependency) and a privacy manifest resource.
The direct-source fixture bypasses SwiftPM and does not establish that these
resources are correctly distributed.

For production, prefer pinned source in the leaf over new binary framework
support solely for Lottie. Package `platforms/macos` sources and notices in the
npm tarball; hash them for cache invalidation. Include upstream
`PrivacyInfo.xcprivacy` and animation/image assets in the final app with a
specified lookup path. The current packager copies leaf dylibs and metadata,
then signs native libraries, but its third-party notice output does not collect
leaf notices and it has no general leaf resource copy. Those are concrete
packaging changes required before release. Verify dylib dependencies/rpaths,
Swift runtime availability, relocation and signing in the packaged app.
The currently supported host build is arm64 macOS 13.5+; do not infer Intel or
old-macOS support from upstream's wider deployment range.

## Evidence and remaining acceptance gates

The retained diagnostic fixture in `packages/lottie/tests/appkit-feasibility`
is owned by the Lottie leaf's future native integration. It is not a production
leaf or regression claim. Run from the repository root:

```sh
opensrc path airbnb/lottie-ios@4.6.1
pnpm exec node packages/lottie/tests/appkit-feasibility/run.mjs <returned-path>
```

It creates disposable inputs/artifacts in gitignored `research/`, compiles via
`buildMacOSNative`, and starts the real JSC host. It uses a small locally authored
solid-layer animation, no downloaded artwork, screenshots or visible window. It requires Xcode/
compatible metadata-generator libclang and the repository's bundled CLI host,
not a workspace dependency install. Use `--wmo` for the audited experimental
build path; the default deliberately retains the stock builder behavior.

The stock builder timed out at its 180-second command budget during the Swift
compile, before metadata generation or host execution. The optional `--wmo`
argument retries with a scratch copy of the builder using
`-whole-module-optimization` and a 600-second compiler budget. That compiled
the dylib but header validation then failed to resolve `NSView`, `NSControl`
and `CALayer`. The retry also prepends explicit AppKit/QuartzCore imports to
the generated Swift header. These are experimental deviations; the production
builder stays unchanged. Production adoption needs a scoped compiler strategy
and standalone generated-header imports, with maintained coverage.

**Runtime (`lab-experiment`): passed 19 assertions in the real arm64
JavaScriptCore/NativeScript AppKit host, exit 0.** The fixture verifies inline
JSON parsing, duration in milliseconds, actual `NSView`/`CALayer` exposure,
flipped coordinates, frame application, seeking, speed assignment, intermediate
playback progress, pause stability, finite completion and its Swift block
callback into JavaScript, looping without finite completion, stop/reset,
view removal/disposal and malformed JSON failure. The engine is explicitly
`.mainThread`; this does not verify the Core Animation rendering engine.

A detached host view failed the playback assertion. The passing fixture attaches
the engine to a real hidden `NSWindow`, without ordering it onscreen. It closes
that window after disposal and schedules host termination after assertions.
The CLI's five-argument host enters `NSApplication.run`; reaching the success
marker alone is insufficient if that process subsequently hangs. Both the
success marker and process exit 0 are required by the retained runner.

Still required before replacing the unsupported leaf: actual Octane mount,
prop updates, source replacement races, ref cleanup and repeated mount/disposal;
local file/URL/archive/resource cases; image/font assets; fit and live resize;
app background/window lifecycle; Core Animation mode; packaged relocation,
signing and notices. No visual analysis was authorized or performed. A
non-visual runtime pass cannot prove pixels or visual parity.

`pnpm probe doctor` reported missing workspace dependencies on this fresh
worktree. The supplied 30-assertion macOS smoke and maintained unsupported-Lottie
probe results are starting evidence, not reruns in this investigation.

## Parallel declaration repair boundary

No changes to public props, package exports, generated declarations, typegen or
packed-consumer checks are made here. Integration overlaps are precisely
`packages/lottie/package.json` macOS `types` conditions in workspace and publish
exports; the generated macOS declaration entry and its shared `props.ts` import;
macOS renderer ambient/intrinsic typing if a new host is chosen; and eventual
`LottieHandle.native` documentation. Consume the parallel repair's declaration
entry rather than independently rewriting it. A supported implementation will
need a macOS typecheck and packed consumer test after regeneration.

No public workflow or recipe changes are made; unsupported behavior and all
existing criteria remain intact. Future support must update the Lottie recipe,
user docs and maintained examples separately from runtime verification.

Checks: `pnpm check:recipes`, JavaScript syntax checks, note classification,
`build-llms.mjs` and `git diff --check` pass. The full docs Vite build was
attempted and blocked by the missing workspace `vite` package. No web, iOS or
Android runtime was run for this investigation.
