# Send a local notification

ID: local-notifications
Targets: web, ios, android, macos
Related APIs: @octane-xplat/notifications, notifications.supported, notifications.ensure, notifications.impl.notify, permissions.ensure

## Starting point

A working app on a supported target. The reader can connect an async function
to a button press. This workflow sends immediate device-local messages only.

## Requirements

- Install the leaf and ask for permission before sending a message.
- Handle unavailable and denied permissions and optional message bodies.
- Package native macOS sources through the existing CLI workflow.
- Understand the API and verification limits without confusing local and push delivery.

## Acceptance criteria

- AC1: The reader installs the leaf and sends a title and optional body from a press handler after permission is granted.
- AC2: The reader handles denied and unsupported outcomes and can use the shared permission dispatcher after importing the leaf.
- AC3: On macOS, the reader builds the native leaf in a packaged AppKit app without host changes or push configuration.
- AC4: The reader distinguishes immediate submission from OS presentation and understands scheduling/cancellation, foreground, and push boundaries.

## Documentation

- AC1: [Install and send](../docs/platform/local-notifications.md#install-and-send) and [maintained handler](../packages/notifications/tests/send-reminder.ts).
- AC2: [Install and send](../docs/platform/local-notifications.md#install-and-send).
- AC3: [Native macOS setup and behavior](../docs/platform/local-notifications.md#native-macos-setup-and-behavior).
- AC4: [Native macOS behavior](../docs/platform/local-notifications.md#native-macos-setup-and-behavior) and [verification boundary](../docs/platform/local-notifications.md#verification-boundary).
