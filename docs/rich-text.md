# Rich text editing

> Editable rich text on web, Android, and (later) iOS through two packages:
> the native leaf `@octane-xplat/richtext` and the unified facade
> `@octane-xplat/tiptap`.

Web and native rich text are deliberately different backends behind one
tiptap-shaped facade. Web runs a real tiptap `Editor` via
[`@octanejs/tiptap`](https://github.com/octanejs/tiptap). Native cannot host
ProseMirror's DOM-bound `EditorView`, so Android renders WordPress Aztec's
`AztecText` — a `Spannable`-backed `EditText` — and the facade layers tiptap
document JSON on top through the DOM-free slices
(`prosemirror-model`/`prosemirror-state` via `@tiptap/pm`,
`@tiptap/static-renderer`, and `zeed-dom` as the parse shim). iOS is a stub
until the Aztec-iOS Swift facade lands.

## Install and import

For the unified component, add `@octane-xplat/tiptap` to the app:

```ts
import { TiptapEditor, supported } from '@octane-xplat/tiptap'
```

`TiptapEditor` resolves per platform at the file-suffix boundary: `.web`
adapted over `@octanejs/tiptap`, the unsuffixed native default over
`RichTextEditor`. App code does not branch on platform.

For the native editor directly (Android only today), add
`@octane-xplat/richtext`:

```ts
import { RichTextEditor, supported } from '@octane-xplat/richtext'
```

The leaf's `platforms/android/include.gradle` declares
`org.wordpress:aztec:v2.1.7` from the Automattic Maven repository — no app
gradle setup beyond a normal `ns build`. `supported` is `false` on iOS, web,
macOS, and Windows; the iOS component mounts a placeholder label instead of
an editor.

See the maintained examples
[`RichTextEditorDemo`](../packages/demos/src/RichTextEditorDemo.tsrx) and
[`TiptapEditorDemo`](../packages/demos/src/TiptapEditorDemo.tsrx).

## The shared contract

Both components take `value` (document HTML), `placeholder`, `editable`,
`autofocus`, and the callbacks `onReady`, `onChange(html)`,
`onSelectionChange({start, end, active})`, `onFocus`, and `onBlur`. `bind`
hands back an imperative handle once the native surface exists:

| Method                                 | Web (tiptap)                    | Android (Aztec)                                                                                                     |
| -------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `getHTML()` / `setHTML(html)`          | editor `getHTML` / `setContent` | `toPlainHtml` / `fromHtml` — `setHTML` resets undo history                                                          |
| `getJSON()` / `setJSON(doc)`           | tiptap `getJSON` / `setContent` | JSON bridge → HTML → Aztec; `null` until `onJSONReady(true)`                                                        |
| `apply(format)`                        | `chain().focus()` commands      | `toggleFormatting(AztecTextFormat…)`                                                                                |
| `linkTo(url, anchor)` / `removeLink()` | link mark commands              | `AztecText.link` / `removeLink`                                                                                     |
| `isActive(format)`                     | `editor.isActive`               | `getAppliedStyles` at the selection                                                                                 |
| `undo()` / `redo()`                    | history commands                | Aztec history batches keyboard input only — format toggles and programmatic edits (setHTML, insert) do not register |
| `focus()` / `blur()` / `isFocused()`   | editor focus                    | focus + soft keyboard                                                                                               |
| `native`                               | the tiptap `Editor`             | the `AztecText` view                                                                                                |

The shared `TiptapFormat` vocabulary is the union both backends accept.
StarterKit lacks `taskList`, `highlight`, `subscript`/`superscript`, and the
`align*` formats — they no-op on web and work on Android.

## JSON interchange on native

The facade lazily imports the DOM-free tiptap slices and `zeed-dom` the
first time a `TiptapEditor` mounts (or call `ensureJSONBridge()` yourself).
`onJSONReady(ok)` reports whether the runtime hosted them — NativeScript's
embedded V8 lacks ICU, which `linkifyjs` originally broke on; the workspace
patch (`linkifyjs@4.3.3`) wraps its Unicode-property regexes in `new RegExp`
with ASCII fallbacks. The `tiptap-probe` demo
([`tiptap-probe.ts`](../packages/demos/src/tiptap-probe.ts)) re-verifies the
whole path — imports, schema, JSON→HTML, HTML→JSON — on every harness run.

JSON is interchange, not truth: Aztec's document is a flat span list, so a
native `getJSON()` is a best-effort mapping and HTML stays the canonical
round-trip format. Tiptap packages pin to `3.28.0` through the workspace's
pnpm overrides to match `@octanejs/tiptap@0.0.51` — extension ranges float
(`^3.28.0` resolved `extension-list@3.31.x`, which needs a `core` export
that version lacks), so do not widen the pin.

## What is not there yet

- iOS editing — the Swift facade over Aztec-iOS is deferred; the stub keeps
  shared screens mounting.
- Formatting parity is the shared vocabulary only — Aztec extras (`code`
  inline vs `codeBlock`, task lists) and StarterKit extras (hard breaks,
  trailing nodes) do not fully interconvert.
- No WebView bridge: the native editor never instantiates
  `prosemirror-view`/`EditorView`, so browser-only tiptap extensions (drag
  handles, bubble menus) do not apply on native.
