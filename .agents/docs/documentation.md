# Documentation contracts

This page owns the project's audience, writing, example, declaration, and skill
maintenance rules. The [quality system](documentation-quality.md) owns page
responsibilities, review, checks, and audit practice. Paths in code spans are
relative to the repository root.

## Earn interest and keep momentum

Help readers picture something they want to build and reach a small, visible
success. Ground excitement in working capabilities and useful examples. An
introduction orients and inspires; a tutorial delivers a first result; a task
guide completes a workflow; reference supports lookup. Serve that job for both
humans and coding agents.

Introduce costs, setup, and limitations when they affect the next decision or
action. Phone tooling belongs where readers choose to run on a phone; signing
belongs with release instructions. Keep current instructions distinguishable
from experiments so readers can act with confidence.

## Audience and voice

Write app-building guides for junior engineers and people using coding agents
with no prior programming experience. Assume no React, TypeScript, terminal,
or engineering vocabulary. Explain terms where they become useful, what commands
do, where to run them, and how success looks. Support both coding and asking an
agent to code without making either path mandatory.

Use a friendly, direct voice and concrete actions. Preserve technical names and
support limits; approachable does not mean imprecise. Treat mistakes and recovery
as normal. Keep advanced internals and labeled historical design notes outside
the beginner path.

## Progressive disclosure

Lead with one working path. Link to alternatives, optional setup, and deeper
reference when readers have a reason to choose them. Required prerequisites and
meaningful limits must precede the actions they affect. Do not front-load a
package inventory, glossary, or architecture course.

Ask whether each section is needed for the current step. Move independently
useful tasks to their owning guide; shorter sentences alone do not reduce the
number of ideas a reader must learn.

## Terminology

Explain a project-specific term or unusual meaning in its owning topic. Public
guides introduce unfamiliar language at first use; skill references carry
distinctions that change agent behavior; contributor concepts such as
[recipes](recipes/README.md) belong here. Link to the canonical explanation
instead of maintaining a standalone glossary or duplicate definition table.
Update affected guides and skill guidance together when meaning changes.
Prefer familiar language in [release notes](releases.md#write-a-release-note).

## Show every API capability in code

Every paragraph explaining a function, hook, component, prop, option, or event
needs an adjacent fenced usage snippet, directly before or after it. This applies
to new docs and reviews. A link to another example does not satisfy the rule.

Show the smallest useful, idiomatic use of the actual supported API. Include
imports and definitions, or connect explicitly to setup already on the page;
say where the code belongs. Label continuations/fragments and keep placeholders
syntactically valid. Do not present pseudocode as copyable code.

Validate new or changed snippets with the appropriate parser/compiler/typecheck
in their intended context. Execute checks when the claim requires runtime
behavior, and report the actual targets. Syntax highlighting is not validation.

## Octane skill maintenance

When public APIs or documented behavior change, review affected content in the
[Octane skill](../skills/octane-xplat/SKILL.md), including references, examples,
limitations, and links. Review is mandatory; edit when guidance becomes stale.

Keep information that changes an agent's API choice, implementation, prerequisite,
or avoidance of a consequential mistake. A new export alone needs no skill
prose. Declarations and public docs own exhaustive API facts; Silo/local artifacts
own investigation state and evidence. Skills carry actionable conclusions.

| Location | Owns |
| --- | --- |
| `SKILL.md` | Scope, shared constraints, task routing |
| `references/<topic>.md` | Recommended approach and links for the current task |
| `references/<topic>/<detail>.md` | Narrow platform, advanced, or implementation guidance |

Every reference must be reachable from the entry point or a relevant parent.
Link labels or adjacent text explain when to read it; reading one topic does not
require loading its children. For example, ordinary navigation routes to
`navigation/native-frames.md` only for native stack internals. Keep meaningful
limits and prerequisites beside the guidance they qualify. Replace stale text
before appending more; split by independently useful tasks, not a line limit.
Keep contributor skill-maintenance policy here rather than in consumer guidance.

## Declaration comments

Every public export reachable from a package barrel carries a doc comment beside
its declaration: components, prop interfaces, types, hooks, services, and utilities.
For UI, this includes exports from `props.ts`, `index.shared.ts`, and platform
subpaths. Comments cover applicable contract facts:

- Purpose and owning package/subpath; resolved defaults using `@default`.
- Units: px/DIP, spacing steps (one step = 4 px/DIP), milliseconds, percentages,
  ISO dates/times, Unix seconds versus milliseconds.
- Named platform divergence, unsupported behavior, errors, diagnostics, and
  fallback behavior; prerequisites and related APIs through `@see`.
- A minimal `@example` on composable component props and public operations,
  importing the canonical package path. Validate it with a typecheck.
- For an explicitly retained migration alias, `@deprecated` naming the canonical
  replacement on both declaration and barrel re-export. The alpha cutover rule
  in [AGENTS.md](../../AGENTS.md) still governs whether an alias may exist.

Exclude internal plumbing unless it is part of an exported integration contract.

## Workflow coverage

Before changing public behavior, setup, or a supported workflow, inspect
[recipes](recipes/README.md) by outcome and API. Reconcile the affected recipe,
public docs, maintained example, and skill in the same change. Pure refactors
ordinarily need no recipe change. Never weaken criteria to hide a limitation.

Record coverage separately from verification in Silo `recipe_audit` (or the
appropriate desktop table) and run `bun run check:recipes`. At handoff, name affected
recipes and remaining gaps, or explain why none is affected. A public workflow
change is unfinished until documentation is reconciled and any gap is explicit.
