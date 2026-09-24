# Status

> The tracking dashboard — what we're _forced to own_ vs. what upstream gives
> us, and where each owned problem stands. Reader-facing guides are in the
> sidebar; this page is the process view.

## The seven owned problems

What we must design and maintain ourselves, ranked by cost-of-getting-it-wrong.
Status vocabulary: `mapped` (design sketched) → `verified` (substrate/design
confirmed at source level; mechanics known) → `validated` (prototype proved
the shape) → `building` → `built`.

| #   | Owned problem                                                                    | File                                        | Status                                                                                                                                                  | Blocks on                                          | Decisions                      |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| 1   | **Primitives contract** — prop surface, semantics, allowed leaks                 | [primitives](primitives.md)                 | mapped; driver mechanics verified                                                                                                                       | lab: Q3 listview cell roots · Q4 controlled inputs | #3, #6, #9, #16, #21, #22, #24 |
| 2   | **Navigation contract** — shared route table, per-platform shells, modal-as-root | [navigation](navigation.md)                 | route dir implemented (`app/` → `deriveRouteManifest` → `registerRoutes`); Q6/Q14 resolved (portable boundaries = `@try`; HMR = self-accepting modules) | device run for manifest on native                  | #8, #9, #13, #19               |
| 3   | **Resolution toolchain** — suffix resolver, plugin ordering, TS typing           | [module-resolution](module-resolution.md)   | **verified** — `resolve.extensions` order + `moduleSuffixes`; rules own resolved filename                                                               | none — config details to prove in prototype        | #2, #3, #18, #23               |
| 4   | **Seam enforcement** — lint rules keeping invariants true                        | [testing](testing.md)                       | mapped; **upgraded** — compiler `validation` is a built-in enforcement layer                                                                            | none — write the config + rules                    | #3, #4, #20, #24               |
| 5   | **Animation/gesture facade** — shared API, per-target drivers                    | [animation-gestures](animation-gestures.md) | mapped; Q7/Q8 resolved (no portals; no CSS `transition` — keyframes-only, 12 props)                                                                     | none blocking                                      | #10, #22                       |
| 6   | **Platform services** — capability interfaces                                    | [platform-services](platform-services.md)   | surface enumerated                                                                                                                                      | Q15 a11y parity · Q18 fonts · Q19 css-var timing   | #11                            |
| 7   | **Version matrix & patches** — pinning, bumps, patch-package                     | [toolchain](toolchain.md)                   | matrix defined; HMR model verified                                                                                                                      | lab: Q12 two dev servers · Q17 treeshake           | #15                            |

**Substrate verification (Phase 1) complete** — 12/20 questions answered at
desk level; the rest are queued as lab experiments in Silo. New decisions from
that pass: #18–#24.

## Supporting docs

| File                                      | Role                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| [spec](spec.md)                           | Orientation — what xplat is and where to start                                    |
| [architecture](architecture.md)           | Shared screens, UI components, and platform leaves                                |
| [styling](styling.md)                     | Cross-cuts 1/4/5 — shared CSS strategy                                            |
| [css-support-notes](css-support-notes.md) | NS∩web allowed grammar (seeded; verify per row in prototype)                      |
| [decisions](decisions.md)                 | Ledger — decided / provisional / forced                                           |
| [open-questions](open-questions.md)       | Unverified seams, ranked by blast radius                                          |
| [demos](demos.md)                         | Demo suite in `packages/demos` — geastack-catalog-inspired screens, one seam each |

## Doc conventions

- Every owned-problem file carries a status header: **Owns / Status / Blocks
  on / Decisions / Validated by**. Update the header when state changes; the
  ledger files ([decisions](decisions.md), [open-questions](open-questions.md))
  are the cross-cutting indexes. The docs app hides this paragraph in guides —
  it renders for contributors only.
- "Validated by" names the experiment that would prove the design — usually a
  slice of the first prototype (see [../README.md](../README.md)).
- Funnel each page: purpose quote → orientation → mechanics. Dense lab
  evidence and verification detail belong in a trailing appendix (e.g.
  navigation.md's `## Lab log`), not the intro.
- Callouts flag intensity where it spikes: `> [!NOTE]` context,
  `> [!TIP]` optional advice, `> [!IMPORTANT]` required reading,
  `> [!WARNING]` traps that cost time, `> [!CAUTION]` destructive or
  irreversible behavior. The docs app renders them as bordered blocks.
- Facts about upstream systems belong in `prior-art/`, cited from plan docs —
  not restated inline.
