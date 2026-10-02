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

## Add a publishable package

[`scripts/publishable.mjs`](../../scripts/publishable.mjs) discovers every
direct child of `packages/` with a `package.json` unless its manifest has
`"private": true`. New publishable packages join the lockstep release
automatically. Keep fixtures and private workspace tools private.
`tsrx-typegen` is listed in `LOCKSTEP_EXCLUDE` because it uses a separate
release track; another independent track also needs explicit release-script
and workflow configuration.

Set repository metadata in every publishable manifest. npm's provenance check
compares `repository.url` with the GitHub Actions source, so keep this URL exact
and retain the package's directory:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/octane-xplat/octane-xplat",
  "directory": "packages/<dir>"
}
```

Replace `<dir>` with the package directory name. Do not use a `git+https` URL
or append `.git`.

Before the first automated release:

1. Publish a minimal `0.0.1` stub under the final npm package name. The stub
   should state that it has no supported API. npm requires the package to exist
   before `npm trust` can configure its publisher. This bootstrap publish is
   the only manual package version; later releases use the workflow below. For
   this one-time bootstrap only, publish the temporary stub directory with
   `npm publish <stub-dir> --access public`. Replace `<stub-dir>` with the path
   to the directory containing the stub's `package.json`.
2. Configure the `release.yml` trusted publisher for
   `octane-xplat/octane-xplat` with direct publish permission:

   ```sh
   npm trust github <package-name> --file release.yml \
     --repository octane-xplat/octane-xplat \
     --allow-publish --allow-stage-publish
   ```

   Replace `<package-name>` with the manifest's `name`. Confirm the entry with
   `npm trust list <package-name>`; the release preflight checks the same
   repository and workflow before publishing.

3. Add the package to `packages/create/template/package.json` only if newly
   scaffolded apps need it. The release workflow updates template versions.
4. Reconcile the package's public setup and usage with its documentation, any
   affected recipes, and maintained examples. Run `pnpm check:recipes` when
   user-facing workflows change.

Declare dependencies in the package manifest and verify the packed consumer
surface with `pnpm check:consumer`. Do not hand-publish real releases or bump
package versions: CI builds, aligns lockstep versions, and publishes them.

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
(excluding `app`, `demos`, `media-probe`, `typegen-fixture`, `tsrx-typegen`), and skips
`docs:`/`test:`/`chore:`/`ci:`/`build:`/`style:` types.
