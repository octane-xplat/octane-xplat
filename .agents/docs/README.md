# Internal implementation documentation

This directory holds contributor guidance, implementation notes, recipes,
parity records, and platform lab notes. These documents support work on the
framework; the app-building guides for downstream users live in `docs/`.

## Start here

- [Repository orientation](repository.md) — packages, apps, and project layout.
- [Implementation invariants](architecture.md) — rules for shared and platform code.
- [Source context](source-context.md) — how to trace source and impact.
- [Toolchain](toolchain.md) — install, build, lint, and package workflows.
- [Temporary host files](host-artifacts.md) — disposable task folders and retained-work boundaries.
- [Probes and tests](testing.md) — investigation and maintained coverage.
- [Single-case probing](probing.md) — repository-local runner and platform prerequisites.
- [Release navigation checks](navigation-checks.md) — isolated router verification.
- [Maestro smoke runner](maestro.md) — maintained mobile journey and qualification status.
- [Argent checks](argent.md) — stable-ID regressions and target evidence.
- [Packed Android starter tests](android-starter-tests.md) — isolated consumer qualification.
- [AppKit verification](appkit-verification.md) — geometry, overlays, and packed consumers.
- [Documentation guidance](documentation.md) — audience and coverage rules.
- [Documentation quality system](documentation-quality.md) — review docs and
  package READMEs, run checks, and prevent recurring gaps.
- [Exploration and Silo](exploration.md) — research and decision workflow.
- [Upstream limitations](upstream-limitations.md) — record upstream constraints
  and local workarounds.
- [Releases](releases.md) — package and publication workflow.

## Working records

- [Docs UI and host boundaries](docs-site.md) — shared presentation components
  and the remaining browser integrations.

- [Image manipulation](notes/image-manipulator.md) — frame/output ownership,
  platform boundaries, and programmatic pixel evidence.

- [October 2026 documentation audit](documentation-audit.md) — recurring reader
  problems, the maintenance system, and refinement boundaries.

- [Native drawer dependency review](native-drawer.md) — optional plugin boundary, gesture value, and follow-up acceptance criteria.

- [Screen layers](screen-layers.md) — retained-screen composition, consumer evidence, and geometry fixture.

- [Workshop chrome](workshop-chrome.md) — presentation boundaries, references and verification limits.

- [Native Screen bounds](screen-safe-area.md) — first layout, prepared Pages, and inset ownership.
- [Software keyboard handling](keyboard.md) — native movement and focused-input feasibility boundaries.
- [Keyboard shortcuts](shortcuts.md) — Shared engine boundaries and desktop input evidence.
- [Implementation notes](notes/README.md) — current implementation observations and evidence.
- [Recipes](recipes/README.md) — internal workflow specifications and coverage contracts.
- [Platform parity records](parity/README.md) — parity coverage and platform investigations.
- [Probe references](probes/README.md) — internal evidence harness and run-policy notes.
- [Windows test-host runbook](windows-test-host.md) and [lab log](windows-lab.md) — framework harness setup and evidence.
- [Design notes](../design/README.md) — decisions, proposals, and design research.
- [External prior art](../references/prior-art/README.md) — source systems used for comparison.

- [Query cache engine evidence](../design/query-cache-engine.md) — Octane wrapper and AppKit action limitations.

- [Bamboo build participation](bamboo-build-environments.md) — custom Vite
  builders, unused SSR environments, and the upstream accounting contract.
- [Optional Web rendering host and hydration evidence](notes/web-rendering-host.md)

Reusable fixtures and patch sources are in
[platform qualification tooling](../../tools/platform-qualification/README.md)
and [desktop audit tooling](../../tools/desktop-support/README.md).
[Operational state and raw evidence](exploration.md#operational-evidence) stay
in Silo/local storage. Plans are maintained outside `.agents/`.
