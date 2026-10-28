# Documentation audit: October 2026

The collection has substantial technical knowledge, but too many pages make
readers assemble the instructions themselves. That is what makes it feel
unfinished: an example exists, yet the reader still has to supply setup,
missing names, lifecycle decisions, or a way to recognize success.

This audit covered the 55 public guides, the repository front door, and all
80 package directories. At the start, 78 packages had READMEs. The whole corpus
received an inventory, structure/link checks, and supported-language syntax
checks. Close editorial review concentrated on onboarding, package entry
points, small service READMEs, flagged examples, and the organization of the
largest guides. This is not a claim that every paragraph or every platform
workflow was requalified. No visual analysis was performed.

## What made the docs feel undercooked

| Problem                                              | Evidence at the start                                                                                                                                  | Cost to the reader                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| The page assumes someone already wants the package   | 34 package READMEs opened with installation before explaining the package                                                                              | Readers cannot judge whether the dependency solves their problem               |
| Examples are often sketches presented as usable code | Ads called load and show together; maps used undefined inputs and malformed JSX; workshop showed bare object fields; motion examples mislabeled TSRX   | Copying the example becomes an investigation                                   |
| Examples miss the whole lifecycle                    | Haptics reused an engine after disposal; billing granted every purchase without checking its state; several services ignored denied permission results | Readers copy incorrect sequencing and ownership                                |
| Consumer and contributor writing are mixed           | READMEs lead with engine internals or test history; MCP had a “work item D” heading; UI linked to obsolete route shapes                                | Readers must understand the repository before using the package                |
| Coverage is uneven                                   | Charts and smooth-corners had no README; 21 existing READMEs had no links                                                                              | Packages look abandoned or leave readers at a dead end                         |
| Navigation is accidental                             | Eight guides lacked the purpose summary used by the agent index; 12 pages lacked a curated reading-order entry                                         | New work exists but is harder to discover and understand                       |
| Long pages accumulate separate jobs                  | Navigation had 2,363 lines, screen primitives 2,327, data 1,383, and motion 1,318                                                                      | Learning a first task competes with advanced reference and platform evidence   |
| Claims outpace evidence                              | The homepage promised “elite performance”; maps inferred identical behavior from one provider; AppKit setup repeated old probe versions                | Readers cannot tell a supported workflow from an aspiration or historical test |
| Review is not preserved as a repeatable check        | Recipe validation covered recipe links, not all public docs; the docs build did not hash the external Markdown corpus                                  | A previous successful audit or cached build can conceal later drift            |

The strongest pages already explain a task, show a small example, and tell
readers what happens next. The first-app guide's setup and recovery steps are
a useful model. The answer is to apply that discipline consistently, while
letting reference pages remain concise lookup material.

## The maintenance system

The [quality system](documentation-quality.md), referenced by
[AGENTS.md](../../AGENTS.md), turns the existing writing guidance into a
maintenance loop:

1. Each document has a reader job and a canonical area of responsibility.
2. Authors and reviewers assess purpose, path, examples, truth, explanation,
   and navigation. These are judgments, not a numerical score or rigid template.
3. Changes to APIs, setup, or platform support trigger review of the owning
   README, guide, recipe, maintained example, and skill guidance together.
4. Automated checks enforce structural and syntax facts in local checks and
   CI. The docs build tracks the Markdown that it publishes.
5. Release reviews and a monthly topic rotation revisit reader journeys;
   Silo records review depth, findings, revisions, and verification separately.

This keeps factual checks cheap without pretending software can judge whether
an explanation teaches well. No new dependencies or browser jobs are needed.

## Refinements applied

- Replaced unsupported homepage claims and the UI README's obsolete examples
  with concrete, complete introductions and observable results.
- Added charts and smooth-corners READMEs with installation, small examples,
  expected results, and platform boundaries.
- Reworked small service READMEs around a usable first task. Clarified external
  setup, supplied inputs, permission results, purchase verification, and cleanup.
- Repaired syntax errors and mislabeled code fences. Corrected the disposed
  haptics sequence, the workshop counter's incorrect store updater, and moved
  native gesture prerequisites ahead of drag usage.
- Put package explanations before installation and made public README links
  usable outside the monorepo. Replaced stale docs-site URLs and version advice.
- Added missing guide summaries and deliberate navigation order. Moved menu
  and table guides into the app section while preserving their flat site URLs
  and updating repository links, recipes, and skill references.
- Added task entry points to long guides. Moved localization internals,
  desktop-host protocol detail, and workshop qualification history out of the
  first-use path without removing their support boundaries.
- Added maintained structure/link and example-syntax checks with regression
  tests, wired them into repository checks and CI, and fixed docs cache inputs.

## Boundaries and next priorities

Syntax checks cover TS, TSX, TSRX, JS, JSX, JSON, JSONC, and YAML. They do not
prove that every fragment resolves imports, satisfies its API types, or produces
its claimed result. Package typechecks and docs build/tests provide separate
evidence; neither establishes native input, accessibility, cloud-service setup,
or device behavior. External website availability was not swept.

The largest remaining editorial opportunity is to split independently useful
advanced workflows out of navigation and screen primitives, retaining stable
links. The new task entry points improve access now; a split should follow
actual reader tasks rather than a line-count target. Provider-backed packages
also need maintained, runnable setup journeys before their examples can be
treated as end-to-end integration evidence.

Affected recipe references include shared menus, motion patterns, interactive
actions, and the MCP consumer workflow. Their acceptance criteria remain
unchanged. Link and example repairs do not upgrade historical runtime evidence
or imply that every criterion has newly complete coverage.
