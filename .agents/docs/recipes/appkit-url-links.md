# Open URL links on AppKit

ID: appkit-url-links
Targets: macos
Related APIs: Link, LinkProvider, as, href

## Starting point

A native desktop screen has an external help link and app-relative navigation.

## Acceptance criteria

- AC1: Normalize/sanitize href before dispatch. External scheme URLs use the platform opener without creating an app window; relative destinations use canonical routing.
- AC2: Link wraps primitive children, forwards role/style/presentation classes and calls onPress before its default navigation. External markers are decorative.
- AC3: A function as overrides LinkProvider. Valid injection owns navigation; unsafe destinations never reach an injected component.
- AC4: Retain target/custom-intrinsic/tooltip limits. Separate authored helper/object-driver cases from native launch, actual activation, VoiceOver, inline wrapping and appearance evidence.

## Documentation

- AC1: [AppKit URL guide](../../../docs/app/navigation.md#open-links-on-appkit) and [authored helper cases](../../../packages/ui/src/components/navigation/nav-href.macos.mobile.test.tsrx).
- AC2: The same guide and [authored Link cases](../../../packages/ui/src/components/navigation/link.macos.mobile.test.tsrx).
- AC3: The same guide/cases cover function injection precedence, navigation ownership and unsafe handoff rejection.
- AC4: [Target note](../exploration.md#operational-evidence) records exact deferred commands and native evidence limits.
