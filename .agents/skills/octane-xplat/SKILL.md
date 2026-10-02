---
name: octane-xplat
description: Build, test, and ship a single Octane codebase that targets web (DOM renderer) plus iOS/Android via NativeScript and @nativescript-community/octane — primitives, platform leaves, styling, navigation, overlays, services, testing, toolchain, and publish model. Use when writing or reviewing app code, adding components/screens, debugging platform divergences, or publishing @octane-xplat/ui.
---

# Octane Cross-Platform Framework

One Octane codebase, three targets: **web** (Octane DOM renderer) and
**iOS/Android** (NativeScript via `@nativescript-community/octane`'s
universal-runtime driver over `@nativescript/core`). Platform divergence
lives at **file boundaries** — `.web` for browser code, `.mobile` for shared
iOS/Android differences, OS-specific suffixes, and the unsuffixed native default.

## The rules that can't bend

1. **No npm.** pnpm for everything.
2. **No DOM globals in shared/native code.** `check:no-dom` enforces it;
   native leaves must start with `/** @jsxImportSource @nativescript-community/octane */`
   on line 1 — nothing may precede it, including imports.
3. **Hooks only in `.tsx`/`.tsrx` inside a renderer include glob.** Plain
   `.ts` helpers don't get hook slotting OR forbidden-global validation.
4. **Static styles = `className`; dynamic = `style` objects.** No inline
   string styles, no `<style>` tags.
5. **Prop types live in `packages/ui/src/props.ts`** — the single source
   for both platform leaves and the published `.d.ts`. New/changed props
   go there, not inline.
6. **Cross-root state uses module-scope stores** (`useSyncExternalStore`).
   A class or context on one root never reaches another root (pushed
   pages, modals, sheets are separate trees on native).
7. **The unsuffixed module is the native default.** Add a `.web.ts` sibling
   when browser code imports a native-only module; use `.mobile.ts` for a
   shared iOS/Android override and `.ios.ts`/`.android.ts` for OS-only code.

```tsx
import { useSyncExternalStore } from 'octane'
import { createStore, Text } from '@octane-xplat/ui'

const packedCount = createStore(0)
export function PackingStatus() {
	const count = useSyncExternalStore(packedCount.subscribe, packedCount.get, packedCount.get)
	return <Text>{count} packed</Text>
}
// Call packedCount.set(nextCount) from an app action to publish a change.
```

## References — read what the task touches

| Task                                    | Read                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Set up / run / build                    | `references/getting-started.md`                                                     |
| Use or add a component                  | `references/primitives.md` (+ `primitives/driver-semantics.md` for how leaves bind) |
| Platform file layout, suffixes, imports | `references/platform-leaves.md`                                                     |
| Styles, tokens, dark mode               | `references/styling.md` (+ `styling/tokens.md`, `styling/root-boundaries.md`)       |
| navigate/goBack, stacks, routes         | `references/navigation.md` (+ `navigation/native-frames.md` for Frame internals)    |
| Modal / sheet / overlay                 | `references/overlays.md`                                                            |
| storage, theme, animation, gestures     | `references/services.md`                                                            |
| Probe harness, sweeps, smoke            | `references/testing.md`                                                             |
| Builds, releases, npm publish           | `references/toolchain.md`                                                           |
| What's broken/unverified                | `references/known-limits.md` — **read this before promising behavior**              |

## Orientation

- `packages/ui` — the framework (`@octane-xplat/ui` on npm): primitives,
  `styled()`, stacks, routes, theme.
- `packages/app` — the harness app exercising every seam (not a product).
- `packages/demos` — 10 demo screens used as navigation/store payloads.
- `apps/web`, `apps/mobile` — the two entry shells + their vite configs.
- `docs/` — the full design record (decisions ledger, exploration notes).
  References here are distilled for use; `docs/` is the why.

## Report framework expectation mismatches

While using Octane Xplat in a consumer app, record meaningful mismatches that
block the task, cause rework, require a workaround, or cost investigation.
Capture what you expected and why before investigating further; keep the
observed result and evidence separate from later diagnosis. Record one report
per distinct observation without deduplicating other agents' reports. A
confirmed framework bug is not required.

Use the observation shape from `xplat feedback`: `goal`, `expected`,
`expectation_basis`, `actual`, `target`, and `impact`; `evidence` and
`workaround` are optional.
Targets are `web`, `ios`, `android`, `macos`, `linux`, `windows`, or
`unknown`; impacts are `blocked`, `rework`, `investigation`, or `surprise`.

```json
{
	"goal": "Render a saved packing count",
	"expected": "A shared-state update appears in each screen",
	"expectation_basis": "The store subscription guide",
	"actual": "The second screen retained its earlier count",
	"target": "ios",
	"impact": "investigation"
}
```

Use that observation shape when the task or project instructions provide a
feedback destination. Follow those instructions for local Silo routing; a
consumer app's Silo may not be shared with the framework repository. Do not
assume a local write is centrally visible. Keep reports concise and omit
secrets, credentials, private application data, repository URLs, and absolute
paths. The `xplat feedback` command submits to its configured endpoint
immediately, so invoke it only when the task explicitly authorizes external
submission.

## Confidence marks

Findings in `docs/` carry evidence types: `desk-source` (read upstream
code) vs `lab-experiment` (measured on a running target). When reporting
what works, match the mark — don't upgrade desk-source claims to tested.
