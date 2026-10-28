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

Nightly GitHub tagging requires the `NIGHTLY_RELEASE_TOKEN` repository secret.
Create a fine-grained personal access token limited to
`octane-xplat/octane-xplat`, with **Contents: write** and **Workflows: write**,
then store it using GitHub CLI's hidden prompt:

```sh
gh secret set NIGHTLY_RELEASE_TOKEN --repo octane-xplat/octane-xplat
```

The release gate checks that the secret is present before either nightly npm
publisher runs. The token authenticates only the nightly tag/prerelease step;
its Git push overrides checkout's persisted credential for that command. The
default `GITHUB_TOKEN` cannot gain `workflows` permission through YAML, and
GitHub can reject tagging a tested commit that changes workflow files. See
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

The release gate verifies `ci-evidence-<track>-<sha>` against GitHub's workflow
identity and latest job results. Stable evidence also records the originating
nightly run ID: `workflow_run` itself can reference a newer default-branch
commit, so the publisher uses the verified artifact SHA. A failed or missing
required gate cannot promote to that track. Browser journeys remain local and
are not implied by either release track.

For stable releases, `scripts/release-version.ts` infers the next version from
Conventional Commits. Separately, `scripts/release-notes.ts` assembles selected
Markdown notes into the root `CHANGELOG.md` and `FIXLOG.md`. The workflow aligns
package and starter versions, commits, tags `vX.Y.Z`, publishes, and creates the
GitHub Release with both kinds of notes. Manual `workflow_dispatch` selects
`track` (default `stable`) and
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

`tsrx-typegen` releases on its own cadence with `tsrx-typegen-v*` tags. Only
`packages/tsrx-typegen/**` commits move its version. Its new release notes use
the same root logs, under headings labeled `tsrx-typegen` and its version.
`packages/tsrx-typegen/CHANGELOG.md` preserves its earlier published history.

The docs site deploys to Cloudflare Pages on every checks-green `main` CI
run (same workflow, `docs` job) — `llms.txt` regeneration is automatic.
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
deletes only that stream's consumed files. These changes and version updates
belong to one release commit. Do not run `prepare` during feature/fix work;
use `preview`. Existing published history stays intact, including fixes in
older combined changelogs. Nightlies neither consume files nor update the logs.

The independent package releases first. Before editing the shared logs, each
stable job fast-forwards over preceding release-bot commits only. An intervening
ordinary commit or a later concurrent push stops the release; qualify the new
revision rather than rebasing generated notes over untested code. A repeated
version already recorded in a log is rejected before any file is consumed.

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
tag is skipped. Nightly version names and qualification requirements are unchanged.

Check version selection without publishing, and run the tooling regressions:

```sh
node scripts/release-version.ts lockstep
pnpm exec turbo run test:release --filter=//
```

The experimental GTK renderer has a package-specific [readiness audit and exact
credentialed bootstrap procedure](notes/linux-gtk-release.md). Its production
feasibility gate remains separate from package publication.
