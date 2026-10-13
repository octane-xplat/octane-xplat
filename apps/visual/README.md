# Switch visual harness

This private contributor harness renders Switch stories in a light, opaque
96 × 64 stage at 1× scale through Octane, then compares captures against
committed baselines at zero pixel tolerance, antialiasing included. Capture lanes
share the same stories and adapter:

- **Real web** captures actual Playwright pixels of the mounted stage.
- **iOS** has an implemented UIKit stage driver using the NativeScript test
  mount boundary. Real simulator capture and native Storybook readiness are
  qualified for the current mobile harness. Exact web/iOS parity is failing.
- **Mock** feeds a fixed checker PNG through the same comparison path. The
  mock PNG is not captured from the Switch and proves no Switch pixels or
  platform parity.

## Run the checks

From the repository root, install the workspace and Chromium once:

```sh
pnpm install --frozen-lockfile
pnpm --filter @xplat/visual exec playwright install chromium
```

Run the ordinary comparisons or the acceptance checks:

```sh
pnpm --filter @xplat/visual test:web
pnpm --filter @xplat/visual verify:web
pnpm --filter @xplat/visual test:mock
pnpm --filter @xplat/visual verify:mock
```

The real-web acceptance command runs three fresh Browser Mode launches —
each must pass the zero-tolerance regression against the committed baseline,
proving identical decoded captures across launches. It then requires a
failing run with a controlled visual change (the story mounted with
`checked: true`), and a failing run reporting a missing baseline that wrote
nothing. Its own exit status is zero only when all five outcomes occur.

The committed baselines are:

```text
vis/web/__baselines__/switch/unchecked-light-switch-real-web-capture-real.png   (real)
vis/web/__baselines__/mock-workflow/unchecked-light-switch-mock-workflow-mock.png (mock)
```

Current and diff PNGs go under the ignored `__results__` and `__diffs__`
directories. Ordinary runs reject missing baselines. Explicitly regenerate a
baseline only when intentionally changing what it approves:

```sh
pnpm --filter @xplat/visual update:web
pnpm --filter @xplat/visual update:mock
```

These commands update only this private harness's selected tests. Review the
baseline change before committing it. Never promote the mock fixture into a
real Switch baseline or a common parity reference.

## Capture contract

The deterministic profile `switch-light-96x64@1` fixes a 640 × 420 logical
iframe viewport in an 800 × 600, 1× device-scale, light-appearance,
reduced-motion Chromium context with `en-US` locale and UTC timezone. The
stage pins itself to the iframe's top-left corner so the Playwright clip is
an integer 96 × 64 region. A Vitest Browser Mode iframe below its configured
viewport is CSS-scaled for display; the extra window margin keeps that scale
at 1 so captured pixels are unscaled.

Readiness is bounded, never a fixed sleep: the driver requires the stage to
carry the selected `data-story-id`, the `[role="switch"]` control to report
the requested `aria-checked`, `document.fonts` to settle, and two consecutive
animation frames with an identical 96 × 64 rect at the origin — plus a
matching `devicePixelRatio` — all inside a two-second deadline. A capture
that misses the declared geometry or decodes to a single color is an
infrastructure failure, never a matcher pass. `ariaLabel` is text-free; both
platform leaves draw track/thumb without fonts.

## Boundaries and next milestone

Storybook 10.6.1 shared composition owns the story args; the thin web adapter
mounts, updates and disposes the renderable through the Octane
compiler/runtime. Args updates (`checked` true then false) and switching to
`CheckedLight` and back are verified identical by decoded-pixel
comparison, not just handler state. The public UI root import selects the web
leaf. Static stage styles disable motion and request light appearance.

Vitest 4.1.11, its browser packages and vitest-plugin-vis 5.1.7 are pinned
here, separately from root/web Vitest 5. The plugin uses its manual public
matcher with raw PNG base64, zero pixel tolerance and antialias differences
included. The local Vite dependency optimization explicitly includes the
plugin's CommonJS `ssim.js` dependency so its manual preset can load in
Browser Mode.

## Qualify iOS and common-reference parity

Milestone 3 remains incomplete because the unchanged real iOS capture differs
from the real web common reference by **296 pixels**. Both decoded images are
96 × 64, opaque, and have the same nonwhite bounds: x=24…71, y=18…45 (48 × 28).
The largest channel difference is 6. This points toward rounded-edge
rasterization/antialiasing; the precise renderer cause is not established.
There is no tolerance, mask, alignment, or baseline exception.

Real iOS composition/mounting, bounded readiness, three identical independent
mounts, and separate regression checks passed on iPhone Air / iOS 27.0 using
the current mobile harness runtime. An iOS regression candidate and a separate
real web common reference are committed for review. The iOS baseline records
its current appearance; it does not approve the parity difference. Android,
macOS, Windows and Linux capture drivers and CI gates remain outside this
milestone, and the six-target suite remains incomplete.

Use an authorized simulator after host capacity becomes available. The driver
reserves a native build slot, the simulator's exclusive key, and one resident
slot through `goddard-agent resource run`. It boots a shutdown device and shuts
it down afterward; an already booted, authorized device requires the explicit
`--use-booted` flag. The test app uses `org.nativescript.xplat.visual`, preserving
the ordinary harness app. The driver temporarily updates only the app target
in the generated Xcode project, builds the isolated ID, and restores the
original project during cleanup. This handles NativeScript reusing a project
materialized under the ordinary bundle ID. The isolated visual entry does not
enter ordinary mobile tests or Android discovery.

```sh
pnpm --filter @xplat/visual capture:ios --device=SIMULATOR_UDID --capture-only
```

