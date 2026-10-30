# Navigate AppKit tab strips

ID: appkit-tab-navigation
Targets: macos
Related APIs: TabList, Tab, Tabs, TabMenu

## Starting point

A controlled settings/detail tab strip, including disabled tabs and overflow.

## Acceptance criteria

- AC1: Registered tabs use native child order and owned roving Tab exclusions. Arrows/Home/End move focus manually, skip disabled/hidden tabs, respect RTL, preserve modified/composing input and leave vertical keys to a tablist's page. Enter/Space activate through the existing press path; focus changes alone do not request selection.
- AC2: Selected/focused tabs reveal through native horizontal geometry without moving vertical page position. Handle oversized/equal-visible/invalid/unrelated geometry; observe layout/window changes and release observers/leases. Preserve explicit capability fallback; overflow-menu ownership is covered separately in AC4.
- AC3: Name visible/hidden tabs, retain disabled role/state and expose tab-group/selected semantics. Distinguish authored handler/fake-geometry coverage from actual OS keys/Tab, scrolling/hit testing, VoiceOver/panel relations, layout and packaging.

- AC4: Register the TabMenu trigger with native strip focus/reveal, request first/last popup option focus from plain Down/Up, reuse menu navigation/manual selection/typeahead and current trigger-neighbor return intent. Keep selection parent-owned, guard stale/empty/reentrant/detached paths and release trigger/row/observer ownership. Distinguish authored wiring evidence from native input/focus/return/AX qualification; nonempty row-removal repair follows shared-menus AC13.

## Documentation

- AC1: [AppKit tab guide](../../../docs/app/components.md#tab-strips-on-appkit), [focus controller](../../../packages/ui/src/components/forms/choice-focus.macos.ts) and [authored cases](../../../packages/ui/src/components/collections/tab-list.macos.mobile.test.tsrx).
- AC2: [Reveal helper](../../../packages/ui/src/components/collections/tab-reveal.macos.ts), the same guide/tests and [maintained fixture](../../../examples/probes/tab-list.macos.tsrx). The run hook checks direct selection dispatch only, not keyboard or actual scroll visibility.
- AC3: [Renderer semantics](../../../packages/macos-renderer/README.md#self-drawn-control-accessibility) and [target progress](../exploration.md#operational-evidence) record source scope, native gates and exact deferred commands.

- AC4: [Overflow-tab guide](../../../docs/app/components.md#overflow-tabs-on-appkit), six object-driver cases, [maintained fixture](../../../examples/probes/tab-menu.macos.tsrx), skill guidance and [target note](../exploration.md#operational-evidence). Shared-menus AC13 now adds repair policy/surface cases and an appended TabMenu removal case.
