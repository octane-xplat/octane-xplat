# Changelog and releases

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Releases are automated: `.github/workflows/release.yml` fires on every green
`CI` run on `main` (plus `workflow_dispatch` for manual version overrides).
`git-cliff` (`cliff.toml`) infers the next version from conventional commits
and generates the changelog; the workflow bumps every publishable package to
the same version, updates the create template's `@octane-xplat/*` pins,
commits, tags `vX.Y.Z`, `pnpm -r publish`es, and creates the GitHub Release.
Publishing is npm **trusted publishing** (OIDC, no tokens) — each package must
have `octane-xplat/octane-xplat` + `release.yml` configured on npmjs.com; a
preflight step bails before anything ships if one is missing
(`scripts/check-trusted-publishers.mjs`).

`tsrx-typegen` releases on its own cadence: `cliff.tsrx-typegen.toml`,
`tsrx-typegen-v*` tags, `packages/tsrx-typegen/CHANGELOG.md`, and only
`packages/tsrx-typegen/**` commits move its version.

The docs site deploys to Cloudflare Pages on every green `main` CI run
(same workflow, `docs` job) — `llms.txt` regeneration is automatic.
Manual pre-release task that remains: re-verify `docs/known-limits.md`
entries stamped older than the releasing version.

`CHANGELOG.md` is generated — **do not edit it as part of feature/fix work.**
Write commit messages for app developers; they are the changelog source.
Bump/changelog inference only counts commits touching `packages/**`
(excluding `app`, `demos`, `typegen-fixture`, `tsrx-typegen`), and skips
`docs:`/`test:`/`chore:`/`ci:`/`build:`/`style:` types.
