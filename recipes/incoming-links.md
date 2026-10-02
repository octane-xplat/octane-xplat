# Open a screen from an incoming link

ID: incoming-links
Targets: web, ios, android
Related APIs: pushDeepLink, onDeepLink, consumeInitialUrl, registerRoutes

## Starting point

A working app with navigation configured and an existing detail route accepting
a scalar identifier. The reader can build each target. Native scope starts with
an app-owned custom URL scheme; verified HTTPS app links are a separate workflow.

## Requirements

- Connect an incoming URL to a route and its parameters.
- Explain native scheme registration and listener setup.
- Handle initial launch, an already running app, and unmatched destinations.

## Acceptance criteria

- AC1: Opening a valid browser URL directly reaches the intended detail screen with its identifier intact.
- AC2: The reader can register a native URL scheme and reproduce a cold-start and warm-start link on each native target, reaching the intended screen once.
- AC3: The reader can reproduce an unmatched or malformed link and observe the documented fallback without assuming route guards cover every URL entry path.

## Documentation

- AC1: [Route files](../docs/app/navigation.md#let-the-route-dir-name-your-routes) and [incoming links](../docs/app/navigation.md#handle-incoming-links).
- AC2: [Listener wiring](../docs/app/navigation.md#handle-incoming-links), [scheme registration](../docs/app/navigation.md#register-a-custom-scheme), and [cold/warm reproduction](../docs/app/navigation.md#reproduce-launch-and-fallback-behavior). Maintained release harness: `apps/mobile/src/navigation-entry.mobile.ts`.
- AC3: [Fallback reproduction](../docs/app/navigation.md#reproduce-launch-and-fallback-behavior) and [guard boundary](../docs/app/navigation.md#guard-and-document-a-route). Runtime status is recorded separately in Silo; blocked native runs do not count as verification.
