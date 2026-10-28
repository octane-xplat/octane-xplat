# Clip AppKit container overflow explicitly

ID: appkit-overflow-clipping
Targets: macos
Related APIs: style.overflow, style.overflowX, style.overflowY, NSView.clipsToBounds

## Starting point

A fixed-width native container whose children exceed its bounds. Token entry
and other compact application rows need this renderer prerequisite.

## Acceptance criteria

- AC1: Apply explicit native bounds clipping for two clipped axes and explicit visibility for two visible axes. Resolve shorthand and axis overrides from the final style; keep rounded layer masking independent.
- AC2: Restore the original native clip on style/class removal, null and unsupported mixed/scrolling forms. Preserve specialized-view and OS defaults; replacement views own a new baseline. Unowned clipping survives unrelated styles. Report unsupported forms rather than imply scroll-container support.
- AC3: Keep source-slice evidence separate from native drawing/hit-testing/AX/shadow/resize/package behavior; record exact deferred commands. Tokenizer geometry/row refs/counter layout remain separate work.

## Documentation

- AC1: [Renderer subset](../../../packages/macos-renderer/README.md#clip-appkit-container-overflow), [style adapter](../../../packages/macos-renderer/src/index.ts) and six authored [source-slice cases](../../../packages/macos-renderer/test/style-reconcile.test.ts), all unrun.
- AC2: The same source/cases and [styling skill](../../skills/octane-xplat/references/styling.md) distinguish baseline restoration, matching axes, native replacement and unsupported forms.
- AC3: [Target note](../parity/appkit-progress.md#appkit-native-overflow-clipping-prerequisite) and [manual fixture](../../../examples/probes/overflow-clip.macos.tsrx). The fixture runner only waits/records; no native behavior is qualified.
