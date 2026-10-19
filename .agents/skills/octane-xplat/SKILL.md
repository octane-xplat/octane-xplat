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
   native leaves must start with `/** @jsxImportSource @octane-xplat/jsx */`
   on line 1. New apps default to this facade; `.web` JSX files start with
   `/** @jsxImportSource @octane-xplat/jsx/dom */`. These select types only;
   the build still selects the existing platform renderer.
3. **Hooks only in `.tsx`/`.tsrx` inside a renderer include glob.** Plain
   `.ts` helpers don't get hook slotting OR forbidden-global validation —
   a hook imported from a `.ts` file binds a second runtime whose
   dispatcher never runs. In `.tsrx`, effects infer deps from closure
   reads; an effect that only writes needs explicit deps.
4. **Static styles = `className`; dynamic = `style` objects.** No inline
   string styles, no `<style>` tags.
5. **Prop types live in `packages/ui/src/props.ts`** — the single source
   for both platform leaves and the published `.d.ts`. New/changed props
   go there, not inline.
6. **Subscribe to shared state and preserve content ownership.** Declarative
   surfaces preserve providers through portals. Native routes use the providers
   around a mounted `RouteOutlet`; scoped imperative services use those around
   their returned element. Ownerless global services and routes without an
   outlet retain standalone roots: pass explicit data or use subscribed
   module-scope stores there. See `references/overlays.md` and
   `references/navigation.md` for ownership and lifetime examples.
   - **Reads subscribe or they go stale.** The universal renderer retains
     unchanged-prop children, so every non-signal store reader calls
     `useStore(store)` (`createStore`/`useStore` are exported from
     `@octane-xplat/ui/data`, not the root barrel) — `store.getSnapshot()`
     is a one-time read.
   - **Signal reads are enabled per module, not per file graph.** A module
     that calls `.get()` during render needs a runtime import from a
     signals entry (`octane/signals`, `/client`, or `/server`) — a named
     import like `signal$`/`useSignal$` satisfies it; the bare
     `import 'octane/signals'` is only needed when the module otherwise
     imports no signals API. A `$` suffix, a type-only import, or a handle
     imported from another file do not enable it. Keep signal-backed names
     suffixed `$`.
7. **The unsuffixed module is the native default.** Add a `.web.ts` sibling
   when browser code imports a native-only module; use `.mobile.ts` for a
   shared iOS/Android override and `.ios.ts`/`.android.ts` for OS-only code.

```tsx
import { useSyncExternalStore } from 'octane'
import { Text } from '@octane-xplat/ui'
import { createStore } from '@octane-xplat/ui/data'

const packedCount = createStore(0)
export function PackingStatus() {
	const count = useSyncExternalStore(
		packedCount.subscribe,
		packedCount.getSnapshot,
		packedCount.getSnapshot,
	)
	return <Text>{count} packed</Text>
}
// Call packedCount.set(nextCount) from an app action to publish a change.
```

## References — read what the task touches

Read only the references needed for the current task. Follow deeper links when
their stated question or condition applies; reading a topic does not require
loading its folder or every linked page. Topic guides cover the usual path;
nested references supply narrower platform, advanced, or implementation detail.

| Task                                    | Read                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Set up / run / build                    | `references/getting-started.md`                                                                                                                   |
| Use or add a component                  | `references/primitives.md` (+ `primitives/driver-semantics.md` for how leaves bind)                                                               |
| Platform file layout, suffixes, imports | `references/platform-leaves.md`                                                                                                                   |
| Styles, tokens, dark mode               | `references/styling.md`; token definitions: `references/styling/tokens.md`; styles across separate roots: `references/styling/root-boundaries.md` |
| navigate/goBack, stacks, routes         | `references/navigation.md` (+ `navigation/native-frames.md` for Frame internals)                                                                  |
| Modal / sheet / overlay                 | `references/overlays.md`                                                                                                                          |
| storage, theme, animation, gestures     | `references/services.md`                                                                                                                          |
| Probe harness, sweeps, smoke            | `references/testing.md`                                                                                                                           |
| Builds, releases, npm publish           | `references/toolchain.md`                                                                                                                         |
| What's broken/unverified                | `references/known-limits.md` — **read this before promising behavior**                                                                            |

## Orientation

- `packages/ui` — the framework (`@octane-xplat/ui` on npm): primitives,
  `styled()`, stacks, routes, theme.
- `packages/app` — the harness app exercising every seam (not a product).
- `packages/demos` — 10 demo screens used as navigation/store payloads.
- `apps/web`, `apps/mobile` — the two entry shells + their vite configs.
- `docs/` — reader-facing app-building guides.
- `.agents/docs/` — internal implementation guidance and notes;
  `.agents/design/` — design decisions, proposals, and research. Skill
  references distill the guidance needed to act; internal records explain why.

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

Internal findings carry evidence types: `desk-source` (read upstream
code) vs `lab-experiment` (measured on a running target). When reporting
what works, match the mark — don't upgrade desk-source claims to tested.
