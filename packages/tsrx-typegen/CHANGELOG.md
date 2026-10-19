# Changelog

## [tsrx-typegen-v0.3.1] - 2026-10-19

### Refactoring

- *(toolchain)* Port remaining Node tooling from .mjs to .ts
- *(scripts,apps)* Port app-level Node tooling to .ts; unmark lint/create/tsrx-typegen


## [tsrx-typegen-v0.3.0] - 2026-10-17

### Breaking Changes

- *(packages)* [**breaking**] Publish source with declaration entrypoints

### Features

- *(toolchain)* Single combined tsconfig program per package/app with fixed platform-suffix order

### Bug Fixes

- *(typegen)* Honor inline type modifiers in pack-check export parity
- *(tsrx-typegen)* Validate native SDK declaration graphs


## [tsrx-typegen-v0.2.2] - 2026-10-04

### Bug Fixes

- _(tsrx-typegen)_ Normalize Windows project source paths
- _(typegen)_ Validate the published package tarball
- _(typegen)_ Handle case-only declaration renames

## [tsrx-typegen-v0.2.1] - 2026-10-02

### Bug Fixes

- _(release)_ Align package repository URLs for provenance

## [tsrx-typegen-v0.2.0] - 2026-10-01

### Features

- _(tsrx-typegen)_ Add emit:false targets for pack-check-only packages

### Bug Fixes

- _(tsrx-typegen)_ Don't count type-only re-exports as declared values

## [tsrx-typegen-v0.1.0] - 2026-09-29

### Features

- _(typegen)_ Add standalone tsrx declaration tooling
- _(typegen)_ Verify published package declarations
- _(ui)_ Generate declarations with tsrx-typegen
