# Navigate AppKit tab strips

ID: appkit-tab-navigation
Targets: macos
Related APIs: TabList, Tab, Tabs

## Starting point

A controlled settings/detail tab strip, including disabled tabs and overflow.

## Acceptance criteria

- AC1: Registered tabs use native child order and owned roving Tab exclusions. Arrows/Home/End move focus manually, skip disabled/hidden tabs, respect RTL, preserve modified/composing input and leave vertical keys to a tablist's page. Enter/Space activate through the existing press path; focus changes alone do not request selection.
- AC2: Selected/focused tabs reveal through native horizontal geometry without moving vertical page position. Handle oversized/equal-visible/invalid/unrelated geometry; observe layout/window changes and release observers/leases. Preserve explicit capability fallback and independent TabMenu scope.
- AC3: Name visible/hidden tabs, retain disabled role/state and expose tab-group/selected semantics. Distinguish authored handler/fake-geometry coverage from actual OS keys/Tab, scrolling/hit testing, VoiceOver/panel relations, layout and packaging.

## Documentation

- AC1: [AppKit tab guide](../../../docs/app/components.md#tab-strips-on-appkit), [focus controller](../../../packages/ui/src/choice-focus.macos.ts) and [authored cases](../../../packages/ui/src/tab-list.macos.mobile.test.tsrx). Tests are unrun.
- AC2: [Reveal helper](../../../packages/ui/src/tab-reveal.macos.ts), the same guide/tests and [maintained fixture](../../../examples/probes/tab-list.macos.tsrx). The run hook checks direct selection dispatch only, not keyboard or actual scroll visibility.
- AC3: [Renderer semantics](../../../packages/macos-renderer/README.md#self-drawn-control-accessibility) and [target progress](../parity/appkit-progress.md#appkit-tab-strip-focus-and-reveal) record source scope, native gates and exact deferred commands.
