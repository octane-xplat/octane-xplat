# Open System Settings on AppKit

ID: appkit-settings
Targets: macos
Related APIs: openSettings, Service, UnavailabilityError

## Starting point

A native AppKit screen offers a user action for changing a system preference
or following up a denied permission. The shared Services screen already has
an Open settings action.

## Acceptance criteria

- AC1: Check cheap native-method support separately from installed-application availability. Availability must not launch an application; missing/partial/late native bridges are reflected live.
- AC2: Launch System Settings from an explicit user action and handle a rejected lookup or launch. Understand that AppKit does not select an app-specific permission page, change permissions or confirm window presentation/activation.
- AC3: Keep the root package and selected AppKit leaf on the same service, preserve outbound-link delegation, and distinguish source/fake-host evidence from packaged native behavior.

## Documentation

- AC1: [Opening settings](../../../docs/platform/platform-services.md#open-settings), [package example](../../../packages/platform/README.md) and [bridge regressions](../../../packages/platform/tests/open-url.macos.test.mjs).
- AC2: [Opening settings](../../../docs/platform/platform-services.md#open-settings), [AppKit Services screen](../../../packages/app/src/Services.macos.tsrx) and [maintained AppKit probe](../../../examples/probes/open-settings.macos.tsrx). Gap: real System Settings launch/presentation, activation, usage after denied permissions and sandbox/packaged behavior remain unqualified.
- AC3: [Bridge regressions](../../../packages/platform/tests/open-url.macos.test.mjs) and [target progress](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#system-settings-launch). Gap: tests, declaration/type checks, package resolution and native runtime have not run. Browser settings remain unsupported; this source implementation does not qualify other desktop targets.
