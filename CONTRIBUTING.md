# Contributing to octane-xplat

Working on the framework itself? Start with [AGENTS.md](AGENTS.md), which maps
the repository and links the working agreements for each kind of task, and the
[design notes](docs/notes/architecture-notes.md).

## Framework workspace commands

Run these from the repository root after `pnpm install`:

| Task                                                       | Command                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Start a harness target                                     | `pnpm dev:web`, `dev:ios`, `dev:android`, `dev:macos`, `dev:linux`, or `dev:windows` |
| Build a harness target                                     | `pnpm build:web`, `build:ios`, `build:macos`, `build:linux`, or `build:windows`      |
| Work on the docs site                                      | `pnpm dev:docs` or `pnpm build:docs`                                                 |
| Build workspace packages                                   | `pnpm build:packages`                                                                |
| Run lint and repository checks                             | `pnpm check`                                                                         |
| Generate declarations and typecheck every target           | `pnpm typecheck`                                                                     |
| Run unit, repository-checker, and typegen tests            | `pnpm test`                                                                          |
| Run checks, typechecks, and tests in order                 | `pnpm validate`                                                                      |
| Verify packed UI, GIF, auth, and typegen-fixture consumers | `pnpm test:packed`                                                                   |
| Build and browser-smoke the harness or docs                | `pnpm smoke:web` or `pnpm smoke:docs`                                                |

Individual `typecheck:web`, `typecheck:mobile`, `typecheck:macos`,
`typecheck:linux`, `typecheck:windows`, and `typecheck:docs` commands are also
available. Aggregates stop on the first failure; `validate` does not run
native builds, browser smoke, or all packed-consumer checks.

Native launch and build commands require the target's SDK and host tools.
`build:macos` packages the experimental AppKit app. Browser smoke commands
require Playwright's browser installation. These shortcuts retain the
[existing target limits](docs/start/spec.md#choose-your-targets).
