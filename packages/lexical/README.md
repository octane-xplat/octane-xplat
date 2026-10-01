# `@octane-xplat/lexical`

The unified rich-text facade, lexical flavor: one `LexicalEditor` component
across web and native. Web renders a fixed-plugin `LexicalComposer` through
`@octanejs/lexical`; native renders the `@octane-xplat/richtext` leaf
(WordPress Aztec on Android, iOS stub) and layers lexical serialized editor
state on top through the DOM-free slices (`lexical`, `@lexical/html`, the
Aztec-shaped node packages) with a `zeed-dom` parse shim. No DOM-bound
lexical code ever enters a native bundle — divergence lives at the
file-suffix boundary.

```ts
import { LexicalEditor, supported } from '@octane-xplat/lexical'
```

`value`/`onChange` exchange document HTML. `getJSON`/`setJSON` exchange
lexical serialized editor state (`EditorState.toJSON()`): synchronous on
web, bridged on native after `onJSONReady(true)` — the lazy bridge reports
`false` (and `getJSON()` returns `null`) on runtimes that cannot host the
document-model modules. On native, HTML is the canonical interchange
format; serialized state is a best-effort mapping.

The facade's plugin set is fixed on purpose. Apps needing custom nodes,
plugins, or transforms import `@octanejs/lexical` directly on web — the
facade does not expose a composer/plugin surface it cannot honor on
native. There is no live `LexicalEditor` on native: no `dispatchCommand`,
no node transforms; `native` returns the `AztecText` and the headless
editor used for conversions is an internal detail.

The lexical family pins to `0.51.0` and `@octanejs/lexical` to `0.2.0`
(peers `octane ^0.6.0`). `@lexical/link` carries a workspace patch for its
ICU-dependent URL-matcher literal. See
[`docs/rich-text.md`](../../docs/rich-text.md) for the shared contract,
format vocabulary, and known limits.
