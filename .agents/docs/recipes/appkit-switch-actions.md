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

## Documentation

- AC1: [Switch save guide](../../../docs/app/components.md#save-a-switch-setting-on-appkit) and [authored pending/order tests](../../../packages/ui/src/switch.macos.mobile.test.tsrx). Tests are unrun.
- AC2: The same guide and tests describe rollback, teardown and Field blocking.
- AC3: [Target progress](../parity/appkit-progress.md#appkit-switch-save-actions) records source-only evidence and exact deferred commands. Native qualification remains open.
