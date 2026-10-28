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

## Documentation

- AC1: [AppKit radio guide](../../../docs/app/components.md#radio-choices-on-appkit) and [authored composition cases](../../../packages/ui/src/radio-list.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/cases and [target leaves](../../../packages/ui/src/RadioGroup.macos.tsrx); the macOS export points to RadioListItem.macos.tsrx.
- AC3: [Maintained fixture](../../../examples/probes/radio-list.macos.tsrx) checks direct selection state only; [target progress](../parity/appkit-progress.md#appkit-radio-options-and-child-parts) records native gaps and exact deferred commands.

- AC4: [Shared native choice controller](../../../packages/ui/src/choice-focus.macos.ts), [radio registration/guard/observer cases](../../../packages/ui/src/radio-list.macos.mobile.test.tsrx) and [manual/automatic focus cases](../../../packages/ui/src/tab-list.macos.mobile.test.tsrx). Native keyboard/Tab/focus/reveal/VoiceOver remain unqualified; the fixture run hook is still direct selection only.
