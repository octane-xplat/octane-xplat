# iOS animation quality

Use the isolated mobile benchmark to compare presentation hitches on the same
physical iPhone across revisions. Eight small scenarios cover delegated tween,
JS spring, real drag/release, six reversals spaced 80 ms apart, layout resize,
shared-element handoff, native sheet presentation/dismissal, and animation while
scrolling. Only the scrolling scenario mounts a scroll container; only the sheet scenario
mounts the native sheet host. The ordinary app, development tracing and parity
sweeps are excluded.
No browser or device performance task belongs in lightweight PR CI.

## Build and exercise

1. From the repository root, build the isolated Release app. The command reserves
   native build capacity and does not launch, create or erase any device. It
   prepares a minimal isolated NativeScript host under ignored `research/probes/`,
   using the existing probe dependency resolver with Motion’s dependency anchor.
   Gesture-handler is deduplicated to Motion’s declared peer for both JS and native
   code. Unrelated mobile app plugins and its generated Xcode project are excluded.
   For a physical device, replace `simulator` with `physical` and supply its authorized
   UDID; signing must already be configured. Keep device IDs out of committed data.

   ```sh
   bun run turbo run bench:animation:ios --filter=@xplat/mobile -- simulator 91D40099-A056-497D-A572-ADDDFD6A8F23
   ```

2. Install the resulting `org.octanexplat.animationquality` app from the
   printed host directory’s `platforms/ios/build/Release-iphoneos/*.xcarchive/Products/Applications/`
   under a separate device reservation. For simulator functional checks use only the UDID above,
   with `exclusive:["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"]` and
   `resident_devices:1`. For authorized hardware use `exclusive:["device:<id>"]`.
   Never use simulator numbers as presentation evidence. Shut down devices you
   booted before releasing their reservation; leave pre-existing devices alone.

3. Launch without a debugger. Choose a scenario, tap Start, exercise its input,
   then Finish. Drag the blue card and release it for drag; swipe the scrolling
   region for scroll; close or swipe-dismiss the native sheet for sheet. Reverse
   allows manual interruption too. Dispose removes the card mid-run. A bounded
   JSON diagnostic is logged on Finish and saved to the app's
   `Documents/animation-quality-results.json`, after the measured interval.
   It records read-only maximum refresh capability, power mode, thermal state
   and Reduce Motion. It contains no screenshot or user data. Drag exclusively
   owns its x axis (do not also assign `animate.x`); every selected trial resets
   the card so repeated drags start inside the full-width input region.

4. Record with Apple's Animation Hitches instrument. Add Time Profiler for a
   separate diagnostic recording: correlate `Scenario` with main-thread JS,
   NativeScript bridge calls, `layoutIfNeeded`, Mason layout, and Core Animation
   commit/render activity. Toggle diagnostic spans only for that recording.
   `JSFrame` spans and callback costs measure callback work including synchronous
   bridge calls; they exclude layout in later microtasks and are **not** hitches.
   Use native stacks to separate layout and bridge costs; do not subtract sampled
   profiler times as if they were exact non-overlapping measurements.

5. For repeatable real input, generate a standalone UI-test project with the
   existing CocoaPods `xcodeproj` Ruby gem. Choose a fresh scratch directory:

   ```sh
   ruby tools/verification/animation-quality/prepare-xctest.rb ~/agent-scratch/octane-xplat/animation-quality/xctest-project
   ```

   The test launches the installed benchmark bundle ID. The generator selects
   Release, disables the debugger and coverage, and sets Xcode’s automatic screen
   capture setting to `systemAttachmentLifetime="keepNever"` (the same mapping as
   XcodeGen’s `captureScreenshotsAutomatically=false`). Verify the generated
   `.xctestrun` target has `SystemAttachmentLifetime=keepNever` before execution.
   Disable performance diagnostics with `-enablePerformanceTestsDiagnostics NO`;
   disable verbose failure diagnostics with `-collect-test-diagnostics never`.
   deleting image attachments afterwards is not an alternative. Run with
   `-destination 'platform=iOS,id=<authorized-id>' -parallel-testing-enabled NO
   -maximum-concurrent-test-simulator-destinations 1`. This repository supplies
   a generated UI-test project, not signing credentials. Run from a device
   reservation. The test source never requests screenshots.

6. After building the test project with `xcodebuild build-for-testing`, run the
   physical suite through the maintained recorder. Supply the generated
   `.xctestrun`, archived app and a new local evidence directory:

   ```sh
   node tools/verification/animation-quality/run.mjs AUTHORIZED_PHYSICAL_UDID \
     /absolute/path/AnimationQuality_iphoneos.xctestrun \
     /absolute/path/benchmark.xcarchive/Products/Applications/benchmark.app \
     ~/dev/reports/octane-xplat/animation-quality/new-run
   ```

   The runner reserves that device, verifies both automatic-attachment policies,
   installs only the benchmark bundle, launches measured runs through Instruments,
   and runs serial XCTest trials without performance diagnostics. The tests use
   `activate()` to preserve the profiled process. It records Animation Hitches
   plus the benchmark's signpost subsystem, exports nonvisual XML tables and
   copies the app's bounded result journal. Each test gets its own trace and
   xcresult. A final optional argument selects one test, such as `Drag` or
   `Sheet`. `DiagnosticCosts` instead records Time Profiler while exercising
   spring, layout and retarget with diagnostic spans enabled; those results
   cannot seed a presentation baseline. Callback costs include the span bridge
   overhead, and sampled stacks are statistical rather than exact cost totals.
   Test success alone never marks a baseline qualified. The runner
   records the app executable hash and its own source identity; retain the
   build log/source identity separately when building from uncommitted changes.

   Instruments recordings use six explicit playback trials without a concurrent
   `XCTOSSignpostMetric` collector. Functional-only runs use the XCTest metrics.
   Keep these collectors separate: their simultaneous use produced incomplete
   scenario windows on the physical proving device even though XCTest passed.

   Add `--functional` to run the same real-input suite without Instruments. This
   is the faster fixture/lifecycle check, and produces no presentation evidence.
   Run it before spending time on traces. The sheet check retains one owner for
   all six presentations, then selects another scenario; the recorder requires
   one cache entry while mounted and zero after teardown. Disposal/resume also
   requires no Motion callback deliveries during a ten-second idle window.

   Analyze exported scenario windows without opening Instruments or images:

   ```sh
   python3 tools/verification/animation-quality/summarize.py /absolute/run/Tween tween > /absolute/run/Tween.summary.json
   ```

   Python 3's standard library resolves xctrace XML references and duplicate
   signpost tables. The summary scopes hitches to the target process and active
   windows, preserves whole-stall severity at window boundaries, and flags
   missing/unclosed intervals. It reports displayed-surface changes separately
   and leaves frame count unavailable. It cannot qualify a baseline by itself.

