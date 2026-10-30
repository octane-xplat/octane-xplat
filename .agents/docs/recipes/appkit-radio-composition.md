# Compose AppKit radio choices

ID: appkit-radio-composition
Targets: macos
Related APIs: RadioList, RadioListItem, Field

## Starting point

A form choosing one plan, using option data or child parts.

## Acceptance criteria

- AC1: Options and child items share controlled/default selection, report changes once and honor group/item disabled/read-only state. Preserve state/hosts when metadata changes and leave standalone items presentational.
- AC2: Render descriptions/trailing content, standalone Field metadata and inherited metadata ownership. Native rows expose radio names and checked state; the root export selects the target child leaf. Keep indicator registry support.
- AC3: Distinguish source/direct-dispatch cases from real native pointer/Enter/Space, group/VoiceOver relationships, layout and packaging. Keep native arrow/roving Tab qualification and unsupported toolbar-specific behavior explicit.

- AC4: Ordinary form groups register native option/child hosts, keep one owned Tab candidate, and request selection after successful Arrow/Home/End focus. Respect RTL, skip disabled/hidden items, preserve modifiers/composition and trailing-child keys, suppress keys for blocked groups, and release registration/observer/Tab ownership on teardown. Controlled parents retain checked-state ownership.

- AC5: Held row/key handlers observe current inherited group and per-row state, callback and registered value. Reject removed/retired/nested selections; suppress duplicate uncontrolled selection before render, keep controlled feedback authoritative and preserve callback-driven focus choices. Per-binding cleanup must not remove a newer registration.

## Documentation

- AC1: [AppKit radio guide](../../../docs/app/components.md#radio-choices-on-appkit) and [authored composition cases](../../../packages/ui/src/components/forms/radio-list.macos.mobile.test.tsrx).
- AC2: The same guide/cases and [target leaves](../../../packages/ui/src/components/forms/RadioGroup.macos.tsrx); the macOS export points to RadioListItem.macos.tsrx.
- AC3: [Maintained fixture](../../../examples/probes/radio-list.macos.tsrx) checks direct selection state only; [target progress](../exploration.md#operational-evidence) records native gaps and exact deferred commands.

- AC4: [Shared native choice controller](../../../packages/ui/src/components/forms/choice-focus.macos.ts), [radio registration/guard/observer cases](../../../packages/ui/src/components/forms/radio-list.macos.mobile.test.tsrx) and [manual/automatic focus cases](../../../packages/ui/src/components/collections/tab-list.macos.mobile.test.tsrx). Native keyboard/Tab/focus/reveal/VoiceOver require separate target qualification; the fixture run hook is still direct selection only.

- AC5: [Current selection guidance](../../../docs/app/components.md#radio-choices-on-appkit), eight [authored ownership cases](../../../packages/ui/src/components/forms/radio-ownership.macos.mobile.test.tsrx) and the extended [fixture](../../../examples/probes/radio-list.macos.tsrx). [Target note](../exploration.md#operational-evidence) records exact deferred commands and separates fake dispatch from native qualification.
