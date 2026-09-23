# octane-xplat

A single [Octane](https://github.com/octanejs/octane) codebase targeting
**web** (DOM renderer) and **iOS/Android** (via
[`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

**Status: working prototype, published package.** The design docs under
`docs/` are now backed by a running harness that exercises every seam on
all three targets — and by [`@octane-xplat/ui@0.2.0`](https://www.npmjs.com/package/@octane-xplat/ui)
on npm (compiled per-target builds + shipped types).

## The model in one paragraph

One source tree, compiled once per target. Renderer ownership is decided
per file at compile time, so a shared `.tsrx` component compiles under the
DOM renderer in the web build and the NativeScript renderer in the native
build. A file speaks only one element vocabulary, so platform divergence
happens at file boundaries (`Foo.web.tsrx` / `Foo.native.tsrx` /
`Foo.ios.tsrx`) resolved by Vite. Everything shared sits above a
primitives layer (`View`/`Text`/`Pressable`…) whose prop contract lives in
`packages/ui/src/props.ts` — the single source for both platform leaves
and the published `.d.ts`.

## What's proven

| Target | Evidence |
|---|---|
| **Web** | 14/14 Playwright asserts — mounts, state, tabs, real-path routes (`/demos/demo?id=counter`), pushed screens in pane outlets, browser back, deep-link boot |
| **iOS** | 48/48 probe asserts — primitives, gestures, controlled inputs, real `ListView` cells, root + per-tab parallel stacks, modal/sheet/overlay roots, cross-root stores, theme boundaries |
| **Android** | Builds + runs; root nav, overlays, gestures verified. **Nested `Frame` in `TabViewItem` is broken upstream** — [NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444) (named-stack pushes iOS-only for now) |
| **Release** | iOS `--release`, Android signed `--release`, web production dist all verified |

## Layout

| Path | What |
|---|---|
| `packages/ui` | `@octane-xplat/ui` — the framework: primitives, `styled()`, stacks, routes, theme |
| `packages/app` | harness app exercising every seam (nav, overlays, services, probes) |
| `packages/demos` | 10 demo screens used as navigation/store payloads |
| `apps/web`, `apps/native` | entry shells + their vite configs |
| `docs/` | the design record — decisions ledger, domain specs, lab findings |
| `.agents/skills/octane-xplat/` | agent skill — SKILL.md + `references/` distilled for use |

## Commands

```sh
pnpm install                                             # pnpm only — never npm

pnpm test                                                # vitest
node scripts/check-no-dom.mjs                            # seam lint
pnpm exec tsrx-tsc --noEmit -p apps/web/tsconfig.json    # typecheck web
pnpm exec tsrx-tsc --noEmit -p apps/native/tsconfig.json # typecheck native

cd apps/web && pnpm dev                                  # web dev :5200
cd apps/web && pnpm smoke                                # build + 14 browser asserts
cd apps/native && pnpm exec ns build ios                 # native builds
cd apps/native && pnpm exec ns build android
```

## Reading the design

Start at [docs/README.md](docs/README.md) — the tree indexes by domain and
by the seven problems we own: architecture, module resolution, primitives,
styling, navigation, animation/gestures, platform services, toolchain,
testing, decisions ledger, open questions. Findings carry confidence marks
(`desk-source` vs `lab-experiment`).

For agents: `.agents/skills/octane-xplat/SKILL.md` is the entry point —
rules + a `references/` map to everything an agent needs (including
`references/known-limits.md`, the honest gap list).

## Known limits

- Android nested navigation stacks — upstream #11444.
- `.d.ts` can't emit from `.tsrx` (upstream tsrx#136) — we ship emitted
  `props.d.ts` + a thin hand-written shell instead.
- Sheet is native-only (web stub); hardware-back pop-while-pushed is wired
  but verified only logically. Full list:
  [known-limits](.agents/skills/octane-xplat/references/known-limits.md).
