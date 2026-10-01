# Add rich text editing

ID: rich-text-editing
Targets: web, ios, android
Related APIs: @octane-xplat/tiptap, @octane-xplat/lexical, @octane-xplat/richtext, TiptapEditor, LexicalEditor, RichTextEditor, ensureJSONBridge

## Starting point

A scaffolded Octane xplat app with web and Android targets (iOS stubbed until
the Aztec-iOS Swift facade lands). The reader can add a leaf package and use
the platform file-suffix boundary for divergent imports.

## Requirements

- Render an editable rich-text surface on web (tiptap `Editor`) and Android
  (WordPress Aztec `AztecText`) through one shared component.
- Exchange content as HTML on both platforms and as tiptap document JSON on
  platforms whose runtime can host the DOM-free ProseMirror slices.
- Keep DOM-bound tiptap code (`EditorView`) out of native bundles; platform
  divergence happens at the package's file suffixes, not in app code.
- Surface unsupported platforms through `supported` and an explicit stub
  rather than a runtime crash.

## Acceptance criteria

- AC1: An app installs `@octane-xplat/tiptap` and renders `TiptapEditor` with
  `value`/`onChange`/`bind` on web and Android without platform branching.
- AC2: Toolbar-style integrations drive formatting through
  `handle.apply(format)`/`linkTo`/`undo`/`redo` and read active state through
  `isActive`/`onSelectionChange` on both backends.
- AC3: Docs state which tiptap formats are shared, which no-op on web, and
  that HTML — not JSON — is the canonical native interchange format.
- AC4: `getJSON`/`setJSON` work on Android once `onJSONReady(true)` fires and
  degrade to `null` cleanly where the JSON bridge cannot load.
- AC5: iOS renders the unsupported stub and returns `supported === false`
  instead of crashing.
- AC6: The harness covers all demos: the iOS catalog sweep asserts the stub
  state and the Android sweep probes Aztec mount, initial-HTML rendering,
  `toggleFormatting`, `undo`, and both facades' JSON bridges.
- AC7: The lexical variant (`LexicalEditor`, `@octane-xplat/lexical`)
  exchanges lexical serialized editor state — the two facades' JSON shapes
  are not interchangeable, and docs say so. Its fixed plugin set is
  intentional; custom extensions import `@octanejs/lexical` directly on web.

## Documentation

- AC1: [Install and import](../docs/rich-text.md#install-and-import) and the
  maintained examples [`TiptapEditorDemo`](../packages/demos/src/TiptapEditorDemo.tsrx),
  [`RichTextEditorDemo`](../packages/demos/src/RichTextEditorDemo.tsrx).
- AC2: [The shared contract](../docs/rich-text.md#the-shared-contract) handle table.
- AC3: [The shared contract](../docs/rich-text.md#the-shared-contract) and
  [JSON interchange on native](../docs/rich-text.md#json-interchange-on-native).
- AC4: [JSON interchange on native](../docs/rich-text.md#json-interchange-on-native);
  the `tiptap-probe` demo exercises the bridge end-to-end.
- AC5: [What is not there yet](../docs/rich-text.md#what-is-not-there-yet) and
  the `supported` flag in [Install and import](../docs/rich-text.md#install-and-import).
- AC6: [`packages/app/src/platform/demosweep.ts`](../packages/app/src/platform/demosweep.ts)
  — `richtext-editor`/`tiptap-editor`/`lexical-editor` catalog steps plus the
  Android `runAndroidLeafProbes` block.
- AC7: [Lexical variant](../docs/rich-text.md#lexical-variant) and
  [`LexicalEditorDemo`](../packages/demos/src/LexicalEditorDemo.tsrx); the
  `lexical-probe` demo verifies the native conversion path on-device.
