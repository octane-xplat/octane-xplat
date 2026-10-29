# Read AppKit notification permission without prompting

ID: appkit-notification-permissions
Targets: macos
Related APIs: notifications, permissions

## Starting point

The AppKit Services screen and maintained reminder example need distinct permission
reads, explicit requests and sends. The existing AppKit facade routed both permission
methods to the native authorization-request selector. Source inspection found the
mismatch; no real prompt was observed during this work.

## Acceptance criteria

- AC1: Native AppKit reads use a dedicated settings-only selector; request remains explicit. Both direct and shared-dispatcher reads preserve undetermined/granted/denied/unsupported and canAskAgain. Missing/stale/throwing capability metadata or an unbundled host is unsupported without an ensure fallback.
- AC2: Native request results read authoritative settings rather than infer denial from an error. Authorized/provisional maps to granted, unknown/nil settings to unsupported. All native completion paths dispatch to the main thread. Sending never requests authorization, preserves the application delegate and checks current settings.
- AC3: AppKit Services and the manual fixture expose separate read/request/send actions with no operation on mount. Retire pending screen-owned results and sends on teardown/replacement; explicitly distinguish submission from delivery. Existing app dependency discovery needs no manifest change.
- AC4: Maintain eight JS facade cases, intercepted-center status/error/thread guards and metadata/native-to-JS callback assertions, all unrun. Document the host rebuild requirement, ensure-only hosted-webview gap and deferred compilation, bridge, OS permission/relaunch/revocation/delivery/signing/consumer qualification. Do not close runtime gates from source coverage.

## Documentation

- AC1–AC4: [Local notification guide](../../../docs/platform/local-notifications.md), [package README](../../../packages/notifications/README.md), Octane services reference and [target note](../parity/appkit-progress.md#appkit-observational-notification-permissions).
- AC1–AC2, AC4: [Facade cases](../../../packages/notifications/tests/notifications.macos.test.ts), [intercepted center](../../../packages/notifications/tests/native-center.m) and [native verifier](../../../packages/notifications/tests/verify-macos.mjs), authored but unrun.
- AC3–AC4: [Manual fixture](../../../examples/probes/notification-permissions.macos.tsrx) and native Services screen. Mounting controls alone proves neither native callback behavior nor OS permission/delivery.
