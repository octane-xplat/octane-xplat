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

### Non-solid outlines (`c2269ee35` + `66df2276f` test) — source + unit evidence

`outline`/`outline-*` keeps the solid CALayer fast path; dashed/dotted stroke
the centered rounded path via CAShapeLayer (`borderStrokeCGPath` on the
expanded box, radii = scaled + offset + width); double/groove/ridge/inset/
outset paint per-side shaded bands (`borderBands`/`borderBandPoints`) on the
expanded box under an outer rounded mask. `none`/`hidden` clear; `auto` maps
to solid; unknown styles warn once and paint solid. Resize repaints through
the existing frame observer. Runtime qualification pending (band geometry at
nonzero offsets, rounded outline corners).

### Full box-shadow (`b1661b376`) — source + unit evidence

`parseBoxShadow` already parsed lists; the painter now uses all entries.
- Outset: sibling `node.outsetShadowHosts` CALayers inserted below view.layer
  (`insertSublayerBelow`; superview forced `wantsLayer` when needed) so
  masksToBounds/per-corner masks stay on. `outsetShadowOnSelf` gates the old
  no-clip behavior to the no-superview/superlayer fallback only.
- Inset: `node.insetShadowHost` container sublayer between bgHost and
  borderLayer; per-shadow CAShapeLayer "wall" = even-odd path (huge rect minus
  hole = box inset by spread, radii - spread) carrying its own
  shadowColor/Offset/Radius, `masksToBounds` clips to the interior — real
  blur. Positive spread paints the solid inner ring (hard core) correctly.
- First-CSS-on-top ordering: outset hosts below view.layer in order; inset
  children zPosition descending.
- Tests: `test/box-shadow.test.ts` (4 cases, all pass; avoids the cross-realm
  deepStrictEqual trap). Runtime qualification pending (does an empty sibling
  layer's shadowPath render? wall/hole semantics on real CA).

### Per-window @media (`3585363f0`) — source + unit evidence

`restyleNode` pins `activeMediaNode` through each `computeCascade`; the
injected environment resolves `envForNode` — the node's own window
(portal roots use their target view's window; windowless nodes fall back
to host frame then largest window). `container.mediaEnvs` records the
last size per window (host + portal targets); a resize diffs every
registered media query under old/new env via new css-engine export
`stylesheetMediaQueries()` and restyles only changed containers.
Windowless notifications (accessibility display) restyle media-gated
containers unconditionally. GTK keeps `refreshMediaQueries`.
Tests: rewritten resize-observer case + `envForNode` portal/direct cases
in css-machinery.test.ts (19 pass). Runtime qualification pending (real
second window, resize coalescing under load).

### Style/layout prop audit (contract: GTK CSS_PROPS + NS vocabulary + style-merge normalization)

Legend: ✓ handled · ~ partial · ✗ absent (grep-verified, warn-path).

**Painted — covered by this branch or already worked:** background/Color/
Image/Repeat/Position/Size/Origin/Clip ✓ (Attachment/BlendMode/clip:text
warn) · borderWidth/Style/Color/Radius per-side + decorative ✓ ·
outline + longhands incl. non-solid ✓ · boxShadow multi/inset ✓ ·
opacity ✓ · visibility ✓ · filter ✓ · zIndex ✓ (layer.zPosition) ·
color/font props ✓ (Family/Size/Style/Weight/letterSpacing/lineHeight/
textDecoration) · textAlign/direction(rtl partial: warn) /whiteSpace/
textOverflow (label) ~ · objectFit/objectPosition (image) ✓ ·
cursor/userSelect/pointerEvents ✓.

**Layout (Mason consumed):** width/height/minWidth/minHeight/maxWidth/
maxHeight/margin/padding (all sides) · flexDirection/Grow/Shrink/Basis/
Wrap · alignSelf/Items/Content · justifyContent · order · gap/rowGap/
columnGap · position+top/right/bottom/left · aspectRatio · display ·
inset.

**Precise gaps (grep-verified absent from index.ts/mason.ts):**
- `textShadow` — GTK paints it; AppKit has nothing.
- `textTransform` — GTK paints it; absent here.
- `fontVariationSettings` — GTK passes through; absent here.
- `transformOrigin` — transform slots exist (translate/rotate/scale/
  perspective) but origin is fixed at center.
- `transition` — no CSS transition machinery (keyframes-only; see
  .agents/docs/notes/routing-transitions.md).
- `verticalAlign`, `caretColor`, `accentColor`, `listStyle`, `wordBreak`,
  `overflowWrap`, `hyphens`, `tabSize`, `fontVariant`, `fontStretch`,
  `mixBlendMode`, `isolation`, `backdropFilter`, `resize` (CSS prop),
  `minWidth`/`rowGap`/`columnGap` reach Mason only (fine) — the rest
  warn via warnUnsupportedCssProp / ignored-style warn.
- `overflow`/`overflowX`/`overflowY` — only both-hidden or both-visible
  paint; mixed-axis and scroll containers warn (NSView clipsToBounds is
  a boolean).

## Runtime evidence

- **Local host (arm64, macOS 26.6.2):** `bun run turbo run smoke --filter=@xplat/macos`
  → **30/30 assertions passed** (mounting, action dispatch, routing, lists)
  under `XPLAT_MACOS_SMOKE_TIMEOUT_MS=600000` + `goddard-agent resource run`.
  Proves no regression on covered paths; does NOT exercise the new CSS
  features' rendering.
- **css-paint probe:** structural layer assertions added in
  `examples/probes/css-paint.macos.tsrx` but UNRUN — the probe's isolated
  host bundle exits `metadata.nsmd not found` (native metadata generation is
  a separate heavy path the runner doesn't invoke; the smoke task builds it
  only for the demo app). Runtime qualification for the new paint features
  remains open.
- **skymac.local:** reachable, 51Gi free, but **arm64** not Intel, and its
  checkout is stale (`1fcf6406f`) with a dirty `ui-svg` — remote verification
  deferred; the dirty checkout was left untouched.

## Next (demand order)

1. Per-window @media: keep `setStyleEnvironment` but make injected fn read a
   module-level `activeMediaNode` set inside `restyleNode` around
   `computeCascade` (covers attachKeyframes too). `envForNode` walks to the
   root: portalroot → `root.view.window`; else `container.hostView.window`;
   size = `window?.contentLayoutRect ?? hostView.frame ?? largest-window`.
   Add css-engine export `stylesheetMediaQueries(): string[]` (GTK-safe,
   additive). Renderer tracks `container.mediaEnvs: Map<NSWindow, env>`;
   resize → per-window diff via evalMediaQuery on each gated query, restyle
   only containers whose results moved (first-seen window: seed + restyle if
   any media rules exist — can't diff). Replace `refreshMediaQueries` usage
   on macOS; GTK keeps it. Rewrite the resize-observer test in
   css-machinery.test.ts (it mocks refreshMediaQueries at line ~496).
   Relevant code: setStyleEnvironment ~10971, onHostWindowResize ~10995,
   installResizeObserver ~11009, restyleAllContainers ~10953, restyleNode
   ~3672 (inside the css-machinery slice — env helpers belong inside it too:
   `// ---- CSS cascade` at ~3561 to `function syncNativeColors` ~3993).
   RootContainer at ~300 needs `mediaEnvs` field; container literal ~11146.
   css-engine stylesheets.ts: mediaResults map ~29, refreshMediaQueries
   ~271-312 (pattern for enumerating queries: r.mediaQueryString on
   selectors + keyframes).
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
