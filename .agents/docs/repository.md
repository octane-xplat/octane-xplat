# Repository orientation

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

A single [Octane](https://github.com/octanejs/octane) codebase targeting web
(DOM renderer) + iOS/Android
([`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

The framework exists and is published: `packages/ui` ships as
`@octane-xplat/ui` on npm, `packages/cli` as `@octane-xplat/cli` (dev/build/
doctor/typecheck). `packages/app` + `apps/web` + `apps/mobile` are the probe
harness; `packages/demos` the seam-by-seam demo screens. `docs/` contains
app-building guides alongside the contributor design record. Follow the
[documentation audience guidance](documentation.md#audience-and-voice) when
writing or reviewing the guides.

## Layout

| Path                                                                     | What it is                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/`                                                                  | App-building guides grouped in `start/`, `app/`, `platform/`, and `verify/`. Begin at `docs/README.md`; contributor and historical records are indexed in `docs/notes/README.md`.                 |
| `packages/macos-renderer`                                                | Experimental `@octane-xplat/macos-renderer`: AppKit driver, JSX types, and compatibility shims. `apps/macos` owns its host and consumes this package.                                             |
| `packages/ui`                                                            | The framework — `@octane-xplat/ui` on npm. Primitives, styled(), stacks, routes, theme. Prop types in `src/props.ts`.                                                                             |
| `packages/cli`                                                           | `@octane-xplat/cli` — `xplat` dev/build/doctor/typecheck/clean commands.                                                                                                                          |
| `packages/app`, `packages/demos`                                         | Probe harness app + seam-by-seam demo screens.                                                                                                                                                    |
| `apps/web`, `apps/mobile`                                                | Entry shells + vite configs for the harness.                                                                                                                                                      |
| `packages/create`, `packages/platform`                                   | Project scaffolder; platform services seam.                                                                                                                                                       |
| `packages/gif`, `packages/canvas`, `packages/effects`, `packages/lottie` | Leaf packages — features that need a NativeScript plugin ship here, declaring the plugin as a real `dependency` (decision #51).                                                                   |
| `.agents/references/`                                                    | Agent-facing index of external implementations to compare against; patterns are references, not adoption or dependency decisions.                                                                 |
| `prior-art/`                                                             | Other people's systems — substrate (`octane`, `nativescript-octane`, `nativescript-core`) and precedents (`one`, `tamagui`, `react-native-web`, `flutter`). Documents here are never commitments. |
| `docs/notes/decisions.md`                                                | Decision ledger, `#`-numbered, statuses: forced / decided / provisional / rejected. Reversals get dated notes, not edits.                                                                         |
| `docs/notes/open-questions.md`                                           | Unverified seams, `Q`-numbered, ranked by blast radius.                                                                                                                                           |
| `research/`                                                              | Gitignored clones of upstream repos for source interrogation. Not shipped, not authoritative — cite upstream files in docs instead.                                                               |
| Silo                                                                     | Git-scoped SQLite tracking the exploration state (see below).                                                                                                                                     |
