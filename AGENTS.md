# AGENTS.md

Working agreements for this repo.

## What this is

Pre-implementation design for a single [Octane](https://github.com/octanejs/octane)
codebase targeting web (DOM renderer) + iOS/Android
([`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

**There is no product code yet.** The deliverable is a fully-planned framework
spec. Everything written so far is documentation; correctness claims should be
verified against upstream source before being treated as load-bearing.

## Layout

| Path | What it is |
|---|---|
| `docs/` | Our plan. `docs/README.md` is the index/dashboard — seven owned problems, each with a status header (Owns / Status / Blocks on / Decisions / Validated by). |
| `prior-art/` | Other people's systems — substrate (`octane`, `nativescript-octane`, `nativescript-core`) and precedents (`one`, `tamagui`, `react-native-web`, `flutter`). Documents here are never commitments. |
| `docs/decisions.md` | Decision ledger, `#`-numbered, statuses: forced / decided / provisional / rejected. Reversals get dated notes, not edits. |
| `docs/open-questions.md` | Unverified seams, `Q`-numbered, ranked by blast radius. |
| `research/` | Gitignored clones of upstream repos for source interrogation. Not shipped, not authoritative — cite upstream files in docs instead. |
| Silo | Git-scoped SQLite tracking the exploration state (see below). |

## The exploration loop

Per Silo topic, in phase order (see `docs/exploration-path.md` or
`docs/README.md`):

**question → hypotheses → evidence (source read or experiment) → decision →
spec delta in the domain doc → ledger updates → commit.**

Rules of the road:

- **Desk before lab.** Answer by reading upstream source first. Experiments
  needing a running app stay queued until the prototype harness exists — the
  probe app is most of the prototype anyway.
- **Docs carry conclusions; Silo carries state.** A Silo row is
  statement+rationale+refs, not narrative. The design lives in `docs/`.
- **Commit frequently** — after each resolved-question batch or topic
  completion. Commits are the rewind points. Conventional Commits (`docs:`,
  `silo:`-adjacent state is external — repo commits cover doc changes only).
- **Proceed autonomously.** Don't stop for input unless a decision is truly
  critical and has lasting consequences. Course-correct freely mid-process —
  the goal is a stellar framework, not adherence to the outline.
- **Mark confidence honestly.** A decision reached by source-reading is
  different from one verified on-device; the ledger and question rows carry
  evidence type (`desk-source` vs `lab-experiment`) so we know what's proven vs
  inferred.

## Silo conventions

Database is git-scoped to this workspace (stored under Silo's app-data dir;
nothing to commit). Tables:

| Table | One row = | Status values |
|---|---|---|
| `topics` | an area of interrogation | `queued` → `exploring` → `resolved` / `parked` |
| `questions` | a specific unknown | `open` → `answered` / `parked` |
| `decisions` | a commitment (mirrors decisions.md `#`s) | `forced` / `decided` / `provisional` / `rejected` |
| `experiments` | a validation to run | `queued` → `running` → `passed` / `failed` / `parked` |

- Natural keys: topic `slug`, decision `num`. Update rows in place; don't
  duplicate.
- `questions.evidence`: `desk-source` (upstream code/doc read) or
  `lab-experiment` (needs the running app).
- `experiments.targets`: `web` | `native` | `both`.

## Toolchain notes (prototype harness — verified)

- **pnpm, not npm** (user preference). `pnpm-workspace.yaml` carries
  `nodeLinker: hoisted` — NativeScript's bundler needs a flat `node_modules`
  (rolldown resolves transitive deps like `tslib` through the real tree, not
  pnpm's symlinked `.pnpm` store). `minimumReleaseAgeExclude` there covers the
  octane packages — they're newer than the supply-chain cutoff.
- Workspace deps use `"workspace:*"` (pnpm auto-install-peers fetches bare `*`
  from the registry → 404).
- `apps/native` needs `@valor/nativescript-websockets` — the on-device HMR
  transport that `virtual:entry-with-polyfills` imports in dev.
- iOS native build needs the `xcodeproj` Ruby gem visible to the `ruby` on PATH
  (`gem install --user-install xcodeproj`). `ns doctor` can report OK while the
  hook still fails — verify with `ruby -e 'require "xcodeproj"'`.
- Verified: `vite build` + dev transform on web; `ns build ios` + app boots on
  iPhone 17 Pro sim (`running-active-Visible`, no JS errors).
- `ns run ios` re-boots the sim even when already booted and errors — the
  workaround is `xcrun simctl install/launch` against the existing `.app`.

## Invariants (the short list — full set in docs/architecture.md)

1. One element vocabulary per file; platform divergence at file boundaries
   (`*.web`/`.native`/`.ios`/`.android` suffixes via Vite resolver).
2. Hook-calling code only in `.tsx`/`.tsrx` inside the renderer include glob.
3. One copy of `octane` per app.
4. No DOM globals in shared code.
5. Universal-runtime APIs only in shared code (allowlist produced by Phase 1).
6. Static styles = CSS/`className`; dynamic = `style` objects.
