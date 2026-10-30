# Choose native AppKit label overflow with CSS

ID: appkit-text-overflow-css
Targets: macos
Related APIs: Text, white-space, text-overflow, maxLines, NSTextField

## Starting point

An experimental native macOS app has a bounded Text/label title. Shared sandbox
examples already request nowrap through styles; table classes request inherited
whitespace. These sources do not establish native drawing or table ellipsis.

## Requirements

Honor the supported label CSS modes without changing explicit host-prop limits,
truncating source text or claiming broader browser typography semantics.

## Acceptance criteria

- AC1: Consume normal/nowrap and clip/ellipsis CSS on labels when explicit mode props are absent; preserve maxLines and direct-prop validation. Reconcile cascade replacement/removal, inherited white-space and non-inherited text-overflow. Unsupported CSS modes warn by property and default without retaining stale native modes.
- AC2: Recompose current paragraph mode/alignment for attributed labels, including decoration/spacing without line-height. Retain the full source string, respect explicit height/line-height, and release an implicit one-line pin when wrapping returns.
- AC3: Reconcile public guide, renderer README, Octane reference, feature note and target note with seven authored source cases and an idle CSS/width/content/line-limit fixture. Keep measurement, native painting/resize, copy/selection, VoiceOver/lifetime/installed/pixel verification pending; distinguish the Table whitespace prerequisite from complete table ellipsis.
- AC4: Resolve label CSS physical/center/justify and logical start/end alignment from the final effective direction/alignment pair, including inheritance, local override, removal, default start edge and unsupported-value diagnostics without coercion. Preserve the grabber baseline and skip unchanged native alignment writes; refresh attributed paragraphs. Prepare five source cases plus paragraph assertion and idle direction/alignment controls, while keeping CSS bidi/vertical/per-span/provider bridging and native/installed/visual qualification explicit.

## Documentation

- AC1: [Guide](../../../docs/app/styling.md#appkit-text-wrapping), [host subset](../../../packages/macos-renderer/README.md#choose-label-overflow-with-css), [mode models](../../../packages/macos-renderer/test/text-overflow.test.ts) and [maintained table CSS cascade models](../../../packages/macos-renderer/test/style-reconcile.test.ts).
- AC2: [Renderer contract](../../../packages/macos-renderer/README.md#choose-label-overflow-with-css), [source helper](../../../packages/macos-renderer/src/index.ts) and [paragraph/sizing models](../../../packages/macos-renderer/test/text-overflow.test.ts).
- AC3: [Idle fixture](../../../examples/probes/text-overflow-css.macos.tsrx), [fixture CSS](../../../examples/probes/text-overflow-css.macos.css), [skill](../../skills/octane-xplat/references/styling.md#appkit-label-overflow-css), [feature note](../../../.changelog/appkit-text-overflow-css.md) and [target note](../exploration.md#operational-evidence). All tests/compiler/native/installed/visual checks require separate execution evidence.
- AC4: [Alignment guide](../../../docs/app/styling.md#appkit-text-alignment), [renderer subset](../../../packages/macos-renderer/README.md#align-appkit-labels), [helper cases](../../../packages/macos-renderer/test/label-alignment.test.ts), [cascade cases](../../../packages/macos-renderer/test/style-reconcile.test.ts), [paragraph assertion](../../../packages/macos-renderer/test/text-styles.test.ts), [idle fixture](../../../examples/probes/text-overflow-css.macos.tsrx), [skill](../../skills/octane-xplat/references/styling.md#appkit-label-alignment) and [target note](../exploration.md#operational-evidence). All cases/compiler/native/installed/visual checks require separate execution evidence.
