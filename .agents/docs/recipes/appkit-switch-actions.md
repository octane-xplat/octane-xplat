# Save an AppKit switch setting

ID: appkit-switch-actions
Targets: macos
Related APIs: Switch, Field

## Starting point

A settings toggle whose changeAction saves the requested value asynchronously.

## Acceptance criteria

- AC1: Call onChange before changeAction, report pending busy state and prevent overlapping actions. Keep uncontrolled state on success; controlled display follows the parent.
- AC2: Rejection and synchronous action failure restore the previous uncontrolled state and report it through onChange. Ignore completion after unmount and honor inherited disabled/read-only Field state.
- AC3: Distinguish object-driver handler coverage from native keyboard/click activation, focus, busy/loading presentation, accessibility and packaging qualification.

- AC4: Standalone labels, descriptions and detached status render once; enclosing Field owns metadata instead. Label-side/spacing, hidden accessible names, size classes and style forms preserve the toggle host/state. Keep native label-click/focus qualification explicitly open.

- AC5: Route label presses through the same toggle/save owner, focus the actual control and prevent a second sequential Tab stop. Release only the label's suppression claim on detach. Block disabled/read-only/pending labels and avoid enabling an extra target when the bridge capability is absent.

- AC6: Claim toggle ownership before onChange reentry and read current props from cached native handlers. Preserve event save dispatch after onChange detaches UI without publishing pending/rollback to that UI. Release ownership on forward callback failure and log/release rollback callback faults without an unhandled settlement rejection. Keep native lifecycle evidence separate.

## Documentation

- AC1: [Switch save guide](../../../docs/app/components.md#save-a-switch-setting-on-appkit) and [authored pending/order tests](../../../packages/ui/src/switch.macos.mobile.test.tsrx). Tests are unrun.
- AC2: The same guide and tests describe rollback, teardown and Field blocking.
- AC3: [Target progress](../parity/appkit-progress.md#appkit-switch-save-actions) records source-only evidence and exact deferred commands. Native qualification remains open.

- AC4: [Metadata usage and label-click qualification](../../../docs/app/components.md#save-a-switch-setting-on-appkit), [source cases](../../../packages/ui/src/switch.macos.mobile.test.tsrx) and [metadata fixture](../../../examples/probes/switch.macos.tsrx). Native layout, focus and accessibility remain unqualified.

- AC5: [Shared label action and limits](../../../docs/app/components.md#save-a-switch-setting-on-appkit), [lease/activation source](../../../packages/ui/src/label-press.macos.tsrx) and [authored dispatch/cleanup cases](../../../packages/ui/src/switch.macos.mobile.test.tsrx). Native hit testing, focus/Tab, tooltip arbitration and accessibility remain unqualified.

- AC6: [Switch save guide](../../../docs/app/components.md#save-a-switch-setting-on-appkit), four added source cases and [target note](../parity/appkit-progress.md#appkit-switch-callback-ownership). All added cases and native checks remain unrun.
