# Contributing to octane-xplat

Working on the framework itself? Start with [AGENTS.md](AGENTS.md), which maps
the repository and links the working agreements for each kind of task, and the
[design notes](.agents/design/architecture-notes.md).

For meaningful user-facing changes, include a short Markdown
[release note](.agents/docs/releases.md#write-a-release-note) with the change.
Features and breaking changes go in `.changelog/`; bug fixes go in
`.changelog/fixes/`. Internal-only work needs no note. Keep API examples brief,
explain necessary jargon in context, and link to official docs.
Validate pending notes with `bun run check:changelog`.

## Framework workspace commands

Install [Bun 1.4.4](https://bun.com/docs/installation) and the Node version
required by the [toolchain guide](docs/start/toolchain.md#create-and-run).
The repository uses Bun's isolated installs and supports both default and named
`catalog:` references. Root `package.json` owns workspace/catalog/override/patch
settings; `bun.lock` records the resolved dependency graph.

```sh
bun --version
bun install --frozen-lockfile
```

Bun handles development, package tarballs, and consumer checks. Releases upload
Bun tarballs with npm trusted publishing and provenance; npm is only needed by
the release job. pnpm is optional, for a manual patch-compatibility check:

```sh
bun run turbo run test:patches-install --filter=@octane-xplat/cli
```

Run these from the repository root after `bun install --frozen-lockfile`:

Workspace-scoped commands run through Bun/Turbo filters rather than root
aliases; see each app's `package.json` for its full task list.

| Task                                                        | Command                                                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Start the web harness                                       | `bun run --filter @octane-xplat/web dev`                                                                                                 |
| Start the iOS or Android harness                            | `bun run --filter @octane-xplat/mobile ios` or `bun run --filter @octane-xplat/mobile android`                                                   |
| Start the macOS or Windows harness                          | `bun run --filter @octane-xplat/macos dev` or `bun run --filter @octane-xplat/windows windows`                                                   |
| Build a harness target                                      | `bun run turbo run build --filter=@octane-xplat/web`, `bun run --filter @octane-xplat/mobile build:ios`, `bun run --filter @octane-xplat/macos package`, or `bun run --filter @octane-xplat/windows build:windows` |
| Work on the docs site                                       | `bun run --filter @octane-xplat/docs dev` or `bun run turbo run build --filter=@octane-xplat/docs`                                               |
| Build workspace packages                                    | `bun run build:packages`                                                                                                          |
| Build the local `xplat` executable                          | `bun run turbo run build:go --filter=@octane-xplat/cli`                                                                            |
| Run lint and repository checks                              | `bun run check`                                                                                                                   |
| Generate declarations and typecheck every target            | `bun run typecheck`                                                                                                               |
| Run unit, repository-checker, and typegen tests             | `bun run test`                                                                                                                    |
| Run checks, typechecks, and tests in order                  | `bun run validate`                                                                                                                |
| Verify packed UI, GIF, auth, and typegen-fixture consumers  | `bun run test:packed`                                                                                                             |
| Build and browser-smoke the harness or docs                 | `bun run --filter @octane-xplat/web smoke` or `bun run --filter @octane-xplat/docs smoke`                                                        |

`bun install` and `bun run build:packages` skip Go compilation. Use the CLI build
command above to refresh both checkout copies of `bin/xplat.exe`. Local builds
accept stable Go 1.27 patch releases starting at 1.27.3. CI and release builds
use Go 1.27.3.

Per-target typechecks use the same filtered form, for example
`bun run turbo run typecheck --filter=@octane-xplat/web`, `--filter=@octane-xplat/mobile`,
`--filter=@octane-xplat/macos`, `--filter=@octane-xplat/windows`, or `--filter=@octane-xplat/docs`.
Aggregates stop on the first failure; `validate` does not run native builds,
browser smoke, or all packed-consumer checks.

Native launch and build commands require the target's SDK and host tools.
`@octane-xplat/macos package` builds the experimental AppKit app. Browser smoke
commands require Playwright's browser installation. These commands retain the
[existing target limits](docs/start/spec.md#choose-your-targets).
