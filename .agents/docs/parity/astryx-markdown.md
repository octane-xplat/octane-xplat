# Astryx Markdown parity baseline (0.7.4)

> Milestone-0 baseline for the Markdown parity plan
> (`~/dev/plans/octane-xplat/markdown-astryx-parity.md`). This note freezes the
> reference artifact and inventories the public capability denominator. Status
> lives in Silo `astryx_markdown_parity`; fixtures live in
> `tools/astryx-parity/scenarios/markdown.ts`.

## Frozen reference

| Field | Value |
| --- | --- |
| Package | `@astryxdesign/core@0.7.4` (MIT) |
| Tarball | `https://registry.npmjs.org/@astryxdesign/core/-/core-0.7.4.tgz` |
| Integrity | `sha512-zd/XfUw8OH8Dj65w6cPYamMXgb11P7oIgrlXgyBGaHXKJi3aedkU17Q+lERgv7YL3Bv4/UKPMqKL/QZkvoay1w==` (matches bun.lock) |
| shasum | `367f77b90832f1e834baa2a84aa5f8e756354d85` |
| Published | 2026-10-23T17:17:10.963Z |
| Source revision | `704757fd827c6fa00a71af80b06d5da99d155e45` (tag `v0.7.4`) — **hash-verified**: all 1678 `packages/core/src` blobs in the tarball are byte-identical to the tag tree; the only extras are 31 generated i18n locale files |
| Prior context | 0.6.4 pin `ebd939b665361a078015377c0dfe50cc3c1d70a4` is a post-tag main commit (2026-10-02), not the v0.6.4 tag (`a51b1fb7…`) |
| Current upstream | `e0548a6475d7edbcbd350bc71d0a4e4679e9138d` (main, 0.7.6-canary); **not the target** |

Export map (all under `@astryxdesign/core`): `./Markdown` (client component + parser/types), `./Markdown/parser` (server-safe), `./Markdown/plugins` (server-safe), `./Markdown/plugin-renderer` (client-only, new in 0.7.x), `./Markdown/remark` (server-safe adapter), `./Markdown/utils` (server-safe incl. `trimStreamingArtifacts`), plus `./Outline`, `./Citation`. 151 total export entries.

## Version differences

**0.6.4 → 0.7.4** (`src/Markdown` 41 → 80 files): +`autolink` prop was already present at 0.6.4; real additions are `sourceLines` payloads on block renderers, `markdownSourceLinesPlugin`, `createMarkdownHeadingLinks`(+Renderer), `MarkdownPluginNodeRenderer` subpath, `decodeMarkdownCharacterReferences`, `getMarkdownPluginCapabilities`/`MarkdownPluginCapabilities`, `position` on extension nodes, `headingProjection.ts`, ~1845 parser lines of grammar hardening (angle destinations, ATX indentation, block nesting, code spans, emphasis edges, fence info, image alt, indented fences/tables, link brackets/destinations/labels, list bullets/continuation, trailing spaces, character references), plus behavior changes: content-derived table column floors (FR26–28), default code wrap + `diff`/`diff-<lang>` layer (FR29), lazy continuation, escaped pipes in table inline code.

