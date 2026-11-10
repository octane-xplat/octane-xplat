# AGENTS.md

Octane-xplat is a shared Octane framework targeting web, iOS/Android, and desktop
platforms. `packages/ui` and `packages/cli` ship on npm; the apps and demos are
our proving harness. [Repository orientation](.agents/docs/repository.md) maps
the packages and documentation. Internal implementation notes live in
[`.agents/docs/`](.agents/docs/README.md); design records live in
[`.agents/design/`](.agents/design/README.md).

## Workspace placement

Choose a workspace's directory by its primary purpose:

- `apps/` contains runnable UI applications: platform hosts, websites, sandboxes,
  and demo or test apps that exercise real screens and app flows.
- `tools/` contains private repository tooling and supporting services: comparison
  runners, visual regression tooling, feedback collection, and update distribution.
  Embedded UI fixtures do not make a tool an app.
- `packages/` contains reusable framework libraries and distributable developer
  tools, such as the published CLI.

Keep new operational services and verification runners in `tools/`, even when
they have a development server or deployment command. Keep package names stable
when moving existing workspaces so package-name filters continue to work.

## Script ownership

Root `package.json` scripts are for repository-wide checks, aggregate workflows,
and installation lifecycle tasks. Commands scoped to one app, package, or tool
belong in that workspace's manifest; their implementations belong beside the
owner. Use filtered Turbo tasks for builds, tests, and typechecks rather than
adding root aliases. Keep cross-workspace verification runners under `tools/`.
Add a root convenience alias only when it serves an established repository-wide
workflow, such as `probe`.

## Agent material

Keep `.agents/` for guidance and durable memory: skills, contributor rules,
recipes, decisions, and investigation conclusions. Plans are maintained elsewhere.
Put reusable executable fixtures, audit runners, and patch sources under `tools/`
(or their owning package). Keep operational state in Silo and raw reports,
inventories, logs, and captures in ignored local storage; do not commit them.
Guidance carries durable conclusions and lookup instructions, not run histories.
Repository formatters and linters ignore `.agents/`; documentation and recipe
checks still validate their respective contracts.

Maintain agent guidance in the same change that alters the behavior it describes.
When adding or revising material:

- Update the canonical note instead of duplicating guidance or appending dated
  checkpoints. Keep content that changes a future decision or prevents a
  consequential mistake; link to declarations and public docs for API detail.
- Consolidate or remove superseded material, preserving unique conclusions and
  any needed evidence in the appropriate durable or local store.
- Organize by task. Keep entry points concise and move conditional detail behind
  links that explain when to read it. Keep prerequisites and limits beside the
  guidance they qualify; do not require loading the whole reference tree.
- Keep every reference reachable from an entry point or relevant parent. Repair
  indexes and inbound links after moves or pruning, review changed guidance for
  stale claims and duplication, and run the applicable documentation/recipe checks.

## Prior-art research

