# docs/

Our plan. [`prior-art/`](../prior-art/) documents other people's systems —
nothing there is a commitment.

Two ways to read this tree: **by domain** (the files below) or **by ownership**
(the tracking table — what we're *forced to own* vs. what upstream gives us).

## The seven owned problems

What we must design and maintain ourselves, ranked by cost-of-getting-it-wrong.
Status vocabulary: `mapped` (design sketched) → `verified` (substrate/design
confirmed at source level; mechanics known) → `validated` (prototype proved
the shape) → `building` → `built`.

| # | Owned problem | File | Status | Blocks on | Decisions |
|---|---|---|---|---|---|
| 1 | **Primitives contract** — prop surface, semantics, allowed leaks | [primitives](primitives.md) | mapped; driver mechanics verified | lab: Q3 listview cell roots · Q4 controlled inputs | #3, #6, #9, #16, #21, #22, #24 |
| 2 | **Navigation contract** — shared route table, per-platform shells, modal-as-root | [navigation](navigation.md) | mapped; Q6/Q14 resolved (portable boundaries = `@try`; HMR = self-accepting modules) | none blocking | #8, #9, #13, #19 |
| 3 | **Resolution toolchain** — suffix resolver, plugin ordering, TS typing | [module-resolution](module-resolution.md) | **verified** — `resolve.extensions` order + `moduleSuffixes`; rules own resolved filename | none — config details to prove in prototype | #2, #3, #18, #23 |
| 4 | **Seam enforcement** — lint rules keeping invariants true | [testing](testing.md) | mapped; **upgraded** — compiler `validation` is a built-in enforcement layer | none — write the config + rules | #3, #4, #20, #24 |
| 5 | **Animation/gesture facade** — shared API, per-target drivers | [animation-gestures](animation-gestures.md) | mapped; Q7/Q8 resolved (no portals; no CSS `transition` — keyframes-only, 12 props) | none blocking | #10, #22 |
| 6 | **Platform services** — capability interfaces | [platform-services](platform-services.md) | surface enumerated | Q15 a11y parity · Q18 fonts · Q19 css-var timing | #11 |
| 7 | **Version matrix & patches** — pinning, bumps, patch-package | [toolchain](toolchain.md) | matrix defined; HMR model verified | lab: Q12 two dev servers · Q17 treeshake | #15 |

**Substrate verification (Phase 1) complete** — 12/20 questions answered at
desk level; the rest are queued as lab experiments in Silo. New decisions from
that pass: #18–#24.

## Supporting docs

| File | Role |
|---|---|
| [architecture](architecture.md) | The model + invariants everything else hangs off |
| [styling](styling.md) | Cross-cuts 1/4/5 — shared CSS strategy |
| [decisions](decisions.md) | Ledger — decided / provisional / forced |
| [open-questions](open-questions.md) | Unverified seams, ranked by blast radius |

## What we do *not* own (upstream covers it)

Renderer + host driver + element registry + on-device HMR
(`@nativescript-community/octane`) · styling engine (real CSS/vars/media
queries/keyframes both targets) · worklet/bridge runtime (JS is on the UI
thread) · nav containers (`frame`/`tabview`/`ui-drawer`/`showModal`) · native
bundler pipeline (`@nativescript/vite` HTTP ESM) · DOM renderer + SSR (octane).

## Doc conventions

- Every owned-problem file carries a status header: **Owns / Status / Blocks
  on / Decisions / Validated by**. Update the header when state changes; the
  ledger files ([decisions](decisions.md), [open-questions](open-questions.md))
  are the cross-cutting indexes.
- "Validated by" names the experiment that would prove the design — usually a
  slice of the first prototype (see [../README.md](../README.md)).
- Facts about upstream systems belong in `prior-art/`, cited from plan docs —
  not restated inline.