The command exports three independently mounted unchanged iOS stages, one
rendered iOS displacement, and unchanged/displaced web stages under a fresh
`artifacts/RUN_ID/` directory. It checks native stability and requires the
opaque-pixel and rendered-displacement diagnostics to report divergence with
exit status 1. `--capture-only` reports **captured-only**, never regression or
parity success. Run directories cannot be reused.

The native stage is 96 × 64 logical points inside a full-size neutral host,
away from the page edges; safe-area expansion is disabled. This prevents the
root stage being expanded or shortened by iOS safe-area insets. UIKit captures
its actual mounted view hierarchy into an opaque 96 × 64 PNG with an explicit 1× destination;
there is no post-capture resize or alignment. Readiness checks the selected
story, mounted window, control presence, and stable native geometry across
frames. The native screen scale and OS are recorded separately. Native bounds
and decoded PNG dimensions are checked exactly before comparison. The profile is compatible, but its real pixels differ from web.

Both capture drivers also require exact component geometry before taking pixels:
the track is 48 × 28 at (24, 18), and the unchecked thumb is 22 × 22 at
(27, 21), relative to the stage. The checked thumb starts at (47, 21).
The rendered displacement diagnostic shifts both component positions by exactly
one pixel while leaving the stage fixed. Fractional geometry, a shifted stage,
or a resized control fails capture; the driver never rounds or aligns it.
The shared geometry checks run with the comparator tests:

```sh
pnpm --filter @xplat/visual test:comparator
```

### Shared-raster research is not M3 acceptance

The recovered Iris probe (task `14fc6c14-0135-41c3-b89f-9c7bfb4008b6`)
demonstrates lossless bitmap display: four same-source web/iOS pairs have zero
decoded differences. Its web composite displayed on iOS also matches the
unchanged common reference exactly, with nonwhite bounds x=24…71, y=18…45.
These are historical research captures, not a fresh production qualification.

The exact composite is an opaque 48 × 28 screenshot with white corners. The
diagnostic test installs it into the native track layer, hides the thumb, and
captures through an explicit sRGB CALayer bitmap path. The ordinary component
and UIKit hierarchy capture were restored afterward; their historical unchanged
captures still differ by 296 pixels. The probe also excluded Swift sources to
build. Those exclusions are not an accepted build configuration.

A normal-build recapture on October 12, 2026 used the restored sources and
passed the exact geometry checks, three independent native mounts, iOS
regression, and both rendered displacement diagnostics. Numerical comparison
still reports web 0 / iOS 296 differing pixels against the unchanged reference.
The ordinary parity command separately rejects the common reference's stale
scenario hash before comparing pixels. Neither result qualifies M3; no
reference metadata or baseline pixels were promoted.

Do not embed that stage-backed screenshot as a Switch fix: it carries the white
background and does not establish checked, theme, style, or lifecycle behavior.
A production rendering solution must retain those behaviors and pass the normal
capture commands, separate regressions, common-reference parity, repeatability,
and both one-pixel diagnostics. M3 and the four remaining platform lanes stay
unqualified until those gates pass.

### Baseline candidates and ordinary checks

Generate reviewable candidates only from a valid unchanged capture. Replace
`RUN_ID` with the directory printed by the capture command:

```sh
VIS_IOS_CAPTURE="$PWD/apps/visual/artifacts/RUN_ID/ios-0.json" pnpm --filter @xplat/visual update:ios
VIS_CAPTURE_DIR="$PWD/apps/visual/artifacts/RUN_ID" pnpm --filter @xplat/visual promote:common
```

`update:ios` generates the regression candidate under `vis/ios/`. Common
promotion separately nominates the real web capture under `vis/common/switch/`.
Both reject stale source identity, mock captures, wrong stories, incompatible
profiles, and displaced captures. Review and commit candidates explicitly;
target baseline updates never approve parity differences.

Once candidates are approved, run the full ordinary check:

```sh
pnpm --filter @xplat/visual capture:ios --device=SIMULATOR_UDID
VIS_CAPTURE_DIR="$PWD/apps/visual/artifacts/RUN_ID" pnpm --filter @xplat/visual test:parity
```

The ordinary run checks each iOS capture through vitest-plugin-vis in its own
namespace, checks web regression, then separately compares both current real
captures against the common reference. Missing captures/baselines/reference,
stale metadata, incompatible dimensions, and divergent decoded pixels fail
with nonzero status. No ordinary command updates baselines. Reports and diff
PNGs remain in the run directory, including on failure; exact parity uses zero
allowed differences in every decoded channel, including antialiasing.

Web capture and comparator qualification can run while iOS is unavailable:

```sh
pnpm --filter @xplat/visual capture:ios --web-only
pnpm --filter @xplat/visual test:comparator
```

The private iOS build uses Babel's Unicode-property regex transform because
the current harness runtime rejected the lexer bundled with Storybook before
startup. It preserves constant-constructor and literal matching without
patching runtime globals. The normal mobile test lane does not use this
transform. Its focused check is:

```sh
node --test apps/mobile/visual-regex.test.mjs
```

Capture metadata records the base Git revision, whether the source tree was
dirty, the scenario/content digest, runtime and pinned toolchain versions,
profile, dimensions, and immutable run identity. A capture from a working tree
is labelled accordingly. Reports name the web/iOS qualification scope and
remaining four product targets; a two-target result never completes the suite.

The web-only capture reports partial capture evidence. Comparator tests use
unit fixtures derived from the existing web PNG and establish no native pixels.
Real diagnostics detected exactly one changed opaque pixel, 248 differing
pixels from a rendered web displacement, and 332 from a rendered iOS
displacement. Each identified its target and exited 1. These results do not
establish web/iOS parity or Milestone 4
readiness. No public UI API or app-building recipe changes are involved.
