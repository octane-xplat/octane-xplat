# Implementation notes

These notes record framework behavior, implementation constraints, and
investigation evidence. They are internal references, not app-building
instructions. Start with the relevant contributor guide in
[`.agents/docs/`](../README.md), and check dated findings against current
source before relying on them.

## Framework and platform seams

- [Framework notes](framework-notes.md)
- [AppKit JavaScriptCore host](macos-jsc-host.md) — verified host capabilities and bridge quirks
- [MasonKit layout-engine evaluation](masonkit-layout-evaluation.md)
- [Platform notes](platform-notes.md)
- [CSS support](css-support-notes.md)
- [Module resolution](module-resolution-notes.md)
- [NativeScript runtimes: V8 without ICU](nativescript-no-icu.md)
- [Navigation](navigation-notes.md)
- [Routing transition engines and platform subsets](routing-transitions.md)
- [Routing contracts](routing-contracts.md) — declared/runtime ownership, immutable evidence, generated setup and typed reads.
- [Styling](styling-notes.md)
- [Testing](testing-notes.md)
- [Toolchain](toolchain-notes.md)

## Components and integrations

- [Animation](animation-notes.md)
- [AppKit native intrinsics](appkit-native-intrinsics.md)
- [Editor capabilities](editor-capabilities.md)
- [SVG icons](icon-svg-notes.md)
- [Image engine](image-engine-notes.md)
- [Input readiness](input-readiness-notes.md)
- [Lottie on AppKit](lottie-appkit-investigation.md)
- [Optional service qualification](optional-service-qualification.md)
- [OTA process](ota-process.md)
- [OTA update gate](ota-updates.md)
- [UI primitives](primitive-notes.md)
- [SQLite](sqlite-notes.md)

## Platform investigations and status

- [Linux GTK capability inventory](linux-gtk-capability-inventory.md)
- [Linux GTK renderer](linux-gtk-renderer.md) — v1 package status, `.gtk` seam, evidence split
- [Linux WebKit baseline](linux-webkit-baseline.md)
- [Current status](status.md)
