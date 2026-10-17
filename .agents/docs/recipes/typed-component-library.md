# Publish a typed component library

ID: typed-component-library
Targets: web, ios, android
Related APIs: tsrx-typegen, tsrx-tsc, TypeScript declarations, package.json exports, Stack, HStack, VStack, List, ListItem, FormLayout, InputGroup, pnpm pack

## Starting point

A package contains public `.tsrx` components and publishes a package entrypoint.
The reader knows TypeScript project configs and package export conditions.

## Requirements

- Publish declarations for `.tsrx` exports without manually wrapping every component.
- Keep declaration module paths and platform selection aligned with runtime output.
- Verify the package tarball with a consumer that does not install tsrx tooling.
- Develop and pack the library without committing generated declaration output.

## Acceptance criteria

- AC1: The declaration config uses the package's installed TypeScript and tsrx compiler, includes the public source graph, and writes generated files to a dedicated output directory.
- AC2: Generic component props, imported types, exported helpers, and barrel exports remain usable from the generated declarations; no unresolved `.tsrx` module references reach consumers.
- AC3: `tsrx-typegen --check` reports missing or stale generated declarations and exits nonzero without modifying generated or handwritten output.
- AC4: `pnpm pack` includes every declared types entry and its reachable declarations; a plain TypeScript consumer can import the tarball under each published target condition without tsrx tooling or `allowArbitraryExtensions`.
- AC5: The published type surface preserves intended positive and negative prop checks, and package docs state the supported compiler path and its limits.
- AC6: The package's prepack gate and `xplat doctor` fail when packed type targets are missing, runtime and declaration value exports differ, declaration references escape or miss the tarball, or a bare declaration dependency is undeclared.
- AC7: Workspace setup and development refresh declarations for local consumers when generated output is absent from Git; packing regenerates and includes that output while handwritten declarations and overrides remain source.
- AC8: `pnpm create octane-xplat <directory> --template library` creates an independent package with web/native conditional exports, generated declarations, and a packed-consumer check; [the library starter](../../../packages/create/README.md#start-a-library-package) documents its target scope and next commands.
- AC9: Runtime exports preserve authored `.ts`, `.tsx`, and `.tsrx` modules and platform variants; the consuming app compiles installed packages with its own Octane toolchain. Public type exports resolve to `.d.ts` files whose local references stay within declarations, without loading package implementation source.

## Documentation

- AC1: [tsrx-typegen setup and configuration](../../../packages/tsrx-typegen/README.md).
- AC2: [Generated declaration contract and source-extension mapping](../../../packages/tsrx-typegen/README.md).
- AC3: [Generation and check mode](../../../packages/tsrx-typegen/README.md).
- AC4: The [workshop packed mobile compiler checks](../../../packages/workshop/tests/packed-consumer.mobile.mjs) cover generated mobile declarations and native entry/leaf selection outside the workspace; [mobile workshop setup](../../../packages/workshop/MOBILE.md) separates these checks from its still-unqualified host behavior. [Package publish model and declaration verification](../notes/toolchain-notes.md#shared-packages-publish-model), the [component index](../../../docs/app/components.md), plus the [GIF](../../../packages/gif/tests/packed-consumer.mjs) and [UI](../../../packages/ui/tests/packed-consumer.mjs) packed consumers — every typed leaf carries the same `tests/packed-consumer.mjs` harness (`pnpm test:packed`); the full packed-artifact starter path is [scripts/verify-consumer.mjs](../../../scripts/verify-consumer.mjs) (`pnpm check:consumer`). The [release gates](../releases.md) distinguish nightly's packed web smoke from stable's exhaustive non-browser consumers and full app/library workflow; browser journeys remain local.
- AC5: [Compiler support boundary](../notes/toolchain-notes.md#shared-packages-publish-model) and [known limits](../../../docs/verify/known-limits.md#same-edge-on-every-target).
- AC6: [Pack check and doctor integration](../../../packages/tsrx-typegen/README.md#publish-checks); every declaration-shipping package wires `--pack-check` into `prepack` (`pnpm check:pack` runs them all).
- AC7: [Develop against generated declarations](../notes/toolchain-notes.md#develop-against-generated-declarations) and [package preparation](../../../packages/tsrx-typegen/README.md#publish-checks).
- AC8: [Create a third-party library](../../../packages/create/README.md#start-a-library-package) and the generated [library README](../../../packages/create/library-template/README.md).
- AC9: [Source runtime and declaration publishing](../notes/toolchain-notes.md#shared-packages-publish-model), the [library starter](../../../packages/create/library-template/package.json), and [declaration closure checks](../../../packages/tsrx-typegen/tests/pack-check.mjs).
