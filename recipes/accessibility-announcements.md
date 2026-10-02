# Announce a status without moving focus

ID: accessibility-announcements
Targets: web, ios, android, macos
Related APIs: announce, @octane-xplat/platform

## Starting point

An app with a status change such as saving a setting. The app keeps a visible
status message and uses the platform service for assistive technology.

## Requirements

Request a short, localized announcement after a status changes, preserve focus,
and understand target differences and the limits of delivery evidence.

## Acceptance criteria

- AC1: Import and call `announce(text)` after a status change while retaining a visible status message and keyboard focus.
- AC2: On macOS AppKit, understand blank text, repeated calls, startup without a window, closed windows, and host termination without relying on queued delivery.
- AC3: Distinguish API dispatch from actual screen-reader speech or braille and verify delivery with assistive technology on each intended target.

## Documentation

- AC1: [Announce a status](../docs/platform-services.md#announce-a-status), [maintained example](../examples/accessibility/announce-status.ts).
- AC2: [Announce a status](../docs/platform-services.md#announce-a-status).
- AC3: [Announce a status](../docs/platform-services.md#announce-a-status).
