# `@octane-xplat/tiptap`

The unified rich-text facade: one `TiptapEditor` component across web and
native. Web renders a real tiptap `Editor` through `@octanejs/tiptap`'s
`EditorContent`; native renders the `@octane-xplat/richtext` leaf (WordPress
Aztec on Android, iOS stub) and layers tiptap document JSON on top through
the DOM-free ProseMirror slices (`@tiptap/pm`, `@tiptap/static-renderer`)
with a `zeed-dom` parse shim. No DOM-bound tiptap code (`EditorView`) ever
enters a native bundle — divergence lives at the file-suffix boundary.

```ts
import { TiptapEditor, supported } from '@octane-xplat/tiptap'
```

`value`/`onChange` exchange document HTML. `getJSON`/`setJSON` exchange
tiptap document JSON: synchronous on web, bridged on native after
`onJSONReady(true)` — the lazy bridge reports `false` (and `getJSON()`
returns `null`) on runtimes that cannot host the schema modules. On native,
HTML is the canonical interchange format; JSON output is a best-effort
mapping of Aztec's flat span list onto ProseMirror's tree.

The tiptap family pins to `3.28.0` to match `@octanejs/tiptap@0.0.51` —
extension `^` ranges float ahead of core and break (`getPreviousBlockSibling`),
so consumers should keep the workspace override. See
[`docs/rich-text.md`](../../docs/rich-text.md) for the shared contract,
format vocabulary, and known limits.
