# Toolchain

## Builds

```sh
# web — production dist (what pnpm smoke tests)
cd apps/web && pnpm exec vite build

# iOS — debug / release (simulator, unsigned OK)
cd apps/mobile && pnpm exec ns build ios
cd apps/mobile && pnpm exec ns build ios --release     # Release-iphonesimulator

# Android — debug / signed release
cd apps/mobile && pnpm exec ns build android
cd apps/mobile && pnpm exec ns build android --release \
  --key-store-path "$KEYSTORE_PATH" --key-store-password "$KEYSTORE_PASSWORD" \
  --key-store-alias "$KEYSTORE_ALIAS" --key-store-alias-password "$KEYSTORE_PASSWORD"
```

The web production build is covered by the smoke script (62 assertions at
this revision).

## Release validation (CI gates)

`pnpm lint`, repo checks (patches/css/recipes/decisions/suffix-resolution),
`typecheck:web` + `typecheck:mobile`, tests, web build, package builds,
packed-declaration checks, and the harness browser smoke run in the `checks`
job. `pnpm check:consumer` (`scripts/verify-consumer.ts`) packs every
publishable package, scaffolds a starter via the packed create bin
(`--no-install`), installs it against `file:` tarballs outside the workspace,
and runs the consumer's lint/typecheck/build/doctor plus a browser smoke.
`--native ios,android` + `--smoke-ios` extend it to `ns build` and a simctl
install/launch smoke on a booted iPhone sim — the `native-ios`/`native-android`
CI jobs run that under `scripts/with-target-lock.ts` (per-target advisory
lock for shared simulators/devices). Debug/simulator artifacts only — no
signed distribution claims.

## The publish model (`@octane-xplat/ui`)

Publishes authored `.ts`, `.tsx`, and `.tsrx` runtime source plus `.d.ts`
entry points. Workspace and packed exports use the same paths; the app's
Octane compiler chooses platform leaves and renderer/runtime settings.

- `prepack` generates declarations with `tsrx-typegen` (or declaration-only
  `tsc`) and checks the packed declaration graph.
- Public `types` conditions point at `.d.ts`; runtime conditions point at
  `src`. Local declaration references must resolve to declarations.
- `pnpm build:packages` prepares declarations and required assets. Only
  Node font/configuration tooling and embedded editor documents retain JavaScript builds.
- Verify installed tarballs through the app compiler; workspace source alone
  does not establish installed-package discovery or native renderer selection.

## Publish procedure

Releases are automated — `.github/workflows/release.yml` fires on every
completed `CI` run on `main` and resolves a channel from the recorded
evidence (`scripts/release-channel.ts`). All required jobs green → stable:
git-cliff infers the version, all publishable packages bump in lockstep
(`scripts/bump-versions.ts`), CHANGELOG.md gets a generated section, the
commit + `vX.Y.Z` tag push, then `pnpm -r publish` ships via npm trusted
publishing (OIDC + provenance, no tokens). `checks` green but a native lane
red → nightly: the set publishes `0.0.0-nightly.g<sha>` under the `nightly`
dist-tag (every checks-green push ships one — stable does not suppress it)
and the moving `nightly` git tag + GitHub prerelease track the tested sha.
A preflight (`scripts/check-trusted-publishers.ts`) bails before publishing
if any package lacks a trusted-publisher config for this repo + workflow.
Publication is additionally bound to the tested revision: CI's `evidence`
job records per-job results into the `ci-evidence-<sha>` artifact, the `gate`
job checks out `workflow_run.head_sha` and verifies that artifact via
`scripts/verify-release-evidence.ts`, and the stable tag push aborts if main
advanced past the tested sha with non-release commits.

`tsrx-typegen` releases on its own `tsrx-typegen-v*` cadence; everything else
is lockstep. Manual escape hatch: `workflow_dispatch` with a version override.

Do not hand-publish or hand-bump versions — a local `pnpm publish` bypasses
the lockstep bump and the trusted-publisher path.

## Version pins (deliberate)

octane 0.6.3, @nativescript-community/octane 0.2.1, @nativescript/core
9.1.2, vite 8.3.0, @octanejs/vite-plugin 0.1.61, tsrx toolchain pinned.
Beta/fast-moving deps stay exact-pinned — bump deliberately.

## Task graph (Turborepo)

`pnpm typegen` / `typecheck` / `build:packages` / `build:web` and the package
tests inside `pnpm test` run through `turbo` (pinned devDep, root
`turbo.json`). Tasks cache in `.turbo/` — a no-op `pnpm typecheck` is ~200ms;
edits rerun only the touched package and its dependents. Per-package
typecheck/build/test read dependency sources and generated `types/`, so
`dependsOn: ["^typegen"]` carries both ordering and dep-file hashing;
`apps/mobile`/`apps/windows` hash all of `packages/**` because their tsconfigs
`include` it literally. Repo-wide single-pass commands (`pnpm lint`, the
`check:*` scripts, native `ns`/`xplat` builds) stay outside the cache. Details:
`.agents/docs/toolchain.md`.

## pnpm workspace specifics

- `nodeLinker: isolated` in pnpm-workspace.yaml — NativeScript's vendor
  manifest and HMR code read package manifests from the app root, so every
  package and app must declare its imports (including NativeScript plugins
  shipped by an app).
- `minimumReleaseAgeExclude` covers the octane packages (newer than the
  supply-chain cutoff).
- `pnpm install` auto-fetches peers — workspace deps must say
  `"workspace:*"`.