**Post-0.7.4 upstream** (separate inventory, not target): `codeLanguages` prop (feat #8489, also RichText/DiffViewer), Outline spec restructure, list-marker fix, i18n string moves.

**Spec-only at 0.7.4** (declared in `Markdown.spec.md` but absent from the artifact): `onPluginDiagnostic` channel (FR19). Tracked as a qualification question, not a shipped capability.

## Capability denominator

The full enumeration — id, kind, source reference, owning milestone, fixture or
qualification question, and milestone-0 local assessment — is machine-readable
in `tools/astryx-parity/scenarios/markdown.ts` (`markdownCapabilities`, ~68
entries). Groups:

- **Props** (16): children source, display, density, headingLevelStart, isStreaming, onLinkClick, sources, citationStyle, contentWidth(680 default), contentAlign, components, plugins, inlinePlugins, autolink, BaseProps/ref.
- **Renderer slots** (10): code, inlineCode, math, citation, link, heading, paragraph, image, blockquote, hr — with decline/throw/suspend → code/default fallback.
- **Grammar** (18): headings, paragraphs+lazy continuation, fences, lists, task lists, blockquotes, tables(+escaped pipes), links, reference links, images, emphasis, code spans, breaks, thematic break, character references, escapes, autolinks, citations, math, indentation.
- **Parser API** (9): parseMarkdown(+Ast), parseInline(+Ast), incremental+state invalidation keys, options incl. legacy ReadonlySet, canonical AST+visitors, trimStreamingArtifacts, decodeMarkdownCharacterReferences, server-safe subpaths.
- **Protocol** (9): createMarkdownPlugin validation, syntax contributions (startsWith/maxSpan/tokenize→match|defer|no-match), immutable transforms+freeze, typed renderers+toText, extension nodes+content categories, fallbacks, capability introspection, plugin-renderer, spec-only diagnostics.
- **Helpers** (8): textTransform, semanticFence, sourceDecoration(+get), frontmatter, softBreaks, sourceLines, headingLinks, remark adapter.
- **Streaming** (4): internal smoothing (10ch/50ms natural, 4ch/8ms fast, grapheme snap, theme token override), boundary-ring fade, settlement/invalidation, frontmatter+math withholding.
- **Render behavior** (10): link policy (external target/rel, internal linkComponent, unsafe→text), citation numbering+fallbacks, heading ids shared with Outline, table floors+scroll region, code wrap+diff, prose layout, list markers, unsafe-URL fallback, inline display, density spacing, theme targets.
- **Integration** (5): shared Outline projection, link provider, i18n, RSC boundary, post-0.7.4 codeLanguages note.

## Harness

`bun run parity:markdown [-- parser|behavior|layout|performance]` in
`tools/astryx-parity`. Result classes: `match`, `candidate-diff`,
`candidate-error`, `reference-error`, `harness-error` — exit 1 findings, 4
errors, 0 clean. Artifacts in `artifacts/markdown/`.

Baseline run (2026-11-02, macOS, bun): **parser 138 results — 75 match, 63 candidate findings, 0 reference/harness errors**; behavior 13 candidate diffs; layout 4 candidate diffs; performance 6 workloads recorded (candidate subset parser currently faster; budgets recorded as contract: p95 ≤1.2×, throughput ≥0.8×). The candidate web build resolves platform leaves through `xplatBoundary('web')` from `@octane-xplat/cli/vite` — explicit `.tsrx` specifiers must map to `.web.tsrx` leaves or the bundle pulls native base files; native-only modules (`@nativescript/core`, `internal/keyboard/keyboard-overlay-host`) then never enter the web graph and need no stubs.

Milestone-2 run (2026-11-05, macOS, bun): **parser 138 results — 138 match, 0 findings; performance 6/6 match**. The candidate parser is now a port of the frozen parser (`packages/ui/src/markdown/markdown-parse.ts` from `parser.ts` v0.7.4, minus legacy projections and the plugin/sourceLines seams that are milestone 5). Document model is `MdDoc` v2 — recursive `type`-tagged MDAST-aligned nodes (`markdown-ast.ts`), `assertMdDoc` validation, `MdParseOptions{sourceIds,autolink,math}`. `xplat routes` bakes with the same parser via a source import (`packages/cli/src/markdown.ts`, `marked` removed), normalizing through JSON so baked literals carry no undefined fields. Streaming keeps `createMarkdownStreamParser` over the ported incremental machinery; `Markdown.tsrx` renders recursively and applies `trimStreamingArtifacts` before the incremental parse (reference component layering). Reference notes: **no Setext headings** (`foo\n===` is a paragraph; `foo\n---` is paragraph + `thematicBreak`), a bare `- ` marker is paragraph text, and `trimStreamingArtifacts` leaves whole-line fences (open fences stream as code blocks).

Benchmark contract: 1 KB/10 KB/100 KB corpus, seeded chunk schedules, warmup 3, n=15–30, p50/p95/mean; incremental tail-append variant; budgets `p95Ratio ≤1.2`, `throughputRatio ≥0.8` (plan thresholds, calibration before optimization).

## Milestone-1 resource recommendation

- Native builds: 1 reservation for iOS/macOS probe builds (`native_builds:1`).
- Devices: one iOS simulator (`ios:<UDID>` + `resident_devices:1`) for inline/rich-content probes; AppKit desktop needs no device reservation but benefits from `desktop_input:1` only if focus/OS-input probes are added — the planned probes are render-level and need no shared input.
- Browsers: Playwright is already installed locally; no reservation needed.

## Milestone-1 contract decisions (probed 2026-11-02)

Targets run: **web** (Chromium, all seams pass), **macOS** (AppKit/JSC, 5/6
probe cases pass; the mechanics case hangs on the host — items below are
source-level). **iOS/Android** probes staged but device-grant-blocked at
handoff; **GTK** needs a real Linux host; **WinUI** is outside the probe
runner and the Windows guest was parked. Cases: `research/md-seams/*` —
`inline-control`, `inline-nested`, `inline-interactive`, `blocks`,
`boundaries`, `mechanisms`. Promoted contract tests:
`packages/ui/src/markdown/inline-contract.mobile.test.tsrx`.

- **Recursive lists/quotes + rich inline children** — proven on web + macOS
  with shared primitives: marker+hanging-indent `View` rows show increasing x
  offsets (8→28→48 web; -2→18→38 macOS); wrapped items show real heights;
  blockquote/list nesting interleaves freely. No new mechanism needed.
- **Inline Markdown inside text** — nested `<Text>` renders real styled runs
  on web (DOM span nesting, style inheritance verified) and macOS (nested
  span → NSAttributedString fold, decision `#144`). NativeScript:
  `<label><span>` throws on the 0.2.5 patched driver (the `#25` extension is
  still missing); `<formattedstring>`+`<span>` works but runs are flat —
  nested styled runs must flatten with merged styles. Per-span `onLinkTap`
  exists (`RichTextSpan` uses it); GTK folds spans to Pango markup with
  `octane-span://` link dispatch. **Contract:** inline vocabulary = text runs
  only; view-bearing inlines (Link/Citation/View/Image inside `<Text>`) throw
  on AppKit (`masonview cannot contain span children`) and would throw on the
  NS driver — contract error, not silent drop. Inline images inside text have
  no native attachment API — block-level only (recorded deviation).
- **Custom renderers** — hooks (`useSignal$`/`useMemo`/`useEffect`), context
  (`createContext` provider → `useContext` inside the slot), local state
  updates, and prop updates without remount (mounts stayed 1) all verified on
  web + macOS + object driver. Renderer slots are `.tsrx` components.
- **Thrown/declined/pending/unmounted fallback** — decision `#145`:
  `universalTry` (`@try`/`@pending`/`@catch`) matches the 0.7.4
  `MarkdownPluginBoundary`+`Suspense` contract: throw→catch arm+fallback,
  `use(promise)`→pending arm→commit on settle, unmount-during-pending→clean
  (no resurrection), decline (null/boolean)→call-site fallback, `reset()`
  re-mounts. No React semantics needed.
- **Images** — `Image` already ships in `packages/ui` (`components/media`);
  block images need no new dependency and no ui→image-package cycle.
- **Host mechanisms** — external links: `Utils.openUrl` (mobile) /
  `NSWorkspace.openURL` (macOS) / `window.open` (web) all present.
  Scroll overflow: `ScrollableArea axis="inline"|"both"` gives real scroll
  regions (web `scrollWidth` 640 > 200 viewport). Anchors: portable
  `ScrollableAreaHandle.scrollToOffset` — headings seek by handle, not
  `id`+`scrollIntoView`. Font metrics: `view.measure`/`getMeasuredWidth`
  (mobile), `intrinsicContentSize` (AppKit), `getBoundingClientRect` (web).
  Reduced motion: web `matchMedia` ✓; macOS CSS env reads
  `accessibilityDisplayShouldReduceMotion` + live notification; the
  `useMediaQuery` restricted grammar does **not** implement
  `prefers-reduced-motion` on mobile or the macOS hook path (evaluates
  false — pinned in `media-query-native.test.ts`); iOS
  `UIAccessibilityIsReduceMotionEnabled` and Android
  `animator_duration_scale` are the plumbing targets. Text reveal/fade:
  `vx-md-fade` is web-CSS-only by design; native `Span` has no `opacity`
  property — fade needs a JS driver (per-run `color` alpha or whole-block
  opacity) and remains a recorded presentation gap until then.
- **Upstream/host dependencies handed onward:** NS driver `#25` span-under-
  TextBase + `#text`-under-span extensions (candidate patch exists at
  `tools/platform-qualification/patches/windows-rich-text/` — not canonical);
  `useMediaQuery` reduced-motion plumbing per leaf; macOS mechanisms probe
  hang on the AppKit probe host (isolate before re-running);
  iOS/Android device grants; real Linux host; Windows guest.

## Milestone 3 — rendered surface (landed `f3acf5d`)

`Markdown` renders through the 0.7.4 contract: `children` is the source
spelling (`text` cut over atomically, `data` kept exclusive for baked
docs), plus `display`, `contentWidth` (680 default), `contentAlign`,
`citationStyle`, `autolink`, `components` (10 renderer slots),
`inlinePlugins`, `onLinkClick`, and root `id`/`className`/`style`/
`testID`/`accessibilityRole` (`document` default). `plugins`,
`sourceLines`, and transforms stay milestone-5 seams; `isStreaming`
smoothing internals stay milestone-4.

Rendering: collapsed-seam margins reproduce the upstream spacing table;
prose blocks get `maxWidth`/center alignment; headings clamp shifted
levels at 6 and take ids from `projectMdHeadings` — the same projection
`outlineFromDoc` uses. Lists render `• ◦ ▪` bullets and
`decimal/lower-alpha/lower-roman` markers by depth; task items are
`CheckboxList`/`Checkbox` read-only controls. Tables mount children parts
with `ch` column floors; code maps `diff`/`diff-<lang>` fences; citations
number by first encounter with `{title: id}` fallback; inline
`markdown-inline` leaves emit real DOM tags on web and span/tappable
runs elsewhere (macOS runs render without activation — glyph hit-testing
is a recorded host gap; iOS/Android run taps still ride on driver #25).

Verification (m3): ui vitest 1321/1321; ui typecheck clean (pre-existing
workshop failure only); parity behavior 13→2 step diffs — residual is
the shared `CheckboxList`'s internal `list`/`listitem` DOM, not the
Markdown surface. Layout: `content-width` matches; other cells differ
by theme font metrics (16px vs 14px base) and one table cell-width
nuance (572px scroll vs 480). Evidence: `~/dev/reports/octane-xplat/
astryx-markdown-m3-evidence.md`.

## Milestone-3 renderer corrections (55a0cfe4)

Second-pass fixes closing the residual renderer gaps from f3acf5d2:

- **Task lists** now render the reference `CheckboxList` anatomy on web:
  `group "Task list"` (hidden label via `label`+`isLabelHidden`) → `list` →
  `listitem` → hidden-label `Checkbox` + visible label (rich inline content;
  checkbox named via `aria-labelledby`). Shared `CheckboxGroup` children are
  wrapped in `List`; `CheckboxListItem` is a `ListItem`+`Checkbox` composite
  with `FieldProvider value={null}` so the group Field doesn't suppress the
  hidden label; `Checkbox` forwards `aria-labelledby` outside a Field;
  `.vx-field-label--hidden` CSS added. Rich `label: Renderable` +
  `accessibilityLabel` widen the public item props.
- **Plain/mixed lists** render through shared `List`/`ListItem` + new
  `ListMarkerScope` (internal context marker/task override, Astryx parity):
  marker cycles disc→circle→square and decimal→lower-alpha→lower-roman by
  depth; mixed task items draw a read-only checkbox marker named by item
  text. Adds the previously missing `.vx-listitem`/`.vx-listmarker*` CSS
  (counter `vx-list`, density block padding). New `markdown-list` leaf trio
  (`MdRowList`/`MdRowItem`/`MdCheckList`/`MdCheckItem`) keeps native rows.
- **Root font baseline**: Markdown root sets `font-family/size/leading/color`
  from the same `--font-family-body`/`--text-body-*` tokens the reference
  uses — removes the 16px-vs-14px metric divergence.
- **`CodeBlock isDiff`**: `diff`/`diff-…` fences render the unified-diff
  layer — glyph column (`user-select:none`), added/removed/header row tints
  (`--color-syntax-added/-removed/-diff-header/-*-marker`), `lang diff`
  label, copy still returns exact source. `splitDiffLines` ported to
  `components/content/code-diff.ts` with attribution; native leaf mirrors
  with scheme-aware concrete colors.
- **i18n**: `english` catalog gains `@astryx.checkboxList.item.checkbox`
  ("Checkbox") and `@astryx.markdown.taskList` ("Task list").

Verification (2026-11-02, macOS, bun 1.4.4): `parity:markdown behavior`
**clean — 1 result, 1 match, 0 findings** (was 2 task-list diffs);
`ui` vitest **1325/1325** incl. new override-lifecycle/link-cancel cases;
`parity:markdown layout` 4 residual diffs remain: table scrollWidth
515 vs 478 (≈36px cell-overflow gap), and ≤25px block-height deltas
(list/quote/code row metrics inside shared primitives — not normalized
away, still open). Typecheck: ui tree clean for changed files; the
pre-existing workshop `chrome.tsrx` and content-mapper failures are
unchanged on main.

## Milestone-5 extension system status (2026-11-02)

Full 0.7.4 plugin protocol ported: `createMarkdownPlugin` registration
validation, ordered syntax contributions (bounded `maxSpan` tokenizer
window, `match`/`defer`/`no-match`, first-character indexing, thrown-tokenizer
recovery), immutable transforms (trusted/claim fast paths, deep-freeze before
untrusted input, `validateAst` content-category checks — phrasing/flow
parents, link nesting, cycles, 100k bound, position invariants, extension
ownership, per-type fields, inline single-paragraph root), typed renderers
with `toText`, and `getMarkdownPluginCapabilities`. Extension nodes carry
`display: 'inline' | 'block'`; phrasing parents admit `display:'inline'`
extensions only, block containers `display:'block'` — enforced at parse,
transform validation, and helper adoption (`adoptMarkdownHelperNode[s]`).

Helpers: all eight 0.7.4 modules — `createMarkdownTextTransform`,
`createMarkdownFenceTransform`/`getMarkdownFenceProposal`,
`createMarkdownSourceDecoration`/`getMarkdownSourceDecorations`,
`createMarkdownFrontmatter`, `markdownSoftBreaksPlugin`,
`markdownSourceLinesPlugin`, `createMarkdownHeadingLinks`, and
`createMarkdownRemarkTransform` (`markdown-remark.ts`, the synchronous
transform-only Remark adapter: fresh mutable MDAST copy per run, constrained
file/processor guards, provenance-by-marker round trip, fail-closed with one
adapter-vocabulary diagnostic). The benchmark route `pages/markdown-perf`
is restored on `markdownSoftBreaksPlugin`; the workload runs through the
plugin pipeline (50 dense-claim breaks; full 23 KB fixture ≈ 9 ms parse).

Renderer deltas vs the first port: extension fallback shows `node.source`
before `toText` (matching the reference), failed boundaries retry on node or
renderer identity change via keyed remount, and `MdHeadingPermalink` uses
`useContainerReveal` hover/focus-within reveal with the reference's 1500 ms
feedback window and layout-preserving control slot.

## Milestone 6 — host qualification (landed `f2fb48b48`)

Native nested-mark styling and sibling text flow are fixed and qualified on
real hosts. Marks (strong/emphasis/delete/link) compose through `MdRunContext`
so leaf `MdTextRun` emits flat styled spans; the patched
`@nativescript-community/octane@0.2.5` driver folds mixed `#text`/span
children into one ordered `FormattedString` (decision #25), so
`display="inline"` runs join surrounding sibling text. The AppKit children-path
table gap closed earlier via a horizontal scroll region.

Qualified: **iOS** sim `BE8C45B4` 8/8 spec cases; **Android** physical
`905d3a9e` (OnePlus CPH2551) 8/8 — first actual `ns test android` lane;
**AppKit** markdown probe 23/23 + wide-table probe 7/7 on real AppKit/JSC
(activation is AX-action dispatch, not OS input); **web** parser 466/466,
behavior and layout 3/3 engines, performance 10/10 budgets.

Remaining gates (not waived): **GTK** and **WinUI** — no authorized
environments; **visual parity** — not authorized; Android evidence is one
physical device. Pre-existing `@xplat/mobile` typecheck failure reproduces on
the pristine parent (39 errors outside markdown). Evidence:
`~/dev/reports/octane-xplat/astryx-markdown-m6-evidence.md`.

## Milestone 7 — documentation and migration

`docs/app/markdown.md` documents the rendering surface (layout props, links,
citations, `components`, `inlinePlugins`, plugin protocol and helpers,
migration, limits); `content-display.md` keeps grammar/streaming and points
to it. The skill typography reference, component table, recipes, and this
note were reconciled to the `children` source convention and internal
smoothing. Recipe coverage vs verification is recorded in Silo at the
landing commit.