For input failures only, build with `XPLAT_ANIMATION_INPUT_DEBUG=1` before the
build command. This enables a bounded, app-owned text journal of input, hit-test
ancestry, native sheet attachment and recognizer state, and errors at
`Documents/animation-input-diagnostic.json`. It writes
during interaction and invalidates performance results. Rebuild without that
variable for measurement; the default has no input journal writes.

The Swift bridge uses `beginAnimationInterval`, requesting Apple's animation
metrics through the custom `XCTOSSignpostMetric`. A `ScenarioName` signpost event
identifies each following interval in Instruments.
Tween/spring/retarget/layout/shared intervals end on completion;
sheet ends on dismissal; scrolling and drag retain the explicit interaction
window through Finish. Keep the latter windows identical between revisions.
Confirm intervals exist in the recording: missing metrics are unavailable,
never zero hitches. Zero or missing presentation frame counts also invalidate
telemetry, even when a frame-rate value is reported. The mobile host enables the ProMotion Info.plist opt-in;
this permits higher rates but does not force 120 Hz.

## Baselines and acceptance

Warm up each scenario once, then collect five measured iterations. Record model,
OS build, maximum refresh capability and refresh policy, power mode, thermal
state, source revision, Xcode version and trace location. Keep power/refresh and
Reduce Motion settings unchanged unless the user authorized changing them.
Allow the phone to cool between runs. Keep traces, xcresults and JSON under
`~/dev/reports/octane-xplat/animation-quality/`, never in Git. Use Silo experiments
for execution status. Baselines are per device/OS/refresh/power/thermal identity;
a new OS or device needs a new baseline, not a comparison against another phone.
There are no seeded device baselines. Raw measurements qualify only after all
required telemetry and interaction checks are valid.

Transcribe/export Apple's positive presentation frame count, active interval duration, total hitch time and longest
individual hitch from the retained trace into schema 1 below. XCTest aggregates
alone do not establish the worst individual hitch; inspect the nonvisual trace
hitch-event data. Preserve the complete five rows for each of the eight scenarios.

```json
{
  "schema": 1,
  "evidence": "physical",
  "device": "local-device-key",
  "os": "exact OS build",
  "refreshMode": "adaptive; maximum 120 Hz",
  "powerMode": "normal",
  "thermalState": "nominal",
  "buildMode": "release",
  "diagnostic": false,
  "revision": "source commit",
  "trace": "local trace path",
  "results": [
    {
      "scenario": "tween",
      "durationSeconds": 0.8,
      "frameCount": 64,
      "hitchMs": 0,
      "worstHitchMs": 0
    }
  ]
}
```

This abbreviated shape is illustrative; comparison rejects incomplete suites.
The comparator requires every iteration under 5 ms/s and no individual hitch
over 50 ms. These are an initial project gate, not a claim that a 49 ms stall is
invisible. Investigate every hitch over 25 ms. Against a matching baseline,
aggregate ratio may rise by at most max(1 ms/s, 20%) and worst hitch by 8.34 ms.
These regression tolerances are project policy; Apple's guidance is under
5 ms/s for good experience. Preserve failed iterations; do not average them away.

```sh
node tools/verification/animation-quality/compare.mjs run.json baseline.json
```

Also require: no post-disposal writes, exactly-once cancellation, continuous
position at interruption (within 1 DIP at the same timestamp; velocity samples
must use actual elapsed time), no callback loop during a 10-second idle window,
and successful background/foreground without retained disposed work. Check
Reduce Motion live notification and transform settlement while running only
when a human has authorized that settings change. XCTest's disposal/resume test
checks card absence, not internal native writes or live preference changes.
The idle test checks Motion callback delivery, not native display-link wakeups
or energy use. The logged presentation samples aid retarget diagnosis but do not themselves
prove continuous position/velocity across the handoff. Qualify these contracts
separately; a hitch pass cannot compensate for a lifecycle failure.

## Scheduler conclusions and sources

See [Motion compatibility](../../../packages/motion/UPSTREAM.md#ios-scheduling-and-quality)
for the canonical scheduler audit and evidence boundaries.
Apple documents [animation hitch testing](https://developer.apple.com/videos/play/wwdc2020/10077/)
and [ProMotion configuration](https://developer.apple.com/documentation/quartzcore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays).
