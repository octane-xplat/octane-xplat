# docs/

Our plan. [`prior-art/`](../prior-art/) documents other people's systems —
nothing there is a commitment.

Two ways to read this tree: **by domain** (the files below) or **by ownership**
(the tracking table — what we're *forced to own* vs. what upstream gives us).

## The seven owned problems

What we must design and maintain ourselves, ranked by cost-of-getting-it-wrong.
Status vocabulary: `mapped` (design sketched) → `validated` (prototype proved
the shape) → `building` → `built`. Everything is `mapped` until the first
prototype answers the top of [open-questions](open-questions.md).

| # | Owned problem | File | Status | Blocks on | Decisions |
|---|---|---|---|---|---|
| 1 | **Primitives contract** — prop surface, semantics, allowed leaks | [primitives](primitives.md) | mapped | Q3 listview templates · Q4 controlled inputs · Q9 className on native · Q10 style objects | #3, #6, #9, #16 |
| 2 | **Navigation contract** — shared route table, per-platform shells, modal-as-root | [navigation](navigation.md) | mapped | Q6 Suspense on universal · Q14 HMR export shape | #8, #9, #13 |
| 3 | **Resolution toolchain** — suffix resolver, plugin ordering, TS typing | [module-resolution](module-resolution.md) | mapped | Q1 `.tsrx` in glob · Q5 resolver ordering · Q13 multi-renderer | #2, #3 |
| 4 | **Seam enforcement** — lint rules keeping invariants true | [testing](testing.md) | mapped | none — write the rules | #3, #4 (invariants) |
| 5 | **Animation/gesture facade** — shared API, per-target drivers | [animation-gestures](animation-gestures.md) | mapped | Q8 CSS transitions · Q7 portals | #10 |
| 6 | **Platform services** — capability interfaces | [platform-services](platform-services.md) | surface enumerated | Q15 a11y parity · Q18 fonts · Q19 css-var timing | #11 |
| 7 | **Version matrix & patches** — pinning, bumps, patch-package | [toolchain](toolchain.md) | matrix defined | Q12 two dev servers · Q17 treeshake | #15 |

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
