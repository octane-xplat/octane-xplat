# Publish a typed component library

ID: typed-component-library
Targets: web, ios, android
Related APIs: tsrx-typegen, tsrx-tsc, TypeScript declarations, package.json exports, pnpm pack

## Starting point

A package contains public `.tsrx` components and publishes a package entrypoint.
The reader knows TypeScript project configs and the package's runtime build.

## Requirements

- Publish declarations for `.tsrx` exports without manually wrapping every component.
- Keep declaration module paths and platform selection aligned with runtime output.
- Verify the package tarball with a consumer that does not install tsrx tooling.

## Acceptance criteria

- AC1: The declaration config uses the package's installed TypeScript and tsrx compiler, includes the public source graph, and writes generated files to a dedicated output directory.
- AC2: Generic component props, imported types, exported helpers, and barrel exports remain usable from the generated declarations; no unresolved `.tsrx` module references reach consumers.
- AC3: `tsrx-typegen --check` reports missing or stale generated declarations and exits nonzero without modifying generated or handwritten output.
- AC4: `pnpm pack` includes every declared types entry and its reachable declarations; a plain TypeScript consumer can import the tarball under each published target condition without tsrx tooling or `allowArbitraryExtensions`.
- AC5: The published type surface preserves intended positive and negative prop checks, and package docs state the supported compiler path and its limits.

## Documentation

- AC1: [tsrx-typegen setup and configuration](../packages/tsrx-typegen/README.md).
- AC2: [Generated declaration contract and source-extension mapping](../packages/tsrx-typegen/README.md).
- AC3: [Generation and check mode](../packages/tsrx-typegen/README.md).
- AC4: [Package publish model and declaration verification](../docs/toolchain-notes.md#shared-packages-publish-model).
- AC5: [Compiler support boundary](../docs/toolchain-notes.md#shared-packages-publish-model) and [known limits](../docs/known-limits.md#same-edge-on-every-target).
