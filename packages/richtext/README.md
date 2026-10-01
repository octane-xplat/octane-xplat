# `@octane-xplat/richtext`

The native rich-text editing leaf: WordPress Aztec's `AztecText` on Android —
a `Spannable`-backed `EditText`, not a WebView. iOS mounts an unsupported
placeholder until the Aztec-iOS Swift facade lands; web, macOS, and Windows
return `supported: false` (the `@octane-xplat/tiptap` facade covers web).

```ts
import { RichTextEditor, supported } from '@octane-xplat/richtext'
```

Content in/out is document HTML via Aztec `fromHtml`/`toPlainHtml`. The
`bind` callback returns an imperative handle (`getHTML`/`setHTML`,
`apply(format)`, `linkTo`/`removeLink`, `isActive`, `undo`/`redo`,
`focus`/`blur`, `native`) once the editor exists, and `onSelectionChange`
reports the active `RichTextFormat` set at the caret.

The Android Aztec dependency (`org.wordpress:aztec:v2.1.7`) arrives through
the leaf's `platforms/android/include.gradle` — no app-level gradle work.
See the framework guide for the full contract and the demo:
[`docs/rich-text.md`](../../docs/rich-text.md) and
[`packages/demos/src/RichTextEditorDemo.tsrx`](../demos/src/RichTextEditorDemo.tsrx).
