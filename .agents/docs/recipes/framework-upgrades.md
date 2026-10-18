# Keep framework dependencies compatible

ID: framework-upgrades
Targets: web, ios, android, macos, linux
Related APIs: xplat upgrade, xplat upgrade --check, xplat upgrade --no-install, xplat doctor, catalog:xplat, catalog:xplat-windows, @octane-xplat/patches

## Starting point

An app or library uses Xplat packages. It may belong to a pnpm workspace and
may have app-specific dependencies, library consumer peers, or custom patches.

## Requirements

- Use a framework release's compiler, runtime, bundler and enabled tool pins together.
- Preview a workspace upgrade before writing and install matching patches with the pins.
- Preserve app-specific packages, local development links and library consumer peer ranges.
- Recognize managed-version drift and duplicate installed runtimes.
- Distinguish host package checks from app and device qualification.

## Acceptance criteria

- AC1: App and library starters obtain exact managed pins and Node/pnpm requirements from one release compatibility manifest; optional tool/platform dependencies are not installed solely because they appear in the manifest.
- AC2: The reader can select the executing CLI release, preview without writes, apply across a workspace, defer installation, and recover from install failure without mistaking updated metadata for a successful install.
- AC3: Upgrade selects matching patch versions without trusting a stale lockfile, replaces obsolete framework config mappings, preserves custom patches, and stops before any writes on conflicting patch/override/source choices.
- AC4: User catalogs, unrelated dependencies/scripts, local development links and library consumer peer ranges survive; Windows preview and mobile pins remain separate and unsupported mixed packages fail preflight.
- AC5: Doctor compares declarations and reachable installed versions, reports physical duplicate runtime paths including equal-version copies, checks Node/pnpm, and exits nonzero for managed compatibility failures without changing project files.
- AC6: The reader runs their own tests and target builds after alignment; host checks and simulated Windows metadata tests do not establish browser/device/native runtime support.

## Documentation

- AC1: [Compatible versions](../../../packages/cli/README.md#compatible-versions), [creator](../../../packages/create/README.md), [compatibility manifest](../../../packages/create/compatibility.json), and [template synchronization](../../../scripts/sync-compatibility.ts).
- AC2: [Upgrade framework packages](../../../docs/start/toolchain.md#upgrade-framework-packages), [CLI flags and recovery](../../../packages/cli/README.md#compatible-versions), and [upgrade integration tests](../../../packages/cli/test/compatibility.test.mjs).
- AC3: [Patch ownership and conflicts](../../../packages/cli/README.md#compatible-versions) and [stale-lockfile/custom-patch tests](../../../packages/cli/test/compatibility.test.mjs).
- AC4: [Ownership and Windows profiles](../../../packages/cli/README.md#compatible-versions), [library development](../../../packages/create/library-template/README.md#develop-and-check), and [workspace/profile tests](../../../packages/cli/test/compatibility.test.mjs).
- AC5: [Installed checks and duplicate runtime paths](../../../packages/cli/README.md#compatible-versions) and [installed-graph tests](../../../packages/cli/test/compatibility.test.mjs).
- AC6: [Post-upgrade checks](../../../docs/start/toolchain.md#upgrade-framework-packages) and [target support](../../../docs/start/spec.md#choose-your-targets).
