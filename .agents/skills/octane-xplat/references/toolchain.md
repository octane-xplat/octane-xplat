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

The web production build is covered by the smoke script (59 assertions at
this revision).

## Release validation (CI gates)

`pnpm lint`, repo checks (patches/css/recipes/decisions/suffix-resolution),
`typecheck:web` + `typecheck:mobile`, tests, web build, package builds,
packed-declaration checks, and the harness browser smoke run in the `checks`
job. `pnpm check:consumer` (`scripts/verify-consumer.mjs`) packs every
publishable package, scaffolds a starter via the packed create bin
(`--no-install`), installs it against `file:` tarballs outside the workspace,
and runs the consumer's lint/typecheck/build/doctor plus a browser smoke.
`--native ios,android` + `--smoke-ios` extend it to `ns build` and a simctl
install/launch smoke on a booted iPhone sim — the `native-ios`/`native-android`
CI jobs run that under `scripts/with-target-lock.mjs` (per-target advisory
lock for shared simulators/devices). Debug/simulator artifacts only — no
signed distribution claims.

## The publish model (`@octane-xplat/ui`)

Ships **compiled** output, not .tsrx source:

- `packages/ui/vite.config.ts` — lib mode + `preserveModules`, run twice
  (`vite build`, `vite build --mode native`) → `dist/web`, `dist/native`.
  Suffix chain resolved at build; hooks retarget to
  `@nativescript-community/octane`; runtime deps external via peers.
- `exports` point at `src` for workspace dev; `publishConfig` swaps to
  `dist` (+ `types` condition) only at publish — verified via `pnpm pack`.
- **Types:** `src/props.ts` (pure .ts) → `tsc -p tsconfig.types.json
--emitDeclarationOnly` → `types/props.d.ts`; the web, native, and
  platform-subpath declaration files are thin shells around those props.
  Published root types are split by web/native export condition. tsrx cannot
  emit declarations for `.tsrx` files itself (upstream tsrx#136).

## Publish procedure

Releases are automated — `.github/workflows/release.yml` fires on every green
`CI` run on `main`: git-cliff infers the version, all publishable packages
bump in lockstep (`scripts/bump-versions.mjs`), CHANGELOG.md gets a generated
section, the commit + `vX.Y.Z` tag push, then `pnpm -r publish` ships via npm
trusted publishing (OIDC + provenance, no tokens). A preflight
(`scripts/check-trusted-publishers.mjs`) bails before publishing if any
package lacks a trusted-publisher config for this repo + workflow.
Publication is additionally bound to the tested revision: CI's `evidence`
job records per-job results into the `ci-evidence-<sha>` artifact, both
publish jobs check out `workflow_run.head_sha` and verify that artifact via
`scripts/verify-release-evidence.mjs`, and the tag push aborts if main
advanced past the tested sha with non-release commits.

`tsrx-typegen` releases on its own `tsrx-typegen-v*` cadence; everything else
is lockstep. Manual escape hatch: `workflow_dispatch` with a version override.

Do not hand-publish or hand-bump versions — a local `pnpm publish` bypasses
the lockstep bump and the trusted-publisher path.

## Version pins (deliberate)

octane 0.6.3, @nativescript-community/octane 0.2.1, @nativescript/core
9.1.2, vite 8.3.0, @octanejs/vite-plugin 0.1.61, tsrx toolchain pinned.
Beta/fast-moving deps stay exact-pinned — bump deliberately.

## pnpm workspace specifics

- `nodeLinker: isolated` in pnpm-workspace.yaml — NativeScript's vendor
  manifest and HMR code read package manifests from the app root, so every
  package and app must declare its imports (including NativeScript plugins
  shipped by an app).
- `minimumReleaseAgeExclude` covers the octane packages (newer than the
  supply-chain cutoff).
- `pnpm install` auto-fetches peers — workspace deps must say
  `"workspace:*"`.
