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
observed result and evidence separate from later diagnosis. Record one row
per distinct observation without deduplicating other agents' reports. A
confirmed framework bug is not required.

Use the shared framework Silo table `feedback_observations`. Its observation
fields match `xplat feedback`: `goal`, `expected`, `expectation_basis`,
`actual`, `target`, and `impact`; `evidence` and `workaround` are optional.
Targets are `web`, `ios`, `android`, `macos`, `linux`, `windows`, or
`unknown`; impacts are `blocked`, `rework`, `investigation`, or `surprise`.
Add `framework_ref` and `task_ref` when known; these are local context, not
part of the public report.

Before writing, run `silo context`. The shared inbox belongs to the Git
identity `github.com/octane-xplat/octane-xplat`; a consumer app's default
Silo usually has a different identity. If the app checkout already has a Git
remote pointing to the framework repo, select it with `silo switch <remote>`
and verify the identity before writing. Remember the prior Silo selection and
restore it afterward. Do not use `--move` or add a Git remote just to report
feedback. If the shared identity or table is unavailable, say so in the task
handoff rather than creating an app-local copy or claiming the report was
centrally recorded.

```sh
silo row add feedback_observations <<'JSON'
{
  "goal": "Share a counter between two routed screens",
  "expected": "Both screens would show the updated count",
  "expectation_basis": "The state-sharing documentation example",
  "actual": "The second screen retained the previous value",
  "target": "ios",
  "impact": "investigation",
  "evidence": "The second screen still showed the old count after navigation",
  "workaround": "Read the shared signal from each consuming module"
}
JSON
```

Review reports with `silo query feedback-inbox`. Keep reports concise and
omit secrets, credentials, private application data, repository URLs, and
absolute paths. Silo capture does not submit to the feedback Worker, though
the Silo database may have its own configured sync. Do not invoke
`xplat feedback` unless the task explicitly authorizes external submission.

## Confidence marks

Findings in `docs/` carry evidence types: `desk-source` (read upstream
code) vs `lab-experiment` (measured on a running target). When reporting
what works, match the mark — don't upgrade desk-source claims to tested.
