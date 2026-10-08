# Add rich text editing

ID: rich-text-editing
Targets: web, ios, android, macos
Related APIs: @octane-xplat/tiptap, @octane-xplat/lexical, @octane-xplat/richtext, TiptapEditor, LexicalEditor, RichTextEditor, ensureJSONBridge

## Starting point

A scaffolded Octane xplat app with web, iOS, Android, or experimental AppKit targets. The reader can add a leaf package and use
the platform file-suffix boundary for divergent imports.

## Requirements

- Render an editable rich-text surface on web (tiptap `Editor`) and Android
  (WordPress Aztec `AztecText`), plus iOS (AztecEditor-iOS Swift facade),
  through one shared component.
- Exchange content as HTML on the supported platforms and as tiptap document JSON on
  platforms whose runtime can host the DOM-free ProseMirror slices.
- Keep DOM-bound tiptap code (`EditorView`) out of Android native execution;
  AppKit hosts its engine inside a local WKWebView document. Platform
  divergence happens at the package's file suffixes, not in app code.
- Surface unsupported platforms through `supported` and an explicit stub
  rather than a runtime crash.

## Acceptance criteria

- AC1: An app installs `@octane-xplat/tiptap` and renders `TiptapEditor` with
  `value`/`onChange`/`ref` on web, iOS, Android, and AppKit without platform branching.
- AC2: Toolbar-style integrations drive formatting through
  `handle.apply(format)`/`linkTo`/`undo`/`redo` and read active state through
  `isActive`/`onSelectionChange` on the supported backends, with their documented engine limits.
- AC3: Docs state which tiptap formats are shared, which are unavailable on each platform and how rejected calls are reported, and
  that HTML is the canonical Android interchange format and AppKit keeps
  each engine’s live JSON model.
- AC4: `getJSON`/`setJSON` work on Android once `onJSONReady(true)` fires and
  degrade to `null` cleanly where the JSON bridge cannot load.
- AC5: iOS mounts AztecEditor-iOS and reports `supported === true`. Both
  facades expose HTML and fixed-schema JSON interchange; unsupported task-list
  and alignment requests fail explicitly before mutating the document.
- AC6: Maintained examples render the iOS editing surface rather than claiming
  a stub; targeted native tests/probes cover both facade readiness and content
  precedence. The Android sweep probes Aztec mount, initial-HTML rendering,
  `toggleFormatting`, `undo`, and both facades' JSON bridges.
- AC7: The lexical variant (`LexicalEditor`, `@octane-xplat/lexical`)
  exchanges lexical serialized editor state — the two facades' JSON shapes
  are not interchangeable, and docs say so. On web, `web.nodes` adds custom
  node classes and `web.plugins` composes Octane plugin components inside the
  composer; `replaceNodes` and `replacePlugins` explicitly select caller-owned
  node and plugin sets. Native ignores `web` and retains its existing
  conversion/editing boundary.

- AC8: On AppKit, all three facades load bundled editor documents without a
  server, report readiness, exchange HTML (and the facade’s own JSON), accept
  external controlled updates without replaying an unchanged input, and
  dispose their views on unmount. Docs explain asynchronous commands and
  snapshot getters, frame styling, engine gaps, and runtime evidence limits.
- AC9: On web, callers extend the mounted tiptap `Editor` through the
  `web` prop — extra `Extension`/`Node`/`Mark` entries append after
  StarterKit, `starterKit` options configure or remove the kit, and a
  caller `starterKit` entry never double-registers. Docs state the
  boundary: iOS/Android (Aztec) and AppKit ignore `web` options.
- AC10: On web, the lexical facade reports `onJSONReady(true)` once its live
  handle exists, forwards focus and blur events, and covers mount, editable
  mode, controlled HTML updates, history, disposal/remount, plus a custom node
  JSON/HTML round-trip in component and real-browser smoke tests.

- AC11: Native JSON takes precedence over later HTML prop updates. Removing
  JSON or calling `setHTML` cancels parked JSON; latest edited/replaced content
  survives host recreation, and the facade ref follows the replacement handle.

## Documentation

- AC1: [Install and import](../docs/app/rich-text.md#install-and-import) and the
  maintained examples [`TiptapEditorDemo`](../packages/demos/src/TiptapEditorDemo.tsrx),
  [`RichTextEditorDemo`](../packages/demos/src/RichTextEditorDemo.tsrx).
- AC2: [The shared contract](../docs/app/rich-text.md#the-shared-contract) handle table.
- AC3: [The shared contract](../docs/app/rich-text.md#the-shared-contract) and
  [JSON interchange on native](../docs/app/rich-text.md#json-interchange-on-native).
- AC4: [JSON interchange on native](../docs/app/rich-text.md#json-interchange-on-native);
  the `tiptap-probe` demo exercises the bridge end-to-end.
- AC5: [What is not there yet](../docs/app/rich-text.md#what-is-not-there-yet) and
  the `supported` flag in [Install and import](../docs/app/rich-text.md#install-and-import).
- AC6: [`packages/app/src/platform/demosweep.ts`](../packages/app/src/platform/demosweep.ts)
  — `richtext-editor`/`tiptap-editor`/`lexical-editor` catalog steps plus the
  Android `runAndroidLeafProbes` block.
- AC7: [Lexical variant](../docs/app/rich-text.md#lexical-variant) and
  [`LexicalEditorDemo`](../packages/demos/src/LexicalEditorDemo.tsrx); the
  `lexical-probe` demo verifies the native conversion path on-device.

- AC8: [macOS AppKit editing](../docs/app/rich-text.md#macos-appkit-editing),
  [isolated WebKit fixture](../packages/richtext/test/verify-wk.mjs), and
  [packed AppKit consumer](../packages/richtext/test/packed-consumer.mjs).
- AC9: [Web engine extensions](../docs/app/rich-text.md#web-engine-extensions);
  `packages/tiptap/src/TiptapEditor.web.test.tsrx` covers the schema/command
  and StarterKit-replacement behavior.
- AC10: [`packages/lexical/README.md`](../packages/lexical/README.md) documents
  the web-only customization boundary;
  [`LexicalEditor.web.test.tsrx`](../packages/lexical/src/LexicalEditor.web.test.tsrx)
  covers the component contract. Run
  `pnpm --filter @xplat/web smoke:lexical-editor` to exercise real Chromium
  keyboard input, history, controlled updates, focus, custom nodes, read-only
  mode, and remount lifecycle without inspecting screenshots.

- AC11: [Format subset and controlled content](../docs/app/rich-text.md#format-subset)
  and both packages' `*.mobile.test.ts` regression suites. These object-driver
  tests simulate readiness and replacement hosts; they do not prove OS input.
