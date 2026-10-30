# Changelog and releases

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Releases are automated through `.github/workflows/release.yml`,
`.github/workflows/release-pr.yml`, and `.github/workflows/stable.yml`:

| Track  | Evidence workflow                                                | Required coverage                                                                                                                                                                                            | Result                                                                                                                                       |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CI     | `CI` (`ci.yml`), on `main` pushes                                | Correctness lint, repository integrity, web/mobile types, unit/object-driver and tooling tests, web/package builds, packed exports, adapter types, and one isolated packed web starter                       | A successful `main` run gates the docs deploy, the tsrx-typegen release, and lockstep stable publication for that exact revision.            |
| Stable | `Stable CI` (`stable.yml`), on the `release/lockstep` pull request | Declared `test:packed` suites except Workshop's browser suite, the full app/library starter journey, iOS build/simulator smoke, iOS on-device tests, and Android build                                          | Passing lanes record tree-keyed evidence that qualifies the release PR's exact tree for publication under npm's `latest` tag.                 |
| Nightly | `release.yml`, daily schedule                                   | The newest successful `main` CI run, plus publishable changes (below) since the published nightly                                                                                                             | Publishes `0.0.0-nightly.g<sha7>` under npm's `nightly` tag and moves the `nightly` git tag and GitHub prerelease to the tested revision. |

The stable release flows through a bot-maintained pull request.
`release-pr.yml` rebuilds the draft `release/lockstep` PR from `main` after
every push: it resolves the next version, bumps package manifests, prepares
the release notes, and force-pushes the branch. Marking the PR ready for
review runs `Stable CI` on it; merging it lets `main` CI produce the release.
If the merged commit's tree already carried Stable CI evidence, publishing
starts immediately; otherwise `release.yml` runs the same lanes through
`workflow_call` on the merged commit first. The release is *pending* while its
tag or the tag's GitHub Release is missing — `release-pr.yml` neither rebuilds
nor reopens the release PR during either state. A tag without its release
means an unfinished publication, which the next green `main` CI run resumes.

The nightly decision compares the newest green `main` CI revision with the
published `@octane-xplat/ui` `nightly` dist-tag. It publishes only when no
published nightly exists, the published commit is unknown, or
`NIGHTLY_PATHS` — the lockstep publish paths plus `package.json`, `bunfig.toml`, and
`bun.lock` — changed since the published commit. An unchanged tree
publishes nothing. Nightlies do not commit to `main` or change `latest`, and
`tsrx-typegen` has no nightly channel.
Recipe structure and documentation links run in the PR-only `repo-hygiene`
job; they do not determine release eligibility.

Release Git operations and PR writes require the `RELEASE_TOKEN` repository
secret. Create a fine-grained personal access token limited to
`octane-xplat/octane-xplat`, with **Contents: read/write**, **Pull requests:
read/write**, and **Workflows: read/write**, then store it using GitHub CLI's
hidden prompt:

```sh
gh secret set RELEASE_TOKEN --repo octane-xplat/octane-xplat
```

