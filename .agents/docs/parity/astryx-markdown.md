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

Benchmark contract: 1 KB/10 KB/100 KB corpus, seeded chunk schedules, warmup 3, n=15–30, p50/p95/mean; incremental tail-append variant; budgets `p95Ratio ≤1.2`, `throughputRatio ≥0.8` (plan thresholds, calibration before optimization).

## Milestone-1 resource recommendation

- Native builds: 1 reservation for iOS/macOS probe builds (`native_builds:1`).
- Devices: one iOS simulator (`ios:<UDID>` + `resident_devices:1`) for inline/rich-content probes; AppKit desktop needs no device reservation but benefits from `desktop_input:1` only if focus/OS-input probes are added — the planned probes are render-level and need no shared input.
- Browsers: Playwright is already installed locally; no reservation needed.
