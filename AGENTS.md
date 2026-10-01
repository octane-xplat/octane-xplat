# AGENTS.md

Octane-xplat is a shared Octane framework targeting web, iOS/Android, and desktop
platforms. `packages/ui` and `packages/cli` ship on npm; the apps and demos are
our proving harness. [Repository orientation](.agents/docs/repository.md) maps
the packages and design records.

## Read what applies

Read the relevant reference before acting in that area. These files carry the
working agreements and detail moved out of this entry point.

| Task | Reference |
| --- | --- |
| Locate packages, harnesses, or design records | [Repository orientation](.agents/docs/repository.md) |
| Find source, callers, or change impact | [Source context](.agents/docs/source-context.md) |
| Implement components or platform variants | [Implementation invariants](.agents/docs/architecture.md) |
| Build, install dependencies, patch upstream, or lint | [Toolchain](.agents/docs/toolchain.md) |
| Investigate one case or add lasting test coverage | [Probes and tests](.agents/docs/testing.md) |
| Change public behavior, setup, or a supported workflow | [Documentation coverage](.agents/docs/documentation.md) |
| Explore a seam, record evidence, or update decisions | [Exploration and Silo](.agents/docs/exploration.md) |
| Work with Octane signals | Read the [upstream signals guide](https://raw.githubusercontent.com/octanejs/octane/refs/heads/main/docs/signals.md) |
| Prepare a release, packaging change, or docs deployment | [Releases](.agents/docs/releases.md) |

## Critical rules

- Use **pnpm**, not npm. Declare every imported dependency; workspace dependencies
  use `"workspace:*"`. `packages/ui` takes **no new dependencies or peers**;
  plugin-backed features belong in leaf packages.
- Put platform divergence at file boundaries. Keep one element vocabulary per
  file, no DOM globals or web-only runtime APIs in shared code, and identical
  exports/public types across platform variants. Keep shared props in `props.ts`.
- Hook-calling code belongs in `.tsx`/`.tsrx` inside the renderer include glob.
  Keep one copy of `octane` per app. Native dist must not import bare `octane`.
- Use CSS/`className` for static styles and style objects for dynamic styles.
  Follow the shared UI normalization contract; platform-authentic widgets use
  matching platform subpaths. Read the implementation reference before UI work.
- Keep signal-backed names suffixed with `$`. Non-signal module state needs
  `useStore` per reader on native; an unchanged-prop child is not re-rendered
  just because its parent renders.
- For a single investigation, use `pnpm probe doctor` and
  `pnpm probe run <case> --target <target> --watch`. Probes are temporary by
  default (`research/`); promote behavior we must preserve into maintained tests.
  The runner and `examples/probes/` are permanent tooling fixtures. Windows is
  excluded from this runner.
- Report the targets actually run and distinguish source/build evidence from
  runtime evidence. Handler dispatch does not prove OS input or hit-testing.
- Public workflow changes must reconcile recipes, docs, and maintained examples;
  record coverage separately from verification in Silo and run
  `pnpm check:recipes`. Never weaken criteria to conceal a limitation. Report
  affected recipes and remaining gaps at handoff, or why none is affected.
- Log meaningful expectation mismatches in Silo's `feedback_observations` when
  they happen; keep reports local and preserve the original expectation. See
  [local feedback](.agents/docs/exploration.md#local-framework-feedback).
- Silo is shared across worktrees. Update natural keys in place; allocate new
  decision numbers in Silo **before** writing the decision ledger. Never remove
  another worktree's in-flight rows to satisfy a local check.
- Proceed autonomously within scope and commit completed work in focused
  Conventional Commits. Docs carry conclusions; Silo carries exploration state.
- `CHANGELOG.md` is generated. Do not edit it during feature/fix work; commit
  messages are the changelog source.

<!-- graft:start -->

## Source context first

Before searching or opening unfamiliar source, consult the graph:
`graft ask "<question>" --source` (`graft map` for initial orientation).
Use `graft grep` for exhaustive searches, `graft callers` for structural edges,
and open truncated spans before finalizing. Refresh with `graft build` after
big code changes. See [source context](.agents/docs/source-context.md) for details.

<!-- graft:end -->
