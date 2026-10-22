---
name: octane-xplat
description: Build or review Octane Xplat apps and framework components across web and NativeScript iOS/Android, with explicit experimental desktop guidance. Use for shared UI, platform leaves, styling, navigation, state, testing, and framework packaging.
---

# Octane Cross-Platform Framework

Build shared screens with Octane and `@octane-xplat/ui`. Web uses the DOM
renderer; iOS/Android use NativeScript through `@nativescript-community/octane`.
Desktop hosts are experimental; choose the actual host before reusing a
platform example. Platform divergence belongs at file boundaries.

## Core constraints

- Use pnpm for project commands. Declare every imported dependency; repository
  workspace dependencies use `"workspace:*"`.
- Keep one Octane runtime per app. Hooks belong in `.tsx`/`.tsrx` inside the
  renderer include glob. Keep runtime imports from `octane`; the native preset
  retargets them. In `.tsrx`, effect dependencies are inferred from closure reads;
  an effect that only writes needs explicit dependencies.
- Octane is not React. Read [Octane semantics](references/octane.md) before
  relying on React habits for hooks, state, context, refs, error boundaries, or
  `children`; native targets accept only a subset of `octane` runtime imports.
- Keep one intrinsic vocabulary per file, with no DOM globals in shared/native
  implementations. Import unsuffixed basenames so the resolver selects the leaf.
  The unsuffixed file is the native default; `.web`, `.mobile`, and OS suffixes
  provide overrides. See [platform leaves](references/platform-leaves.md).
- New apps default to the shared `@octane-xplat/jsx` types. An explicit native
  pragma selects that same facade; browser intrinsic files select
  `@octane-xplat/jsx/dom`. Put a JSX pragma first when present. Types do not select
  the renderer; retain the app's Vite presets.
  Inside `packages/ui`, follow neighboring renderer pragmas for declaration
  emission (for example `@octane-xplat/macos-renderer` on AppKit leaves); UI does
  not depend on the JSX facade package.
- Use CSS/`className` for static styles and style objects for dynamic styles.
  Native authored layout uses `masonview` with layout in the style channel;
  shared components translate their semantic layout props. See
  [styling](references/styling.md) before authoring raw leaves.
- Subscribe at each reader of non-signal module state. `createStore` and
  `useStore` come from `@octane-xplat/ui/data`; a bare `getSnapshot()` read does
  not subscribe. Universal rendering retains unchanged-prop children.
- A module reading a signal's `.get()` during render needs a runtime import from
  `octane/signals`, `octane/signals/client`, or `octane/signals/server`. A named
  signals import suffices; use a bare import when otherwise importing only a
  handle from another module. Type-only imports and `$` names do not enable
  tracking. Keep signal-backed names suffixed `$`.
- Declarative surfaces preserve providers through portals. Native routes inherit
  providers around their mounted route outlet; scoped imperative services use
  providers around their returned element. Ownerless calls retain standalone
  roots. Native host theme inheritance is a separate concern; read the relevant
  ownership reference below.

```tsx
import { Text } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

const packedCount = createStore(0)
export function PackingStatus() {
	const count = useStore(packedCount)
	return <Text>{count} packed</Text>
}
// An app action publishes an update with packedCount.set(nextCount).
```

## Read for the current task

Use the [CLI workflow](references/cli.md) when discovering app context or
operating the app through `xplat`. Exact syntax lives in installed `--help`;
agent commands also provide `--schema`, and `catalog --json` supplies structured
discovery. The skill teaches how to choose and combine them.

Read the relevant topic, then follow deeper links only when their stated
question applies. Read canonical docs in addition to this skill whenever the
task needs API details, prerequisites, migration instructions, or platform
limitations. Do not load the entire reference tree by default.

