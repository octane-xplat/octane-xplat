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

pnpm 11.24.0 remains necessary for packed-consumer checks and publishing with
provenance. The generated `pnpm-workspace.yaml` exists for that packaging path;
use Bun to install the repository. After changing root workspace patterns or
catalogs, regenerate its packaging metadata and verify patches:

```sh
bun run sync:workspace
bun run check:workspace
bun run check:patches
```

Run these from the repository root after `bun install --frozen-lockfile`:

| Task                                                       | Command                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Start a harness target                                     | `bun run dev:web`, `dev:ios`, `dev:android`, `dev:macos`, `dev:linux`, or `dev:windows` |
| Build a harness target                                     | `bun run build:web`, `build:ios`, `build:macos`, `build:linux`, or `build:windows`      |
| Work on the docs site                                      | `bun run dev:docs` or `bun run build:docs`                                                 |
| Build workspace packages                                   | `bun run build:packages`                                                                |
| Run lint and repository checks                             | `bun run check`                                                                         |
| Generate declarations and typecheck every target           | `bun run typecheck`                                                                     |
| Run unit, repository-checker, and typegen tests            | `bun run test`                                                                          |
| Run checks, typechecks, and tests in order                 | `bun run validate`                                                                      |
| Verify packed UI, GIF, auth, and typegen-fixture consumers | `bun run test:packed`                                                                   |
| Build and browser-smoke the harness or docs                | `bun run smoke:web` or `bun run smoke:docs`                                                |

Individual `typecheck:web`, `typecheck:mobile`, `typecheck:macos`,
`typecheck:linux`, `typecheck:windows`, and `typecheck:docs` commands are also
available. Aggregates stop on the first failure; `validate` does not run
native builds, browser smoke, or all packed-consumer checks.

Native launch and build commands require the target's SDK and host tools.
`build:macos` packages the experimental AppKit app. Browser smoke commands
require Playwright's browser installation. These shortcuts retain the
[existing target limits](docs/start/spec.md#choose-your-targets).
