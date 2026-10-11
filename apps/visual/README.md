# Switch visual harness

This private contributor harness renders Switch stories in a light, opaque
96 × 64 stage at 1× scale through Octane, then compares captures against
committed baselines at zero pixel tolerance, antialiasing included. Two lanes
share the same stories and adapter:

- **Real web** captures actual Playwright pixels of the mounted stage.
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

Only web real capture is covered here. iOS, Android, macOS, Windows and
Linux remain unimplemented; there is no common-reference parity check or CI
gate, and the web baseline is not yet a nominated parity reference. No
public UI API or app-building recipe changes in this milestone.
