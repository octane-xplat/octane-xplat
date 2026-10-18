# Changelog and releases

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Releases are automated through `.github/workflows/release.yml`. Nightly
readiness and stable qualification complete independently:

| Track   | Evidence workflow                                | Required coverage                                                                                                                                                                                                   | Result                                                                                                                |
| ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Nightly | `CI` (`ci.yml`), on PRs and `main` pushes        | Correctness lint, repository integrity, web/mobile types, unit/object-driver and tooling tests, web/package builds, packed exports, adapter types, and one isolated packed web starter                              | A successful `main` run publishes `0.0.0-nightly.g<sha>` under npm's `nightly` tag and updates the GitHub prerelease. |
| Stable  | `Stable CI` (`stable.yml`), after `CI` on `main` | Verified nightly readiness for the same SHA, declared `test:packed` suites except Workshop's browser suite, the full app/library starter journey, iOS build/simulator smoke, iOS on-device tests, and Android build | A successful qualification permits a versioned release under npm's `latest` tag.                                      |

Nightly publishes without waiting for stable qualification. It does not commit
to `main` or change `latest`. Stable completion does not republish nightly.
Recipe structure and documentation links run in the PR-only `repo-hygiene`
job; they do not determine release eligibility.

To reproduce the two consumer gates locally, prepare packages first. The quick
gate installs real tarballs outside the workspace, checks their declarations
with plain TypeScript, and compiles the starter through Vite's development and
production paths. Quick packing reuses prepared outputs without repeating
prepack hooks; CI runs `check:pack` before this smoke. The full gate also enables
iOS/Android and validates the app and library workflows:

```sh
pnpm build:packages
pnpm check:consumer --no-build --quick
pnpm check:consumer --no-build
```

The release gate verifies `ci-evidence-<track>-<sha>` against GitHub's workflow
identity and latest job results. Stable evidence also records the originating
nightly run ID: `workflow_run` itself can reference a newer default-branch
commit, so the publisher uses the verified artifact SHA. A failed or missing
required gate cannot promote to that track. Browser journeys remain local and
are not implied by either release track.

For stable releases, `git-cliff` (`cliff.toml`) infers the next version from
conventional commits and generates the changelog. The workflow aligns package
and starter versions, commits, tags `vX.Y.Z`, publishes, and creates the GitHub
Release. Manual `workflow_dispatch` selects `track` (default `stable`) and
accepts optional version overrides; it still requires evidence for the exact
revision. Publishing stays in `release.yml` for the existing npm trust binding.

Publishing is npm **trusted publishing** (OIDC, no tokens) — each package must
have `octane-xplat/octane-xplat` + `release.yml` configured on npmjs.com; a
preflight step checks every package before anything ships
(`scripts/check-trusted-publishers.ts`). Both release jobs cache successful
checks for 24 hours, scoped to the registry, repository, workflow ref, and job.
New packages and expired entries always contact npm. The cache stores package
names and timestamps, never tokens; npm still authorizes every actual publish.
A publisher removed during that window may pass preflight until its entry
expires. To force a fresh check inside an OIDC-enabled release job, unset the
cache path:

```sh
TRUSTED_PUBLISHERS_CACHE= node scripts/check-trusted-publishers.ts
```

## Add a publishable package

[`scripts/publishable.ts`](../../scripts/publishable.ts) discovers every
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
{
	"repository": {
		"type": "git",
		"url": "https://github.com/octane-xplat/octane-xplat",
		"directory": "packages/<dir>"
	}
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
   scaffolded apps need it. Run `pnpm sync:compatibility` after adding a
   lockstep package; its generated package-name list makes doctor/upgrade
   recognize it. The release bump regenerates framework/catalog/patch-config
   pins through the same compatibility manifest. External engine/tool pins
   change only when explicitly edited in that manifest. Run
   `pnpm check:compatibility` and `pnpm check:patches` to check both outputs.
4. Reconcile the package's public setup and usage with its documentation, any
   affected recipes, and maintained examples. Run `pnpm check:recipes` when
   user-facing workflows change.

Declare dependencies in the package manifest and verify the packed consumer
surface with `pnpm check:consumer`. Do not hand-publish real releases or bump
package versions: CI builds, aligns lockstep versions, and publishes them.

`tsrx-typegen` releases on its own cadence: `cliff.tsrx-typegen.toml`,
`tsrx-typegen-v*` tags, `packages/tsrx-typegen/CHANGELOG.md`, and only
`packages/tsrx-typegen/**` commits move its version.

The docs site deploys to Cloudflare Pages on every checks-green `main` CI
run (same workflow, `docs` job) — `llms.txt` regeneration is automatic.
Manual pre-release task that remains: re-verify `docs/verify/known-limits.md`
entries stamped older than the releasing version.

`CHANGELOG.md` is generated — **do not edit it as part of feature/fix work.**
Write commit messages for app developers; they are the changelog source.
Bump/changelog inference only counts commits touching `packages/**`
(excluding `app`, `demos`, `media-probe`, `typegen-fixture`, `tsrx-typegen`), and skips
`docs:`/`test:`/`chore:`/`ci:`/`build:`/`style:` types.
