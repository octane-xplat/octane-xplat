# Reveal secondary row actions on AppKit

ID: appkit-container-reveal
Targets: macos
Related APIs: useContainerReveal, UseContainerRevealOptions, UseContainerRevealReturn

## Starting point

A file list needs secondary actions revealed by pointer hover or keyboard focus,
as in the Astryx sandbox's file-row example. Actions must remain reachable.

## Acceptance criteria

- AC1: The AppKit export selects its own hook leaf and registers native-compatible CSS; the shared API stays isEnabled plus container/content prop getters. Missing hover/focus tracking or disabled reveal leaves actions visible.
- AC2: Hover or descendant focus reveals actions; leaving both hides them. Nested containers reset inherited opacity; moving focus among descendants must not hide the current row. Actions stay mounted with reserved layout space, without visibility/display/pointer/Tab suppression or transitions. Document the native reserved-space difference from web.
- AC3: Capability requires an actual native focus-observer token and hover target. Failed/missing focus registration can retry without a false installed flag. Reuse renderer tracking and teardown instead of per-hook monitors.
- AC4: Maintain cascade/observer cases and an idle manual fixture. Separate syntax/source evidence and simulated pseudo dispatch from actual tracking-area hover, OS Tab/field-editor focus, AX, layout and clean native packaging qualification.

## Documentation

- AC1–AC4: [App guide](../../../docs/app/components.md#media-contrast-and-row-actions), Octane primitive reference and [target note](../exploration.md#operational-evidence).
- AC2–AC4: Two new cases in [CSS machinery tests](../../../packages/macos-renderer/test/css-machinery.test.ts) and [manual fixture](../../../examples/probes/container-reveal.macos.tsrx), all unrun. Simulated cascade/notification cases cannot prove OS input or accessibility.
