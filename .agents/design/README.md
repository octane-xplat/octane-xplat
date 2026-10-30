# Design notes

Design records explain lasting decisions, contracts, proposals, and rationale.
Check the owning source and public guide before applying an older design. Plans
and operational state live outside Git; use [Silo](../docs/exploration.md) for
current questions and qualification.

For implementation details and contributor workflows, see the
[implementation documentation](../docs/README.md). For app-building guidance,
start at the [public docs](../../docs/README.md).

## Core records

- [Decision ledger](decisions.md) — numbered commitments and their rationale.
- [Open questions](open-questions.md) — query and resolve the Silo queue.
- [Architecture notes](architecture-notes.md) — system shape and design context.

## Proposals and design research

- [Runtime diagnostics for agents](agent-diagnostics.md) — retained development logs, capture boundaries, and remaining diagnostic gaps.
- [Software keyboard ownership](software-keyboard.md) — window state, native tracking, and compatibility boundaries.
- [Mason core extraction](mason-core-extraction.md) — independent prototype, source preservation, and eventual upstream package boundary.
- [UI API design audit](ui-api/README.md) — proposed public surface and approved design directions.
- [Astryx parity harness](astryx-parity-harness.md) — side-by-side Astryx vs Xplat web rendering with geometry, pixel and behavior checks.
- [Charts package](charts.md)
- [Command palette interaction](command-palette.md)
- [Showcase and demos](demos.md)
- [expo-image study](expo-image-study.md)
- [iOS editor backing surface](ios-editor-backing-surface.md)
- [Linux GTK feasibility review](linux-gtk-feasibility-review.md)
- [RecyclingList lifecycle and performance investigation](recycling-list.md)
- [macOS plugin compatibility](macos-plugin-compat.md)
- [Finite selection contract](select.md)
- [Sherpa ONNX leaf package plan](sherpa-onnx.md)
- [Smooth corners package](smooth-corners.md)
- [Windows target notes](windows-notes.md)

Implementation investigations and evidence are indexed in the
[implementation notes](../docs/notes/README.md). External systems are in
[prior-art references](../references/prior-art/README.md).

- [Query cache engine](query-cache-engine.md) — engine decision, ownership contract and qualification limits.
- [Query cache qualification](query-cache-qualification.md) — maintained checks and their evidence boundaries.
