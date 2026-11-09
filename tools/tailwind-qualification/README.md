# Tailwind integration qualification

This private tool compares the official Tailwind compiler with NativeScript's
released CSS adapter and checks Xplat's integration in disposable consumers.
Dependency versions are pinned in the workspace manifests.

Run from the repository root with Bun 1.4.4:

```sh
bun install --frozen-lockfile
bun run turbo run test typecheck --filter=@xplat/tailwind-qualification
bun run turbo run prepare:browser --filter=@xplat/tailwind-qualification
bun run turbo run qualify --filter=@xplat/tailwind-qualification -- --output "$HOME/dev/reports/octane-xplat/tailwind-feasibility"
```

The Xplat integration has a separate packed-consumer check, implemented here
and owned by the leaf package's task. It packs Tailwind, build tooling and the
shared build library, then installs those tarballs with isolated dependencies
outside the repository. It checks exported files, JavaScript execution,
NodeNext/Bundler declarations, web/iOS/Linux-webview CSS compilation in development
and production, development maps, platform-file selection, and browser SSR inline CSS:

```sh
bun run turbo run test:packed --filter=@octane-xplat/tailwind
```

This check uses real Vite builds and development servers without a browser or
device. Its JSON output reports production CSS-map availability separately;
a passing package check does not qualify production maps, native runtime
behavior, Mason layout, input or painting. Failed disposable consumers remain
under `~/agent-scratch/octane-xplat/tailwind-consumer-*` for inspection; successful
runs remove their temporary installation.

Measure dependency and compilation costs in an isolated consumer with a new
output directory. This also runs the normal packed-consumer verification:

```sh
bun run turbo run measure:cost --filter=@xplat/tailwind-qualification -- --output "$HOME/dev/reports/octane-xplat/tailwind-cost/my-run"
```

`cost.json` records installed package versions and dependency inventories, three
fresh-process Vite build samples per pipeline, development startup and one
source edit. It compares the official PostCSS compiler and Xplat on web, and
the official compiler plus NativeScript's adapter against Xplat on iOS-target
CSS. All use the same pixel theme and source corpus without Preflight. The
upstream composition only connects the existing plugins; it does not repair
their behavior. Rule inventories and retention of a removed candidate are
reported alongside timings, so a fast transformation cannot hide missing rules.
Retaining an unused rule is normal for Tailwind's incremental compiler; this
field matters here because a removed unsupported candidate must also stop
failing Xplat's native diagnostics. It is not evidence of a browser class-removal
bug or of native style removal.

Dependency sizes count logical unpacked files in the selected roots' installed
dependency closure. Traversal skips those packages' dev dependencies and peer
edges, including the app's existing Vite installation. These are build-tool
costs, not runtime app or native bundle sizes. They are not compressed downloads
or deduplicated disk use. Build timings distinguish compilation from whole-process time;
filesystem caches and shared-host load remain uncontrolled. Edit timings include
20ms polling resolution. Treat these as measurements, not performance budgets
or native qualification. This task installs no browser and runs no native app.

The separate Xplat browser gate installs those same fresh tarballs, preserves
their production CSS, and checks it in Chromium. It measures flex/grid layout,
absolute edges, runtime and scoped theme colors, text/radius values, per-element
variable defaults, nested transforms, responsive/dark variants, class removal,
inline precedence and synthesized browser hover. Choose a new output directory
for each run; existing evidence files are never overwritten:

```sh
bun run turbo run prepare:browser --filter=@xplat/tailwind-qualification
bun run turbo run qualify:xplat --filter=@xplat/tailwind-qualification -- --output "$HOME/dev/reports/octane-xplat/tailwind-browser/my-run"
```

This writes `compiled-web.css`, `compiled-ios.css`, `compiled-linux.css`,
`consumer.json` and `browser.json`. The browser uses the web and Linux-webview
CSS; the iOS file remains compilation evidence. The command fails on a missing
browser, invalid fixture, failed package check or computed-style/layout mismatch.
It captures no images. Chromium results establish no Linux webview session,
NativeScript/Mason runtime, OS input or painting parity. Keep this opt-in task
outside PR checks alongside the upstream comparison command.

Each browser observation identifies generated CSS or a hand-authored reference
case. The reference cases establish variable fallback and invalidation behavior
for comparison with the desktop engine's Node regressions; they are not extra
Tailwind features or native runtime results.

The qualification command writes the official/generated stylesheet, the adapted
stylesheet, and `comparison.json` to the specified local directory. It exits 1
when the browser comparison finds semantic differences. Treat that as a failed
adoption gate, even if the tool's own tests pass. A missing browser or an invalid
baseline also fails the command. It never captures images.

The browser cases compare CSS semantics before and after transformation in
fresh documents; they do not run NativeScript. The native-engine observations
execute the desktop cascade in Node without AppKit or GTK. They establish no
native painting, layout, accessibility, input or mobile-runtime support.
Timing fields measure a single compiler/adaptation invocation, not Vite build,
HMR or end-to-end startup performance. CSS byte counts are not dependency sizes.

Ordinary `test` and `typecheck` tasks do not launch or install a browser. Keep
`prepare:browser` and `qualify` local, outside the PR gate. The unit tests verify
that the corpus is generated and the older adapter fixes remain present; they
are not an adoption verdict. Use the generated comparison to inspect losses,
including missing complete rules, before making a support claim.

Read the canonical [styling constraints](../../.agents/docs/notes/styling-notes.md#original-shared-pipeline)
for the ownership decision and native prerequisites. Keep run evidence and
qualification status in local reports and Silo, not in this directory.