Every job that uses the token checks that the secret is present first. The
token maintains the release PR (push, create, edit — `GITHUB_TOKEN`-authored
events would not trigger the `pull_request` workflows that qualify the
branch), pushes the `vX.Y.Z` and moving `nightly` tags, updates the nightly
prerelease, and pushes the tsrx-typegen release commit to `main` so CI and
`release-pr.yml` run on it. Workflows persist it through checkout's `token:`
input. The default `GITHUB_TOKEN` cannot gain `workflows` permission through
YAML, and GitHub can reject tagging a tested commit that changes workflow
files. See
[GitHub's additional-permissions guidance](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token#granting-additional-permissions).
This credential is separate from npm's OIDC trusted publishing below.

To reproduce the two consumer gates locally, prepare packages first. The quick
gate installs real tarballs outside the workspace, checks their declarations
with plain TypeScript, and compiles the starter through Vite's development and
production paths. `--no-build` reuses prepared package outputs without
running prepack hooks in either mode; run `check:pack` first. The full gate also enables
iOS/Android and validates the app and library workflows:

```sh
pnpm build:packages
pnpm check:pack
pnpm exec turbo run test:packed --filter=@octane-xplat/updates
pnpm check:consumer --no-build --quick
pnpm check:consumer --no-build
```

The Updates consumer check validates its bootstrap payload and six target
conditions. Its Node hook is outside the generic checker's paired
runtime/declaration contract, so fast CI keeps this test explicit.

The patches package has a dedicated `pack:check` in the normal packed-artifact
gate. It packs without lifecycle hooks, compares every file with the CLI's
canonical manifest, and checks both starter configurations and generated default
native references. Release jobs repeat it after aligning versions, before tagging
or publishing. Its `test:packed` also serves that tarball through an isolated local
registry, keeps pnpm `configDependencies` enabled, and installs the starter's
upstream dependencies plus optional patched packages with scripts disabled. It
checks locked patch hashes and installed snapshots; it does not qualify devices
or the framework runtime tarballs covered by the full consumer gate.

```sh
pnpm exec turbo run pack:check test:packed --filter=@octane-xplat/patches
```

Checkout manifests retain the previous release number until the release PR
aligns them. A dependency upgrade after a release can therefore require patches
absent from that same numbered registry package. Compare the published creator's
compatibility manifest and patch tarball with the checkout before diagnosing
packaging drift. Registry consumers need a newly published lockstep version and
matching framework/catalog/config-dependency pins, followed by a regenerated
lockfile. Synchronizing local files does not update an existing registry version.

The release gate verifies `ci-evidence-<track>-<sha>` against GitHub's workflow
identity and latest job results; stable evidence is keyed by tree instead
(`ci-evidence-stable-<tree>`), recording both the tested sha and
`git rev-parse <sha>^{tree}` so a merge commit with an identical tree reuses
the pull request's qualification. Verifying `stable` by tree searches the
release PR's completed runs; absent evidence resolves `channel=none` rather
than failing, which queues the inline `qualify` job. A failed or missing
required gate cannot promote to that track. Browser journeys remain local and
are not implied by either release track.

For stable releases, `scripts/release-version.ts` infers the next version from
Conventional Commits. Separately, `scripts/release-notes.ts` assembles selected
Markdown notes into the root `CHANGELOG.md` and `FIXLOG.md`. `release-pr.yml`
aligns package and starter versions and prepares the logs on the release
branch; after the PR merges, `release.yml` tags `vX.Y.Z` on the tested
revision, publishes, rebuilds the GitHub Release body from the recorded log
headings (`release-notes.ts extract`), and queues the next release PR. Manual
`workflow_dispatch` on `release.yml` selects `track` (default `stable`) and
accepts an optional tsrx-typegen version override; it still requires evidence
for the exact revision. The lockstep version override lives on
`release-pr.yml`'s `version` dispatch input (`auto` returns to inference).
Publishing stays in `release.yml` for the existing npm trust binding. If
lockstep publication fails after tagging, the next green `main` CI run
resumes it from the tagged commit — **Re-run failed jobs** on the original
run also works. The same applies to a failed tsrx-typegen publish:
`release.yml`'s `tsrx-typegen-resume` job republishes the tagged version and
creates the missing GitHub Release before a new bump is cut.

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

## Repository installs and publication

Use Bun 1.4.4 with `bun install --frozen-lockfile`. Bun owns the workspace
catalogs in root `package.json` and the committed `bun.lock`. pnpm remains the
publication tool because it applies `publishConfig.exports`, rewrites
workspace/catalog ranges, and supports the existing OIDC/provenance path.
The root `pnpm-workspace.yaml` is generated packaging metadata; it is not an
installation configuration. Run `bun run check:workspace` before packaging.

Release version changes must refresh `bun.lock` with
`bun install --lockfile-only --ignore-scripts`. The release PR and independent
typegen release commit that refreshed lockfile; nightlies refresh it in their
uncommitted publication checkout. Keep the pinned pnpm version in publishing
and pnpm consumer CI jobs even though their installs use Bun.

## CLI executables

`cli-executables.yml` builds and smoke-tests the standalone CLI on macOS and
Linux arm64/x64 and Windows x64, then attaches executables and SHA-256 checksums
to published lockstep releases. Edits to the moving nightly release refresh its
assets. Manual dispatch retains artifacts without uploading to a release.
The normal checks job also runs the Linux executable smoke test, without a
browser or device. Build on each host to select matching native dependencies;
see [executable packaging](toolchain.md#cli-runtime-and-executable-packaging)
and [consumer installation](../../packages/cli/README.md#single-file-executable).
Binaries are excluded from npm tarballs: the npm bin requires installed Bun,
while Vite and MCP exports remain per-module ESM.

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
   change only when explicitly edited in that manifest — except
   `tsrx-typegen`, whose pin the release bump moves to the in-repo version
   once that version is published. Run
   `pnpm check:compatibility` and `pnpm check:patches` to check both outputs.
4. Reconcile the package's public setup and usage with its documentation, any
   affected recipes, and maintained examples. Run `pnpm check:recipes` when
   user-facing workflows change.

Declare dependencies in the package manifest and verify the packed consumer
surface with `pnpm check:consumer`. Do not hand-publish real releases or bump
package versions: CI builds, aligns lockstep versions, and publishes them.

`tsrx-typegen` releases on its own cadence with `tsrx-typegen-v*` tags. Only
`packages/tsrx-typegen/**` commits move its version. A green `main` CI run
publishes it immediately — it has no release PR and no nightly channel. Its
new release notes use the same root logs, under headings labeled
`tsrx-typegen` and its version. `packages/tsrx-typegen/CHANGELOG.md`
preserves its earlier published history.

The docs site deploys to Cloudflare Pages on every green `main` CI run
(`release.yml`'s `docs` job) — `llms.txt` regeneration is automatic.
Manual pre-release task that remains: re-verify `docs/testing/known-limits.md`
entries stamped older than the releasing version.

## Write a release note

Write for app builders deciding what is useful or what they need to change.
One file describes one meaningful user-facing change; several related commits
can share a file. Add the note in the same change as the implementation and
its documentation. Do not create a note just because a commit exists.

| Change | Pending file | Published destination |
| --- | --- | --- |
| Useful new feature or improvement | `.changelog/<short-description>.md` | `CHANGELOG.md` |
| Breaking public API change, including a removal | `.changelog/<short-description>.md` | `CHANGELOG.md` |
| User-facing bug fix for behavior a release already shipped | `.changelog/fixes/<short-description>.md` | `FIXLOG.md` |
| Fix for a bug introduced after the previous release, internal refactor, tests, CI, formatting, or routine dependency maintenance with no user-visible effect | No file | Neither log |

Log a fix only when the bug reached a tagged stable release of the same
stream (`v*` for lockstep, `tsrx-typegen-v*` for tsrx-typegen). A bug
introduced and fixed between releases never reached users, so the fix is
internal work. To check whether the commit that introduced the bug shipped,
run `git tag --contains <sha>` and look for a stable tag. Nightly
prereleases do not count: release notes serve readers comparing stable
versions.

A breaking fix belongs in the changelog with a clear **Breaking change**
label and the smallest useful migration example. Do not duplicate it in the
fixlog. Prefer outcomes such as “Keep your place when new messages arrive”
over implementation terms. State affected platforms when the difference
matters to the reader.

Every file begins with a level-three title and a short description. Most
packages use `lockstep`: they share one version, and a lockstep note needs no
YAML header. Only a `tsrx-typegen` note opens with a header containing
`release: tsrx-typegen` and nothing else. For a change spanning both release
streams, write a separate file for each stream so either can publish
independently. Choose a descriptive filename that does not collide
with another pending note; do not include an anticipated version or date.

This is a format example for a hypothetical button fix, not a pending release
announcement. Save a real fix in `.changelog/fixes/disabled-save-button.md`:

````md
### Keep disabled buttons inactive

Disabled buttons no longer start their action when pressed.

```tsx
import { Button } from '@octane-xplat/ui'

export function SaveButton() {
  return <Button label="Save" isDisabled clickAction={() => console.log('Saved')} />
}
```

[Button documentation](https://octane-xplat.goddardai.org/components#inputs)
````

For an API addition, change, or fix, include one or more minimal, valid usage
snippets that demonstrate the added or corrected behavior. APIs include
components, props, functions, types, commands, and configuration. For a fix,
state the previous symptom and the corrected result; for a breaking change,
show the replacement or a small before/after example. Validate the snippet
against the affected API. A purely visible fix with no API change can use a
short explanation without code.

Link to the official documentation for the affected feature, preferably its
specific section. Use absolute HTTPS links so notes work in both root logs
and GitHub Releases. Prefer the Xplat docs site; use the official repository
documentation or an upstream project's official docs when that is the
canonical source. Check published page URLs against the site's `llms.txt`;
they do not necessarily match the source file's directory. Update the docs
in the same change if they do not yet cover
the behavior. Keep full explanations, option lists, and tutorials in those
docs; the release note needs only the basic explanation and useful snippet.

Use short, concrete titles and paragraphs. Avoid jargon where plain words
work, and explain necessary technical language in context. Keep project-specific
definitions in the topic that owns the behavior, following the
[terminology guidance](documentation.md#terminology), and link directly to
that documentation. The note and its title should make sense without requiring
a separate terminology lookup.

Validate pending files and preview one release without editing the logs:

```sh
pnpm check:changelog
node scripts/release-notes.ts preview lockstep 0.18.0
node scripts/release-notes.ts preview tsrx-typegen 0.3.0
```

The versions above are preview examples. The checker validates file headers,
release names, title structure, and closed code fences; authors and reviewers
must still check user relevance, snippet correctness, documentation links, and
plain language. It does not require an entry for every commit or guess whether
a change affects an API.

## Assemble notes at release time

Only versioned releases consume pending files. The release script groups the
selected stream's files by features and fixes, sorts filenames for stable
ordering, removes the YAML headers, and prepends a dated, linked release heading
to each nonempty destination. Entry bodies, including snippets and links, are
preserved. Empty categories add no heading; a release without notes can still
ship and gets a short “No user-facing release notes” message on GitHub.

For example, CI prepares one selected release with:

```sh
node scripts/release-notes.ts prepare lockstep 0.18.0
```

This writes `.release-notes.md` for GitHub, updates the relevant root logs, and
deletes only that stream's consumed files. For the lockstep stream these
edits happen on the release PR branch; for tsrx-typegen they happen in the
release job's own commit. Do not run `prepare` during feature/fix work;
use `preview`. Existing published history stays intact, including fixes in
older combined changelogs. Nightlies neither consume files nor update the logs.

The tsrx-typegen release commit pushes straight to `main` — it is the only
release job that still commits there. Before editing the shared logs it
fast-forwards over preceding release-bot commits only; an intervening
ordinary commit skips the job instead of failing, because the newer CI run
will release that revision instead. A repeated version already recorded in a
log is rejected before any file is consumed.

## Version policy

Conventional Commits determine versions independently of pending notes.
Inference uses the latest reachable version tag for the selected stream and
only its package paths. The lockstep paths are `packages/**`, excluding
`app`, `demos`, `media-probe`, `typegen-fixture`, and `tsrx-typegen`.

| Commit | Version effect |
| --- | --- |
| `feat:` | Minor bump, such as `0.17.1` to `0.18.0` |
| `fix:`, `perf:`, `refactor:`, `revert:` | Patch bump, such as `0.17.1` to `0.17.2` |
| `!` after the type/scope, or a `BREAKING CHANGE:` / `BREAKING-CHANGE:` footer | Minor while below `1.0.0`; major from `1.0.0` onward |
| `docs:`, `doc:`, `test:`, `chore:`, `ci:`, `build:`, `style:` | No bump unless marked breaking |
| Other conventional types | No bump unless marked breaking |
| Any commit scoped `(ci)`, or a non-conventional message | No bump |

The largest applicable bump wins. A stream with no previous version starts at
`0.1.0` when an eligible commit exists. No eligible commits means no automatic
versioned release. Editing a pending note alone does not trigger a release.
Manual version overrides remain available, including prereleases; an existing
tag is skipped. Set the lockstep override through `gh workflow run
release-pr.yml -f version=<x.y.z>` (`-f version=auto` returns to inference);
set the tsrx-typegen override through `release.yml`'s `typegen_version`
dispatch input.

Check version selection without publishing, and run the tooling regressions:

```sh
node scripts/release-version.ts lockstep
pnpm exec turbo run test:release --filter=//
```

The experimental GTK renderer has a package-specific [readiness audit and exact
credentialed bootstrap procedure](notes/linux-gtk-release.md). Its production
feasibility gate remains separate from package publication.
