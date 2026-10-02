# Status

> The tracking dashboard — what we're _forced to own_ vs. what upstream gives
> us, and where each owned problem stands. Reader-facing guides are in the
> sidebar; this page is the process view.

## The seven owned problems

What we must design and maintain ourselves, ranked by cost-of-getting-it-wrong.
Status vocabulary: `mapped` (design sketched) → `verified` (substrate/design
confirmed at source level; mechanics known) → `validated` (prototype proved
the shape) → `building` → `built`.

| #   | Owned problem                                                                    | File                                        | Status                                                                                                                                                                                                                                                                                 | Blocks on                                                                                                                                                                               | Decisions                                               |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | **Primitives contract** — prop surface, semantics, allowed leaks                 | [primitives](../app/primitives.md)                 | Stage 2 `VirtualList` foundation validated on web/iOS/Android, including measured-height anchor correction; Octane owns windowing over DOM/native `ScrollView`. Q30 now has synthetic wheel/swipe, fixed-height, and three-minute memory profiles                                      | Q30 physical trackpad/touch input; validate iOS variable-height geometry gaps and Android PSS growth; Stage 3 feed/chat behavior; lab: Q3 listview cell roots · stale getViewById views | #3, #6, #9, #16, #21, #22, #24, #33, #39, #40, #57, #58 |
| 2   | **Navigation contract** — shared route table, per-platform shells, modal-as-root | [navigation](../app/navigation.md)                 | building — nested layouts, typed route generation, programmatic routes (`defineRoutes`/`addRoutes`), loaders, modal/fade routes, web scroll restore, deep-link wiring, and `openWindow`; named-stack pushes owned on all three targets (iOS native Frames + re-arm, Android swap-pane) | Android swap-pane route validation; upstream #11446 (fixes #11444) ported into the core patch — drop when it ships                                                                      | #8, #9, #13, #19, #67, #68                              |
| 3   | **Resolution toolchain** — suffix resolver, plugin ordering, TS typing           | [module-resolution](../platform/module-resolution.md)   | **verified** — `resolve.extensions` order + `moduleSuffixes`; rules own resolved filename                                                                                                                                                                                              | suffix typing still needs explicit .ts shims for .tsrx leaves (Q25)                                                                                                                     | #2, #3, #18, #23                                        |
| 4   | **Seam enforcement** — lint rules keeping invariants true                        | [testing](../verify/testing.md)                       | implemented — Oxlint/TSRX rules, CSS checks, recipe checks, and compiler validation                                                                                                                                                                                                    | new rules and device regressions need targeted tests                                                                                                                                    | #3, #4, #20, #24                                        |
| 5   | **Animation/gesture facade** — shared API, per-target drivers                    | [animation-gestures](../app/animation-gestures.md) | implemented — numeric motion leaf, retained Presence, shared pan events; see animation guide                                                                                                                                                                                           | physical-device gestures, reduced motion, and frame pacing                                                                                                                              | #10, #22                                                |
| 6   | **Platform services** — capability interfaces                                    | [platform-services](../platform/platform-services.md)   | implemented capability services; media packages have target-specific verification limits                                                                                                                                                                                               | Q15 assistive-technology checks; Q26 physical haptics; Q27 audio background/interruption checks                                                                                         | #11                                                     |
| 7   | **Version matrix & patches** — pinning, bumps, pnpm patches                      | [toolchain](../start/toolchain.md)                   | matrix defined; HMR model verified; release checks wired — packed-consumer verify + native build jobs + same-sha evidence gating in CI                                                                                                                                                 | mobile typecheck failures (audio/demos/media-probe) block release; Android emulator smoke still manual; upgrade compatibility (Q12/Q17 have recorded evidence)                          | #15                                                     |

**Substrate verification (Phase 1) complete** — 12/20 questions answered at
desk level; the rest are queued as lab experiments in Silo. New decisions from
that pass: #18–#24.

## Supporting docs

| File                                      | Role                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| [spec](../start/spec.md)                           | Orientation — what Xplat is and where to start                                    |
| [architecture](../start/architecture.md)           | Shared screens, UI components, and platform leaves                                |
| [styling](../app/styling.md)                     | Cross-cuts 1/4/5 — shared CSS strategy                                            |
| [css-support-notes](css-support-notes.md) | NS∩web allowed grammar (seeded; verify per row in prototype)                      |
| [decisions](decisions.md)                 | Ledger — decided / provisional / forced                                           |
| [localization](../app/localization.md)           | Lingui leaf + toolchain — catalogs, `.tsrx` extraction, per-target detection      |
| [open-questions](open-questions.md)       | Unverified seams, ranked by blast radius                                          |
| [demos](demos.md)                         | Demo suite in `packages/demos` — geastack-catalog-inspired screens, one seam each |

## Doc conventions

- Every owned-problem file carries a status header: **Owns / Status / Blocks
  on / Decisions / Validated by**. Update the header when state changes; the
  ledger files ([decisions](decisions.md), [open-questions](open-questions.md))
  are the cross-cutting indexes. The Markdown source preserves those fields; the docs renderer currently
  suppresses the metadata paragraph. Read the source for the full header.
- "Validated by" names the experiment that would prove the design — usually a
  slice of the first prototype (see [../README.md](../../README.md)).
- Funnel each page: purpose quote → orientation → mechanics. Dense lab
  evidence and verification detail belong in a trailing appendix (e.g.
  navigation-notes.md's `## Lab log`), not the intro.
- Callouts flag intensity where it spikes: `> [!NOTE]` context,
  `> [!TIP]` optional advice, `> [!IMPORTANT]` required reading,
  `> [!WARNING]` traps that cost time, `> [!CAUTION]` destructive or
  irreversible behavior. The docs app renders them as bordered blocks.
- Facts about upstream systems belong in `prior-art/`, cited from plan docs —
  not restated inline.
