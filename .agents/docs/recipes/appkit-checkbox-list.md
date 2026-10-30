# Compose AppKit multi-choice controls

ID: appkit-checkbox-list
Targets: macos
Related APIs: CheckboxList, CheckboxListItem, Field

## Starting point

A preferences form with multiple selected features and an optional select-all row.

## Acceptance criteria

- AC1: Options and child members share a controlled/default checked set, preserve batched uncontrolled requests, avoid duplicate membership writes and keep controlled display until parent feedback. Standalone/value-less mixed rows use isChecked/onCheck independently.
- AC2: Render descriptions/endContent, standalone Field metadata and inherited ownership/gates, native names/checked/mixed state, indicator overrides and normalized classes/styles. Root exports select the target child leaf; metadata changes retain state/hosts.
- AC3: Forward horizontal/divider hooks and keep each checkbox independently keyboard reachable. Distinguish authored source/direct-dispatch cases from actual clicks/re-enable/Tab, mixed VoiceOver, trailing-control arbitration, divider/layout appearance and packaging.

## Documentation

- AC1: [AppKit checkbox-list guide](../../../docs/app/components.md#checkbox-lists-on-appkit) and [authored selection/mixed cases](../../../packages/ui/src/components/forms/checkbox-list.macos.mobile.test.tsrx). Tests unrun.
- AC2: The guide, target leaves and same cases cover metadata/Field blocking; the macOS root export selects CheckboxListItem.macos.tsrx.
- AC3: [Maintained fixture](../../../examples/probes/checkbox-list.macos.tsrx) checks direct child selection only; [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-checkbox-list-composition) records all native gates and exact deferred commands. No runtime appearance or keyboard proof is claimed.
