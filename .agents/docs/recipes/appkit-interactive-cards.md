# Open and select AppKit cards

ID: appkit-interactive-cards
Targets: macos
Related APIs: ClickableCard, SelectableCard

## Starting point

A collection screen opens a help URL or requests a controlled selection change.

## Acceptance criteria

- AC1: ClickableCard sanitizes href before platform opening, invokes onPress afterward, blocks disabled activation and uses link/button semantics according to href presence.
- AC2: Both leaves host primitive children while preserving supplied child components and forward variant/elevation classes. Preserve existing dimension/padding behavior.
- AC3: SelectableCard requests the opposite state while display remains parent-owned; updates retain the checkbox host and disabled state blocks actions.
- AC4: Separate authored handler/host cases from OS URL launch, nested-control gesture arbitration, focus, appearance and packaging. Keep disabled-focus runtime/bridge qualification and native browser-target gaps visible.

- AC5: Disabled SelectableCard retains opt-in focus eligibility without activation. Reference-counted claims release on enablement/detach, respect hiding/Tab suppression/scope ownership, and remain eligible inside FocusScope without admitting disabled native fields.

## Documentation

- AC1: [Interactive card guide](../../../docs/app/interactive-actions.md#interactive-cards) and [authored source cases](../../../packages/ui/src/components/actions/interactive-cards.macos.mobile.test.tsrx). Tests unrun.
- AC2: [AppKit card qualification](../../../docs/app/interactive-actions.md#appkit-card-qualification) and the same source cases.
- AC3: The guide and source cases cover controlled requests/feedback and retained checkbox semantics.
- AC4: [Target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-interactive-card-links-and-text-hosts) records scope and exact deferred commands.

- AC5: [Disabled-card source contract](../../../packages/macos-renderer/README.md#focus-on-disabled-selection-cards), authored renderer ownership and UI card/FocusScope cases, and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#disabled-selectable-card-focus-ownership). All tests unrun.
