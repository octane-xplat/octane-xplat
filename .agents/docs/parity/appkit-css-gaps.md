# AppKit CSS + layout implementation gaps

Tracks issue #78 section 2 work on `feat/appkit-css-gaps` (worktree
`worktrees/octane-xplat/appkit-css-gaps`). Main state lives in
`appkit-progress.md`; this note logs only this branch's slices.

## Landed on this branch

### Layered CSS backgrounds (`a32a08649`) — source + unit evidence only

`background`/`background-image` + `background-repeat/-position/-size/-origin/-clip`
now paint on AppKit through a `bgHost` CALayer at view.layer sublayer 0
(below `borderLayer`, which now inserts at `bgHost ? 1 : 0`).

- New pure module `src/background-layers.ts`: `collectBackground` (ordered
  style bag → spec; `background` shorthand resets unmentioned slots, only the
  last layer's color becomes `styleBg`/backgroundColor), gradient parsing
  (linear/radial/conic + `repeating-*`, direction keywords, deg/turn/rad/grad,
  `at` centers, `circle|ellipse` + `closest-*/farthest-*` sizes, explicit
  lengths, double-position stops), per-layer repeat/position/size/origin/clip
  coordination, `positioningBox`/`resolveImageSize`/`tileRects`/`resolveStops`.
- New `src/css-text.ts` hosts `splitStyleTokens`/`splitTopLevelCommas`
  (moved out of index.ts; border + box-shadow parsing share it).
- Painter in index.ts: `syncBackgrounds` (spec collect, warn-once per node,
  `bgPainted` children reconciled by kind; first layer = top via zPosition),
  `paintBackgrounds` (frame re-sync via existing `observeBoxFrame` —
  added `node.bgHost != null` to `needsSync`; `syncBoxGeometry` now calls
  `paintBackgrounds`). `backgroundEdges` reads border widths via borderSpec +
  padding via computed style for origin/clip boxes.
- url() images: `requestImage` export added in `image.ts` (shared bounded
  decode requests); `renderBackgroundImage` composites tiles into an NSImage
  at `window.backingScaleFactor` via `lockFocusFlipped(true)` and sets
  `layer.contents` + `contentsScale`. Async delivery guarded by
  `node.bgGeneration`. Re-render only when clip size/scale changes.
- Gradient paint (`paintGradientLayer`): child layer covers the clip box;
  start/end points computed in the ORIGIN box's unit space so origin != clip
  still resolves correctly. Radial: startPoint=center, endPoint=center+radii
  (radius-vector model — unverified against real CAGradientLayer; check on
  skymac). Conic: startPoint=center, endPoint=center+from-angle vector —
  sweep start/direction unverified.
- Coordinates: all geometry in CSS top-left; layer frames convert via
  `flipped ? y : h - y - h`. Per-layer mask only when clip != border-box
  (view's own cornerRadius/mask covers border-box).
- Destroy path calls `clearBackgrounds` (releases url subscriptions).
- Old `syncBackgroundImage`/`gradientLayer`/`gradientObserver` deleted
  (alpha hard cutover).
- Explicitly unsupported (warn-once): `background-attachment`,
  `background-blend-mode`, `background-clip: text`, `image-set`, unknown
  terms. Matches GTK's longhand surface (GTK also lacks http urls — AppKit
  accepts http(s) through imageBytes, a superset).
- Tests: `test/background-layers.test.ts` (11 pure cases),
  `test/background-image.test.ts` (4 slice cases). All pass locally.
- NOT yet done: probe fixture, README/styling.md doc updates, runtime
  qualification (layer order under real CALayer, radial/conic endpoint
  semantics, pattern composite orientation for flipped views, scale,
  sublayer-vs-subview ordering).

## Next (demand order)

1. Non-solid outlines: rewrite `syncOutline` — dashed/dotted via CAShapeLayer
   stroke of `borderStrokeCGPath` on the expanded box (W=w+2*(offset+width),
   radii=scaled+offset+width); double/groove/ridge/inset/outset via per-side
   `borderBandPoints`/`borderBands` trapezoids on that box + host mask =
   roundedBox(outer radii). Solid/auto keeps the CALayer.border fast path.
2. Full box-shadow: `parseBoxShadow` already parses lists. Plan: outset
   shadows become sibling `node.outsetShadowHosts` CALayers inserted below
   `view.layer` in `view.layer.superlayer` (force `superview.wantsLayer=true`
   when needed) so masksToBounds corner clipping can coexist (drop the
   `outsetShadow` clip-disable once siblings work; keep it only as
   no-superlayer fallback). Inset shadows: `node.insetShadowHost` container
   sublayer above bgHost/below border, mask = inner rounded box (padding
   box), per-shadow CAShapeLayer with even-odd ring (huge outer rect +
   inner hole inset by spread) + own shadowColor/Offset/Radius/Opacity —
   real inset blur.
3. Per-window @media: keep `setStyleEnvironment` but make injected fn read a
   module-level `activeMediaNode` set inside `restyleNode` around
   `computeCascade` (covers attachKeyframes too). `envForNode` walks to the
   root: portalroot → `root.view.window`; else `container.hostView.window`;
   size = `window?.contentLayoutRect ?? hostView.frame ?? largest-window`.
   Add css-engine export `stylesheetMediaQueries(): string[]` (GTK-safe,
   additive). Renderer tracks `container.mediaEnvs: Map<NSWindow, env>`;
   resize → per-window diff via evalMediaQuery on each gated query, restyle
   only containers whose results moved (first-seen window: seed, no restyle
   — nodes were styled with that env at mount). Replace `refreshMediaQueries`
   usage on macOS; GTK keeps it. Rewrite the resize-observer test in
   css-machinery.test.ts (it mocks refreshMediaQueries).
4. Audit remaining style/layout props vs the shared normalization contract
   (React.CSSProperties vocabulary on web, NS props on mobile, GTK CSS_PROPS)
   — file precise gaps here.
5. Probe fixture(s): extend or add `examples/probes/*` — backgrounds probe
   cycling image/gradient layers + repeat modes; outlines + box-shadow
   variants; per-window @media needs a second window (sheet/layer?).
6. Docs: renderer README "Current limits" bullets + `docs/app/styling.md`
   AppKit sections for each landed feature; `.changelog/` entries.
7. Runtime verification: `ssh skymac.local` (Intel; check `df -h` first —
   was ~895MB free once). Local acceptable; record host per result. Native
   builds via `goddard-agent resource run --json
   '{"resources":{"native_builds":1},"purpose":"..."}' -- COMMAND`.

## Constraints / don't touch

- No visual analysis/screenshots. No subagents.
- Other tasks own: Windows CLI/UI manifest/CommandPalette, GTK leaves,
  tsrx-typegen/leaf plumbing, macos-renderer test debt (17 pre-existing
  vm-slice realm failures), input/scroll/media qualification, services.
- Silo shared — never remove other worktrees' rows.
- vm-slice realm: avoid `deepStrictEqual` on slice-produced objects.
- Evidence-gated: source/unit vs runtime stays distinct in reports.
