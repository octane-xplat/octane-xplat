# Switch mock visual workflow

This private contributor harness renders one unchecked Switch in a light,
opaque 96 × 64 stage, then compares a fixed **mock checker PNG**. It qualifies
story selection, Octane mounting, snapshot comparison and cleanup. The PNG is
not captured from the Switch and proves no Switch pixels or platform parity.

## Run the checks

From the repository root, install the workspace and Chromium once:

```sh
pnpm install --frozen-lockfile
pnpm --filter @xplat/visual exec playwright install chromium
```

Run the ordinary comparison or all milestone 1 acceptance checks:

```sh
pnpm --filter @xplat/visual test:mock
pnpm --filter @xplat/visual verify:mock
```

The ordinary run passes three tests. The acceptance command first passes the
unchanged fixture, then requires a failing run reporting exactly one changed
pixel, then requires a failing run reporting a missing baseline. Its own exit
status is zero only when all three outcomes occur. It also checks that the
missing-baseline run wrote no baseline and removes its owned temporary folder.
Each Browser Mode run owns and closes its headless browser. Tests dispose their
Octane roots on comparison failure and injected fixture-load failure, preserve
an unrelated DOM node, and reject an unknown story before allocating a host.

The committed workflow baseline is:

```text
vis/web/__baselines__/mock-workflow/unchecked-light-switch-mock-workflow-mock.png
```

Current and diff PNGs go under the ignored `__results__` and `__diffs__`
directories. Ordinary runs reject missing baselines. Explicitly regenerate the
mock workflow fixture only when intentionally changing that fixture:

```sh
pnpm --filter @xplat/visual update:mock
```

This command updates only this private harness's selected tests. Review the
baseline change before committing it. Never promote this mock into a real
Switch baseline or a common parity reference.

## Boundaries and next milestone

Storybook 10.6.1 shared composition owns the story args; the thin web adapter
mounts its renderable through the Octane compiler/runtime. The public UI root
import selects the web leaf. Static stage styles disable motion and request
light appearance. Readiness checks the selected identity and unchecked state;
it does not yet qualify assets, stable layout, or real capture geometry.

Vitest 4.1.11, its browser packages and vitest-plugin-vis 5.1.7 are pinned here,
separately from root/web Vitest 5. The plugin uses its manual public matcher
with raw PNG base64, zero pixel tolerance and antialias differences included.
The local Vite dependency optimization explicitly includes the plugin's
CommonJS `ssim.js` dependency so its manual preset can load in Browser Mode.
Playwright is only the Browser Mode execution provider; there is no screenshot
capture driver.

Milestone 2 must replace fixture bytes with real web stage capture and qualify
fresh-launch determinism, geometry, readiness and story switching. Only web
mock execution is covered here. iOS, Android, macOS, Windows and Linux remain
unimplemented; there is no real capture, common-reference parity or CI gate.
No public UI API or app-building recipe changes in this milestone.
