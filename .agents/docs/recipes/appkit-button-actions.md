# Save and open help with AppKit buttons

ID: appkit-button-actions
Targets: macos
Related APIs: Button, ButtonGroup, Pressable

## Starting point

An ordinary form has a save action and a help link. The save may return a promise.

## Acceptance criteria

- AC1: Forward inherited press/layout/accessibility/ref props, wrap primitive children in native text hosts, retain content under busy presentation and expose an accessible busy/name state.
- AC2: Block noninterruptible duplicate/reentrant presses immediately. Allow interruptible overlap while reporting busy until all calls settle; explicit/group disablement wins. Report synchronous/rejected failures and stop pending UI writes after unmount.
- AC3: Sanitize href before calling the platform opener, then run clickAction. Block unsafe schemes; disabled links do not open. Native target browsing contexts are unsupported.
- AC4: Keep source/object-driver cases separate from actual click/keys, OS URL opening, geometry, VoiceOver and packaged results. Retain the tooltip presentation gap.

- AC5: IconButton delegates to the same Button owner, preserving accessible name, icon/content hosts, refs/metadata, group defaults/disablement and sanitized links.

- AC6: Held Button/IconButton presses use current props/group/loading/interruptibility and active tokens before render. Claim before URL effects; preserve captured accepted action/error callbacks and pending work across prop/ref replacement, release claims on URL/action/then-access errors, and reject detached handlers. Keep URL error propagation, interruptible overlap and accepted app work after teardown explicit. Distinguish source models/manual fixture from OS input/opening/focus/AX/installed verification.

## Documentation

- AC1: [Button source contract and examples](../../../docs/app/components.md#appkit-button-actions-and-links) and [authored object-driver cases](../../../packages/ui/src/button.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same contract/cases cover token ownership, overlap, failure reporting, group/loading gates, ref changes and unmount.
- AC3: The same source cases cover normalized URL opening, ordering, unsafe schemes and disabled links. No OS opening result is claimed.
- AC4: [Target note](../parity/appkit-progress.md#appkit-button-links-and-busy-actions) records exact deferred commands and remaining native evidence.

- AC5: [AppKit action guide](../../../docs/app/components.md#appkit-button-actions-and-links) and appended IconButton cases in the same authored Button suite; tests unrun.

- AC6: [Current Button guide](../../../docs/app/components.md#appkit-button-actions-and-links), eight new [authored object-driver cases](../../../packages/ui/src/button.macos.mobile.test.tsrx) (sixteen total), [human-operated fixture](../../../examples/probes/button-actions.macos.tsrx), [target leaf](../../../packages/ui/src/Button.macos.tsrx), Octane primitive reference and [target note](../parity/appkit-progress.md#appkit-button-current-press-ownership). Cases and fixture remain unrun; the fixture run hook records mounting only.