External-system studies live in the private
[prior-art repository](https://github.com/octane-xplat/prior-art/blob/main/README.md).
Consult the relevant study before researching an external system. Update the
canonical study when new evidence changes its findings; keep our decisions,
implementation contracts, and upstream limitations in this framework repository.

Use an existing local clone, by default `~/dev/prior-art`, outside framework
worktrees. If it is absent and you have private-repository access, clone it:

```sh
gh repo clone octane-xplat/prior-art ~/dev/prior-art
```

Read that repository's `AGENTS.md` before editing. Commit research independently
from framework changes; cite a specific research commit when a framework decision
relies on its findings. Keep discovery links pointed at the current index.
Do not copy private notes into public artifacts. Framework guidance must remain
usable without private access; if access is unavailable, state that limitation
and continue from accessible evidence. Normal builds, tests, and CI do not need
this clone.

## Read what applies

Read the relevant reference before acting in that area. These files carry the
working agreements and detail moved out of this entry point.

| Task                                                     | Reference                                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Locate packages, harnesses, or design records            | [Repository orientation](.agents/docs/repository.md)                                                                                         |
| Find source, callers, or change impact                   | [Source context](.agents/docs/source-context.md)                                                                                             |
| Implement components or platform variants                | [Implementation invariants](.agents/docs/architecture.md)                                                                                    |
| Build, install dependencies, patch upstream, or lint     | [Toolchain](.agents/docs/toolchain.md)                                                                                                       |
| Use shared hosts or create temporary host artifacts      | [Temporary host files](.agents/docs/host-artifacts.md)                                                                                       |
| Investigate one case or add lasting test coverage        | [Probes and tests](.agents/docs/testing.md)                                                                                                  |
| Write or review docs; change public behavior or setup    | [Documentation audience and coverage](.agents/docs/documentation.md)                                                                         |
| Audit or maintain public docs and package READMEs        | [Documentation quality system](.agents/docs/documentation-quality.md)                                                                        |
| Explore a seam, record evidence, or update decisions     | [Exploration and Silo](.agents/docs/exploration.md)                                                                                          |
| Record upstream limitations or local workarounds         | [Upstream limitations](.agents/docs/upstream-limitations.md)                                                                                 |
| Plan Coreframe's role on Xplat or an app migration       | [Coreframe role](.agents/docs/coreframe-role.md)                                                                                             |
| Extract Mason core or change MasonKit package boundaries | [Mason core extraction design](.agents/design/mason-core-extraction.md)                                                                      |
| Work with Octane signals                                 | Read the [upstream signals guide](https://raw.githubusercontent.com/octanejs/octane/refs/heads/main/docs/signals.md)                         |
| Add or publish a package                                 | [Releases](.agents/docs/releases.md)                                                                                                         |
| Prepare a release, packaging change, or docs deployment  | [Releases](.agents/docs/releases.md)                                                                                                         |
| Write release notes or explain new terminology           | [Release-note authoring](.agents/docs/releases.md#write-a-release-note); [terminology in context](.agents/docs/documentation.md#terminology) |

## Framework principles

Standing criteria for judgment calls; the critical rules encode the mechanics.

- **Alpha means hard cutovers.** While the framework is in alpha pre-release,
  backward compatibility is not a goal. Hard cutovers without advance warning
  are the norm. Remove replaced APIs and behavior; do not add compatibility
  aliases, shims, or deprecation periods unless explicitly requested. Mark
  breaking commits with `!` in the Conventional Commit header.
- **Parity first.** Strive for identical behavior and pixel parity across
  platforms. Where parity is genuinely unachievable, expose platform entry
  points or an explicitly documented API subset with matching behavior —
  never silent divergence.
- **Astryx over React Aria.** When an API exists in both
  [Astryx](https://github.com/facebook/astryx/tree/main/packages/core/src)
  and React Aria, match Astryx's naming and behavior; React Aria is the
  fallback reference. Track React Aria coverage in Silo's
  `react_aria_parity` table — update it when equivalents land or change.
- **Cross-platform by default.** New features and packages should aim to
  support every project platform. When feasibility is unclear, investigate
  and prove support in this order: web, iOS, then macOS. If any platform cannot
  be supported, document the concrete feasibility evidence and the specific
  limitation.
- **Proven engines first.** Build on proven engines and libraries; treat
  from-scratch implementation as a last resort — but reject dependencies
  whose abstractions fundamentally mismatch Octane Xplat's model.
- **Keep upstream limitations visible.** Do not silently work around a
  limitation in Octane, NativeScript, `@nativescript-community/octane`, or
  another upstream dependency. Verify and record its scope, evidence, and any
  local workaround in the relevant `.agents/docs/` note, following the
  [upstream limitations guidance](.agents/docs/upstream-limitations.md), so
  local behavior is not mistaken for upstream support.
- **Study the ecosystem.** Learn from successful React Native packages and
  competing frameworks; borrow architecture that fits these principles, and
  respect attribution and licensing.
- **Evidence before commitment.** Resolve unknowns and prove feasibility with
  probes and smoke tests before committing to an architecture; keep
  source/build evidence distinct from actual platform behavior.

## Critical rules

- Factory modules export named result type aliases. Consumers import those
  types instead of applying `ReturnType` to imported factory functions; keep
  inferred `ReturnType` aliases beside the factory that owns them.
- Prefer narrowing, annotations, and owning declarations over inline
  `as { ... }` object assertions. Branch on a union's distinguishing property;
  preserve a producer's generic instead of re-asserting it; annotate the
  owning state/ref; validate genuinely untrusted input once at ingress and
  bound it to a named type. A runtime conversion TypeScript cannot express
  keeps one explicit documented assertion — never hide it behind `as any`,
  a helper alias, or a broad generic.
- Before merging, run `turbo run typecheck --filter=...@octane-xplat/<package>`
  for every package you touched. The filter includes that package and its
  dependents; do not typecheck unrelated packages.
- Run builds, tests, and typechecks through `turbo run <task> --filter=<pkg>`
  rather than raw package scripts (`bun run --filter <pkg> <script>`,
  `node --test`, per-package `build`). Turbo task deps are the on-demand
  ordering mechanism — `//#submodules` initializes vendor checkouts and
  `^typegen`/`^build` produce generated types and dists first. Raw commands
  skip all of that and fail on missing vendor sources or dist outputs.
- Use **Bun 1.4.4** for repository installs and scripts. Use npm only to publish Bun tarballs with provenance; pnpm is optional for
  manual patch compatibility qualification. Declare every imported dependency; workspace dependencies
  use `"workspace:*"`. `packages/ui` takes **no new external dependencies or peers** (internal workspace packages are fine);
  plugin-backed features belong in leaf packages. A leaf package is warranted
  when a feature owns an external cost or a separate system lifecycle — a
  native plugin, a JS engine dependency, or platform host machinery (decisions
  #51, #53, #54, #60, #70, #72). Niche but pure-UI, dependency-free component
  APIs (e.g. the Chat family, PowerSearch) stay in `ui`; don't extract them
  on API-scope grounds alone.
- Every non-private `packages/*/package.json` is included in the automated
  lockstep release. Mark fixtures/private workspaces `"private": true`. For a
  publishable package, set `repository.url` exactly to
  `https://github.com/octane-xplat/octane-xplat` and `repository.directory` to
  its `packages/<dir>` path. Follow the release reference for the one-time npm
  stub and trusted-publisher setup.
- Node ≥22.18 runs `.ts` directly via type stripping — in-repo tooling may
  execute TypeScript source (`node --test`, dev scripts, bin stubs) with no
  build step. Keep to erasable syntax: no enums, namespaces, or parameter
  properties. Published packages still emit JavaScript (`dist/`) — Node
  refuses type stripping inside `node_modules` and consumer runtimes may be
  older.
- Put platform divergence at file boundaries. Keep one element vocabulary per
  file, no DOM globals or web-only runtime APIs in shared code, and identical
  exports/public types across platform variants. Keep shared props in `props.ts`.
- Hook-calling code belongs in `.tsx`/`.tsrx` inside the renderer include glob.
  Keep one copy of `octane` per app. Native app bundlers must retarget source
  imports of `octane` to the universal/native runtime.
- Use CSS/`className` for static styles and style objects for dynamic styles.
  Follow the shared UI normalization contract; platform-authentic widgets use
  matching platform subpaths. Read the implementation reference before UI work.
- Keep signal-backed names suffixed with `$`. Non-signal module state needs
  `useStore` per reader on native; an unchanged-prop child is not re-rendered
  just because its parent renders.
- For a single investigation, use `bun run probe doctor` and
  `bun run probe run <case> --target <target> --watch`. Probes are temporary by
  default (`research/`); promote behavior we must preserve into maintained tests.
  The runner and `examples/probes/` are permanent tooling fixtures. Windows is
  excluded from this runner.
- Report the targets actually run and distinguish source/build evidence from
  runtime evidence. Handler dispatch does not prove OS input or hit-testing.
- Write app-building docs for junior engineers and people using coding agents
  with no prior programming experience. Explain terms and steps, lead with a
  small visible result, and use a friendly, concrete voice. Follow the
  [documentation guidance](.agents/docs/documentation.md). Use progressive
  disclosure: teach what the current step needs and link to optional detail.
  Earn readers' interest and preserve their excitement: show what they can
  build, then explain costs and limits when they affect the next step.
  Every paragraph explaining an API capability needs an adjacent code snippet
  showing its use; snippets must be syntactically valid and idiomatic.
- Public workflow changes must reconcile recipes, docs, and maintained examples;
  record coverage separately from verification in Silo and run
  `bun run check:recipes`. Never weaken criteria to conceal a limitation. Report
  affected recipes and remaining gaps at handoff, or why none is affected.
- Maintain public guides and package READMEs with the
  [documentation quality system](.agents/docs/documentation-quality.md): review
  the reader's path, reconcile canonical guidance, and run `bun run check:docs`
  and `bun run check:doc-examples`. Mechanical checks do not replace reviewing
  setup, API correctness, lifecycle, platform claims, and observable results.
- When public APIs or documented behavior change, review the affected guidance
  in [the Octane skill](.agents/skills/octane-xplat/SKILL.md), including its
  references, examples, limitations, and links. Update stale information in the
  same change. Add guidance when it changes an agent's decisions or prevents a
  consequential mistake; preserve task-based progressive disclosure using the
  [skill maintenance guidance](.agents/docs/documentation.md#octane-skill-maintenance).
- Log meaningful expectation mismatches in Silo's `feedback_observations` when
  they happen; keep reports local and preserve the original expectation. See
  [local feedback](.agents/docs/exploration.md#local-framework-feedback).
- Silo is shared across worktrees. Update natural keys in place; allocate new
  decision numbers in Silo **before** writing the decision ledger. Never remove
  another worktree's in-flight rows to satisfy a local check.
- Proceed autonomously within scope and commit completed work in focused
  Conventional Commits. Docs carry conclusions; Silo carries exploration state.
- Select release notes by user impact, not commit count. Add `.changelog/*.md`
  for meaningful user-facing features and breaking changes, or
  `.changelog/fixes/*.md` for user-facing fixes to bugs a stable release
  already shipped — a fix for an unreleased bug needs no note. Follow the
  [authoring contract](.agents/docs/releases.md#write-a-release-note): concise
  plain language, a minimal usage/fix snippet for API changes, and official
  documentation links. Internal-only work needs no note. Conventional Commits
  determine versions; the Markdown files determine release notes.
- In pending `.changelog/**/*.md` entries, keep each prose paragraph on one
  source line; do not insert soft line breaks to wrap text. Preserve blank
  lines between paragraphs and structural line breaks in code fences, lists,
  tables, and YAML headers.
- `CHANGELOG.md` and `FIXLOG.md` are assembled at release time. Do not edit
  them during feature/fix work. Explain project-specific terms and unusual
  meanings in their owning topic, following [terminology guidance](.agents/docs/documentation.md#terminology).
  Keep agent-facing distinctions in the relevant skill reference and repository
  concepts in `.agents/docs/`; do not maintain a standalone glossary. Prefer
  familiar words in release notes.
- PR CI stays lightweight: the `checks` job must not install browser engines
  (Playwright/Chromium) or run device emulation. Browser-driven tests
  (`@xplat/visual`, workshop's `test:packed`, `verify-consumer` smoke,
  `optional-services` browsers) are excluded or flagged there — keep them
  out of the PR gate and run them locally.

<!-- graft:start -->

## Source context first

Before searching or opening unfamiliar source, consult the graph:
`graft ask "<question>" --source` (`graft map` for initial orientation).
Use `graft grep` for exhaustive searches, `graft callers` for structural edges,
and open truncated spans before finalizing. Refresh with `graft build` after
big code changes. See [source context](.agents/docs/source-context.md) for details.

<!-- graft:end -->
