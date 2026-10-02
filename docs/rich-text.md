# Rich text editing

> Let someone edit formatted text, such as paragraphs with bold words or links.

For plain text, start with `TextArea` in the [text-entry guide](text-entry.md).
**Rich text** stores formatting along with the words. Xplat offers optional
editor packages: `@octane-xplat/tiptap` and `@octane-xplat/lexical` provide
shared interfaces, while `@octane-xplat/richtext` supplies the Android editor.
iOS editing is not implemented yet.

These editors need more setup than a text field. The sections below explain
their packages, stored document formats, and platform limits. A **facade**
is a common interface over different implementations; a **backend** here
is the editor implementation underneath it.

### Editor implementations

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
`onSelectionChange({start, end, active})`, `onFocus`, and `onBlur`. `ref`
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

## Lexical variant

`@octane-xplat/lexical` is the same facade contract over
[`@octanejs/lexical`](https://github.com/octanejs/octane/tree/main/packages/lexical)
(the octane port of `@lexical/react`):

```ts
import { LexicalEditor, supported } from '@octane-xplat/lexical'
```

Web renders a fixed-plugin `LexicalComposer` (rich text, history, lists,
links, autofocus) whose node set is exactly the facade vocabulary —
`taskList` joins the default set via `ListItemNode`, and `AutoLinkNode`
parses docs produced by fuller editors. Native renders `RichTextEditor` and
converts to/from **lexical serialized editor state** through a lazy
headless `createEditor` (no `@lexical/headless` — it pulls `happy-dom`)
with `zeed-dom` standing in for the DOM. `getJSON`/`setJSON` therefore
exchange `EditorState.toJSON()` shapes, not tiptap doc JSON — the two
facades' JSON is not interchangeable.

The composition is sealed by design: apps needing custom nodes, plugins, or
transformers import `@octanejs/lexical` directly on web rather than the
facade growing a plugin surface it cannot honor on native. On native there
is no live `LexicalEditor` — `dispatchCommand`, node transforms, and plugin
behaviors do not exist; `native` still returns the real editing surface
(the `AztecText`), and the headless editor is an internal conversion
detail.

`@octanejs/lexical` pins to `0.2.0` — `0.2.1` only bumps the `octane` peer
(`^0.7.0`) and `@octanejs/floating-ui`; the sources are byte-identical, and
`0.2.0` accepts the workspace's `octane@0.6.3`. The `@lexical/*` family pins
to `0.51.0` (upstream's catalog version); mixed copies break node identity,
so do not widen. `@lexical/link@0.51.0` carries a workspace patch —
its module-scope `/\p{L}\p{N}/u` URL matcher is a parse-time SyntaxError on
ICU-less runtimes; the patch builds it via `new RegExp` with an ASCII
fallback (the matcher only feeds autolink). The zeed-dom shim additionally
teaches `parentElement`, `null`-valued child/sibling accessors, a
write-through `style` proxy, and `href`/`target`/`rel`/`title`
property→attribute mapping — without those, links and alignment drop in
JSON→HTML export. The `lexical-probe` demo
([`lexical-probe.ts`](../packages/demos/src/lexical-probe.ts)) re-verifies
imports and both conversion directions on every harness run.

See [`LexicalEditorDemo`](../packages/demos/src/LexicalEditorDemo.tsrx) for
the maintained example.

## What is not there yet

- iOS editing — the Swift facade over Aztec-iOS is deferred; the stub keeps
  shared screens mounting.
- Formatting parity is the shared vocabulary only — Aztec extras (`code`
  inline vs `codeBlock`, task lists) and StarterKit extras (hard breaks,
  trailing nodes) do not fully interconvert.
- No WebView bridge: the native editor never instantiates
  `prosemirror-view`/`EditorView`, so browser-only tiptap extensions (drag
  handles, bubble menus) do not apply on native.
- Lexical: no live `LexicalEditor` on native — the facade's serialized
  state is a conversion format, and custom plugins/nodes are web-only via
  direct `@octanejs/lexical` import. Selection positions reported through
  `onSelectionChange` are best-effort flat text offsets on web; JSON→HTML
  fidelity on native is bounded by the zeed-dom shim (link targets,
  `text-align`-style properties survive; bespoke styles may not).
