# Add advanced haptics

ID: advanced-haptics
Targets: web, ios, android
Related APIs: `@octane-xplat/haptics`, `createHaptics`, `HapticPattern`, `HapticSession`

## Starting point

A scaffolded Octane xplat app with one interaction that needs richer tactile
feedback than the basic `@octane-xplat/platform` impact, notification, and
selection service. Package publication is outside this workflow.

## Requirements

- Add only the optional haptics package; do not add its dependencies to `@octane-xplat/ui`.
- Check target capability before relying on patterns or realtime gesture feedback.
- Stop gesture feedback on release, cancellation, and owner cleanup.

## Acceptance criteria

- AC1: The app plays a preset and a timed pattern through the same shared package API.
- AC2: A gesture updates realtime feedback and always stops it on release or teardown.
- AC3: Unsupported web or device capabilities are observable and do not throw.

## Documentation

- AC1: [Advanced haptics](../docs/media-services.md#advanced-haptics).
- AC2: [Advanced haptics](../docs/media-services.md#advanced-haptics). Gap: The probe uses press-in/out; a complete gesture cancellation and teardown example is still missing.
- AC3: [Advanced haptics](../docs/media-services.md#advanced-haptics).
