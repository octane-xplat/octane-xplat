# Build, compatibility, and releases

## Build a consumer app

Use the app's enabled scripts. Web production builds do not qualify native
runtime behavior, and an unsigned simulator build is not a signed release.
Read the [toolchain guide](../../../../docs/start/toolchain.md) before native
setup or distribution work.

```sh
# From the app directory; use only scripts present in package.json.
pnpm build
pnpm build:ios
pnpm build:android
```

Keep the supplied catalog and managed patches together. The compatibility
manifest, installed package versions, and doctor/upgrade output own the current
version set; exact pins copied into prose go stale. Within this repository,
workspace dependencies use `"workspace:*"` and packages declare every import.
Node tooling needs Node >=22.18 for direct erasable TypeScript execution;
consumer bundlers still compile framework runtime source.

```sh
pnpm xplat doctor
pnpm dlx @octane-xplat/cli@latest upgrade --check
```

## Package validation in the framework repository

UI runtime exports ship authored source with generated declaration entrypoints;
the app compiler selects platform leaves. Other packages can ship JavaScript
builds, including CLI tooling. Check each package's export map rather than
assuming one publish format for the repository. Packed-consumer checks establish
installed-package behavior that workspace source checks cannot.

```sh
# Repository root: prepare declared package outputs and check exports.
pnpm build:packages
pnpm check:pack
pnpm check:consumer --no-build --quick
```

The quick consumer gate uses isolated tarballs and compilation. Full consumer
journeys and browser checks have different costs and prerequisites; consult
[release validation](../../../docs/releases.md) before selecting them.

## CI evidence and publishing

Nightly readiness uses `CI`; stable qualification uses `Stable CI` for the same
revision. The PR `checks` job does not install browser engines or run device
emulation. Browser journeys run locally and are not implied by either release
track. The PR-only recipe/link hygiene job is separate from release eligibility.
The [release reference](../../../docs/releases.md) owns the current gate list,
evidence requirements, trusted publishing, and new-package bootstrap procedure.

Do not hand-bump versions, hand-publish real releases, or edit the generated
changelog. Use Conventional Commit messages that describe the change for app
builders. The one-time package stub/trust bootstrap is an explicit exception
covered by the release reference; it is not a general release workflow.

## Task graph

Use existing root and package scripts so declaration dependencies and caches
remain ordered. Do not substitute a broad repository typecheck for the required
touched-package/dependents filter. Read the
[toolchain reference](../../../docs/toolchain.md) for task definitions and
combined typecheck environments; do not infer runtime platform selection from
TypeScript's fixed suffix order.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
```