| Task                                               | Start here                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discover or operate the installed CLI              | [CLI workflow](references/cli.md)                                                                                                                |
| Add app actions for deterministic verification     | [Development actions](references/development-actions.md)                                                                                        |
| Create, run, or upgrade an app                     | [Getting started](references/getting-started.md)                                                                                                 |
| Hooks, state, context, refs, boundaries, children  | [Octane semantics](references/octane.md)                                                                                                         |
| Choose/use a component                             | [Primitives](references/primitives.md)                                                                                                           |
| Implement/debug a native leaf                      | [Driver semantics](references/primitives/driver-semantics.md)                                                                                    |
| Platform filenames, imports, JSX types             | [Platform leaves](references/platform-leaves.md)                                                                                                 |
| CSS, tokens, themes                                | [Styling](references/styling.md); [token definitions](references/styling/tokens.md); [theme across hosts](references/styling/root-boundaries.md) |
| Routes, stacks, loaders                            | [Navigation](references/navigation.md); [Frame internals](references/navigation/native-frames.md) only for native stack debugging                |
| Cached server data and account changes             | [Shared query cache](../../../docs/app/data.md#the-shared-query-cache); define once, observe through `useQuery$`, and dispose/replace clients on account changes; use `runOptimistic` for shared edits so operations retain their leases |
| Shared cursor feeds | [Cached cursor feeds](../../../docs/app/data.md#shared-cursor-feeds); use `defineCursorQuery` and client page operations for cached server pages; set `maxPages` to bound retained pages |
| Paged collection state and tree moves              | [Collection updates](../../../docs/app/data.md#paged-collections-and-tree-moves); retain selection by key, retry failed pages with `loadMore`, and validate tree destinations |
| Dialogs, sheets, overlays                          | [Overlays and ownership](references/overlays.md)                                                                                                 |
| Device services, animation, gestures, localization | [Services](references/services.md)                                                                                                               |
| App tests or framework probes                      | [Testing](references/testing.md)                                                                                                                 |
| Package validation or framework publishing         | [Toolchain](references/toolchain.md)                                                                                                             |
| Promise support or assess a workaround             | [Limits and evidence](references/known-limits.md) before making the claim                                                                        |

## Canonical documentation and scope

For app work, start with [public guides](../../../docs/README.md), declarations
for the installed package version, and the app's own instructions. Use
[installed-version context retrieval](references/cli.md#bind-the-app-and-retrieve-context)
when available; it reports missing snapshots and conflicts instead of silently
substituting latest docs. Use installed help and schemas for command contracts
rather than copying flags from another framework version.

Repository contributors also read [AGENTS.md](../../../AGENTS.md) and its
applicable references. `packages/app`/`packages/demos` and `apps/*` are proving
harnesses; they are not consumer dependencies. Internal guidance lives in
[.agents/docs](../../docs/README.md), decisions in
[.agents/design](../../design/README.md). When extending the framework:

- Keep shared UI prop contracts in `packages/ui/src/props.ts`; an app component
  owns its own props. Platform variants expose identical names and public types.
- Preserve parity and the normalization contract. Prefer Astryx naming/behavior,
  with React Aria as fallback. Update the relevant parity record when equivalents
  change; see [architecture](../../docs/architecture.md).
- UI takes no new dependencies or peers. Features with external engine/plugin
  cost or a separate host lifecycle belong in leaf packages; pure dependency-free
  UI stays in UI. Follow the repository's current decision criteria.
- Run the touched-package/dependents typecheck. For public workflow changes,
  reconcile recipes, docs, maintained examples, and Silo coverage; run
  `pnpm check:recipes`. Follow [documentation coverage](../../docs/documentation.md).
- Verify and record upstream limitations and local workarounds using
  [upstream guidance](../../docs/upstream-limitations.md). Report actual targets
  and evidence; source/build success does not qualify OS input or pixel parity.

## Framework expectation mismatches

Record meaningful mismatches that block work, cause rework, or cost investigation.
Preserve the original expectation and its basis separately from observed behavior
and later diagnosis. Use the project's supplied feedback destination and
[local feedback contract](../../docs/exploration.md#local-framework-feedback);
consumer Silo data is not automatically shared with this repository. Omit secrets
and private application data. `xplat feedback` submits externally immediately:
invoke it only when external submission is explicitly authorized.
