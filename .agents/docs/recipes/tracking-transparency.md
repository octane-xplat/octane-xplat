# Request tracking authorization from an app action

ID: tracking-transparency
Targets: web, ios, android, macos, linux, windows
Related APIs: @octane-xplat/tracking-transparency, useTrackingPermissions, requestTrackingPermissionsAsync, getAdvertisingIdAsync

## Starting point

A running app with an explicit consent action. Native apps rebuild the plugin;
iOS requests configure their real tracking purpose string. Android compilation
and runtime are deferred. No real advertising identifier is needed for checks.

## Requirements

- Read authorization without prompting and request only from explicit actions.
- Preserve denial, restriction, no-gate and configuration failures.
- Keep hook readers isolated from stale work and late mount effects.
- Retrieve identifiers without blocking Android's JS/UI thread or retaining IDs.
- Distinguish OS permission, app consent, platform capabilities and qualification.

## Acceptance criteria

- AC1: A reader can install/rebuild, configure the iOS purpose string, read without prompting and request from an active app action, with visible errors for missing configuration or inactive apps.
- AC2: Expo-shaped responses preserve denial/restriction distinctions and no-gate hosts do not imply app consent; concurrent requests share work and failure permits explicit retry.
- AC3: The Octane tuple reads by default, refuses automatic prompting, preserves immediate explicit actions and ignores superseded/unmounted results.
- AC4: Advertising-ID access is explicit, normalizes absent/zero values, avoids completed-result caching and logs, and uses Android's worker-thread async path with documented native setup.
- AC5: Capabilities and documentation distinguish ATT from identifier access, native platform subsets, actual test evidence, deferred Android compilation/runtime and unqualified real prompt/device/installed-consumer behavior.

## Documentation

- AC1: [Setup and action](../../../packages/tracking-transparency/README.md#request-from-an-app-action), [maintained helper](../../../packages/tracking-transparency/examples/tracking-actions.ts) and [native guard fixture](../../../packages/tracking-transparency/tests/runtime.ios.ts).
- AC2: [Responses and no-gate semantics](../../../packages/tracking-transparency/README.md#platforms-and-qualification) and [service tests](../../../packages/tracking-transparency/tests/service.test.ts).
- AC3: [Hook](../../../packages/tracking-transparency/README.md#read-permission-in-an-octane-component) and [component tests](../../../packages/tracking-transparency/tests/use-tracking-permissions.web.test.tsx).
- AC4: [Identifiers](../../../packages/tracking-transparency/README.md#advertising-identifiers), [Android worker](../../../packages/tracking-transparency/platforms/android/java/com/octanexplat/tracking/TrackingBridge.java) and [ads initialization](../../../packages/ads/README.md#show-a-banner).
- AC5: [Qualification](../../../packages/tracking-transparency/README.md#platforms-and-qualification) and [owning evidence](../notes/tracking-transparency.md).
