# Rich text editing

> Let someone edit formatted text, such as paragraphs with bold words or links.

For plain text, start with `TextArea` in the [text-entry guide](text-entry.md).
**Rich text** stores formatting along with the words. Xplat offers optional
editor packages: `@octane-xplat/tiptap` and `@octane-xplat/lexical` provide
shared interfaces, while `@octane-xplat/richtext` supplies the Android and AppKit editing surfaces.
iOS editing is not implemented yet.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Example() {
	return <TextArea label="Travel notes" autoGrow />
}
```

These editors need more setup than a text field. The sections below explain
their packages, stored document formats, and platform limits. A **facade**
is a common interface over different implementations; a **backend** here
is the editor implementation underneath it.

### Editor implementations

Web and native rich text are deliberately different backends behind one
tiptap-shaped facade. Web runs a real tiptap `Editor` via
[`@octanejs/tiptap`](https://github.com/octanejs/tiptap). Android cannot host
ProseMirror's DOM-bound `EditorView`, so Android renders WordPress Aztec's
`AztecText` — a `Spannable`-backed `EditText` — and the facade layers tiptap
document JSON on top through the DOM-free slices
(`prosemirror-model`/`prosemirror-state` via `@tiptap/pm`,
`@tiptap/static-renderer`, and `zeed-dom` as the parse shim). iOS is a stub
until the Aztec-iOS Swift facade lands.

## Install and import

For the unified component, add `@octane-xplat/tiptap` to the app:

```tsx
import { TiptapEditor, supported } from '@octane-xplat/tiptap'
import { Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Notes() {
	const [html, setHTML] = useState('<p>Travel notes</p>')
	return supported ? (
		<TiptapEditor value={html} onChange={setHTML} placeholder="Write a note" editable />
	) : (
		<Text>Rich text editing is unavailable here.</Text>
	)
}
```

`TiptapEditor` resolves per platform at the file-suffix boundary: `.web`
adapted over `@octanejs/tiptap`, the unsuffixed native default over
`RichTextEditor`. App code does not branch on platform.

For the native editor directly (Android and macOS AppKit), add
`@octane-xplat/richtext`:

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Notes.android.tsrx
import { RichTextEditor, supported } from '@octane-xplat/richtext'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	return supported ? (
		<RichTextEditor value="<p>Travel notes</p>" onChange={(html) => console.log(html)} />
	) : (
		<Text>Editor unavailable</Text>
	)
}
```

The leaf's `platforms/android/include.gradle` declares
`org.wordpress:aztec:v2.1.7` from the Automattic Maven repository — no app
gradle setup beyond a normal `ns build`. `supported` is `false` on iOS, web, and Windows; the iOS component mounts a placeholder label instead of
an editor.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Notes.android.tsrx
import { RichTextEditor, supported } from '@octane-xplat/richtext'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	return supported ? (
		<RichTextEditor value="<p>Travel notes</p>" onChange={(html) => console.log(html)} />
	) : (
		<Text>Editor unavailable</Text>
	)
}
```

See the maintained examples
[`RichTextEditorDemo`](../../packages/demos/src/RichTextEditorDemo.tsrx) and
[`TiptapEditorDemo`](../../packages/demos/src/TiptapEditorDemo.tsrx).

## The shared contract

Both components take `value` (document HTML), `placeholder`, `editable`,
`autofocus`, and the callbacks `onReady`, `onChange(html)`,
`onSelectionChange({start, end, active})`, `onFocus`, and `onBlur`. Lexical
also reports `onJSONReady(true)` when its web handle or native conversion
bridge can serve JSON. `ref`
hands back an imperative handle once the native surface exists:

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'
import type { TiptapEditorHandle } from '@octane-xplat/tiptap'
import { Pressable, Text } from '@octane-xplat/ui'
import { useRef, useState } from 'octane'

export function Notes() {
	const [html, setHTML] = useState('<p>Travel notes</p>')
	const editor = useRef<TiptapEditorHandle | null>(null)
	return (
		<>
			<TiptapEditor
				value={html}
				onChange={setHTML}
				ref={(handle) => {
					editor.current = handle
				}}
				onReady={() => console.log('Ready')}
				onSelectionChange={(selection) => console.log(selection.active)}
				onFocus={() => console.log('Editing')}
				onBlur={() => console.log('Done')}
			/>
			<Pressable onPress={() => editor.current?.apply('bold')}>
				<Text>Bold</Text>
			</Pressable>
		</>
	)
}
```

| Method                                            | Web (tiptap)                    | Android (Aztec)                                                                                                     | macOS (WKWebView)                     |
| ------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `getHTML()` / `setHTML(html)`                     | editor `getHTML` / `setContent` | `toPlainHtml` / `fromHtml` — `setHTML` resets undo history                                                          | asynchronous snapshot / update        |
| `getJSON()` / `setJSON(doc)` (Tiptap facade only) | tiptap `getJSON` / `setContent` | JSON bridge → HTML → Aztec; `null` until `onJSONReady(true)`                                                        | live Tiptap JSON                      |
| `apply(format)`                                   | `chain().focus()` commands      | `toggleFormatting(AztecTextFormat…)`                                                                                | StarterKit commands                   |
| `linkTo(url, anchor)` / `removeLink()`            | link mark commands              | `AztecText.link` / `removeLink`                                                                                     | link mark commands                    |
| `isActive(format)`                                | `editor.isActive`               | `getAppliedStyles` at the selection                                                                                 | latest received snapshot              |
| `undo()` / `redo()`                               | history commands                | Aztec history batches keyboard input only — format toggles and programmatic edits (setHTML, insert) do not register | engine history                        |
| `focus()` / `blur()` / `isFocused()`              | editor focus                    | focus + soft keyboard                                                                                               | asynchronous focus command / snapshot |
| `native`                                          | the tiptap `Editor`             | the `AztecText` view                                                                                                | `XplatEditorHost` transport           |

The shared `TiptapFormat` vocabulary is the union the facades expose. StarterKit
lacks `taskList`, `highlight`, `subscript`/`superscript`, and the `align*`
formats — they work on Android and no-op on web and AppKit.

## Ordinary editing subset by platform

For the current status of every decision #101 contract row on Web, Android,
and iOS for both packages, see the [editor capability declarations](../notes/editor-capabilities.md).
The package-level `supported` flag means an editing surface exists on that
target; it does not qualify each contract row.

| Target | Editing engine | Current boundary |
| --- | --- | --- |
| Web | Tiptap mounts Tiptap; Lexical mounts Lexical | Package source exposes web editing APIs. The provided browser runtime evidence tests ProseMirror's document model, not either mounted editor's browser interaction or full lifecycle. |
| Android | Both facades edit through Aztec; Tiptap and Lexical JSON are conversion layers | ADB input, focus, selection, and keyboard undo have bounded runtime evidence. A separate Aztec run preserves nested HTML wrappers but exposes paragraph flattening and repeated-reopen drift. |
| iOS | Neither package mounts an editing engine | The package reports `supported = false` and renders a placeholder; a simulator run verifies this boundary only. |

On Android, custom Tiptap extensions, ProseMirror node views, Lexical nodes,
Lexical plugins, transforms, and browser views do not run. The facades do not
create live ProseMirror or Lexical editor instances there. A 2026-10-06 internal runtime investigation preserved the three-level
HTML hierarchy and attributes through synthetic edits and save/reopen, and a
follow-up run exercised the leaf's `split`/`join`/`indent`/`outdent` commands:
they perform real structural edits on Aztec's own block model (nested lists
demote, items split and merge) but cannot reshape `toggle-item` divs, which
Aztec treats as opaque hidden-block markup. It also flattened paragraphs —
top-level `<p>` included — and accumulated `<br>` elements on reopen; it did
not test OS input. This is not full Foxtrot-document support.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'

export function AndroidNotes() {
	return <LexicalEditor value="<p>Saved as HTML</p>" onChange={saveHtml} />
}

declare function saveHtml(html: string): void
```

## Baseline verification status

| Baseline row | Android Aztec runtime | Native object-driver fake host |
| --- | --- | --- |
| Fresh mount with initial content | Passed on NativeScript `AztecText` | JSON seed and readiness ordering pass |
| User edits | Passed: ADB keyboard text reached Aztec and emitted `onChange` | Callback path simulated by the fake host; no keyboard input |
| Controlled replacement | Passed; triggered with probe handler dispatch | Later JSON replacement and duplicate suppression pass |
| Read-only | Passed native checks: key listener is null and focus is disabled; OS typing suppression was not tested | Not covered |
| Focus and blur | Focus and `onFocus` passed during ADB keyboard input; blur did not complete before probe timeout | Not covered |
| Selection | Passed during ADB keyboard input | Not covered |
| Undo | Passed; Aztec undo removed the keyboard insertion | Fake command is a no-op; not covered |
| Save and reopen | Not run; the probe timed out during blur before snapshot/remount | Not covered |
| Events | `onReady`, `onChange`, `onFocus`, and `onSelectionChange` passed; `onBlur` was not observed | Fake `onChange` to `onJSONChange` conversion passes |
| Disposal | Not run; the probe timed out before unmount | Late bridge completion after unmount is ignored |

The table below records the earlier ordinary-edit probe and fake-host rows;
it does not include the separate nested-tree run linked above. The fake-host
rows come from the Tiptap and Lexical native object-driver tests;
they do not mount Aztec. Android was probed on 2026-10-05 using the API 35
Google APIs arm64 AVD `octane-prime-larkspur` (`emulator-5556`). The successful
assertion segment used the real NativeScript host and `AztecText`; keyboard
input came from `adb shell input tap` and `adb shell input text`. Controlled
replacement used probe handler dispatch, which does not establish OS
hit-testing. The overall probe ended with a timeout while waiting for blur, so
save/reopen and disposal remain unverified. A later fresh-cache run again
passed mount, readiness, controlled replacement, and read-only checks, then
timed out before keyboard text reached Aztec; it adds no user-edit evidence.

The iOS package entry remains an unsupported placeholder. Native package
builds and object-driver suites do not establish iOS editing behavior; the
separate simulator run verifies only the unsupported flag and visible label.

## Web engine extensions

On web, `TiptapEditor` mounts a real tiptap `Editor`, and you can hand it
extra tiptap extensions through the `web` prop. Extensions teach the editor
new content and commands — for example a `Mark` adds a kind of inline
formatting. Add the `@tiptap/*` packages you import to the app's
dependencies at the pinned `3.28.0` version, the same pin the rest of the
editor stack uses. Your entries run after the built-in StarterKit, so
everything StarterKit provides keeps working:

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'
import { Mark } from '@tiptap/core'

const Spoiler = Mark.create({
	name: 'spoiler',
	parseHTML: () => [{ tag: 'span[data-spoiler]' }],
	renderHTML: () => ['span', { 'data-spoiler': '' }, 0],
})

export function Notes() {
	return <TiptapEditor web={{ extensions: [Spoiler] }} />
}
```

`web.starterKit` accepts the same options object as `StarterKit.configure()`,
so you can tune or disable individual built-ins. Pass `false` to replace the
kit entirely — your `extensions` must then provide the base schema
(document, paragraph, and text nodes at minimum). An extension named
`starterKit` inside `extensions` also replaces the built-in, so StarterKit
is never registered twice.

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'

export function Notes() {
	// StarterKit minus the link mark, plus whatever the app adds.
	return <TiptapEditor web={{ starterKit: { link: false } }} />
}
```

`web` options configure the browser engine only. Android's Aztec editor and
the bundled AppKit engine cannot run DOM/ProseMirror extension objects, so
they ignore the prop — code that relies on a custom schema (custom marks in
saved JSON, extension commands through `handle.native`) is web-only behavior.
Keep the option object stable across renders: tiptap fixes the schema when
the editor is constructed.

## macOS AppKit editing

The AppKit target supports all three editor components. Each mounts a local
**WKWebView**, the system browser view, inside the native layout. Tiptap uses
the same StarterKit facade as web; Lexical uses its built-in node and plugin
defaults. `RichTextEditor` uses StarterKit for HTML editing. The editor
documents are bundled with the packages: no CDN, server, or network connection
is needed. The `richtext` leaf owns the small Swift host independently of the
general WebView component. The CLI compiles it through the normal
[macOS native leaf workflow](../platform/macos-native.md).

Use the same imports and give the editor a bounded height, for example:

```tsx
<TiptapEditor
	value="<p>Hello <strong>macOS</strong></p>"
	style={{ height: 200 }}
	onChange={(html) => saveDraft(html)}
/>
```

Here `saveDraft` is your app’s function for storing the HTML. The maintained
editor demos show complete toolbar and callback integrations.

Wait for `onReady` before reading the document. `ref` exposes a handle while
the document is loading; commands queue until the document boots.
`onJSONReady(true)` fires when the mounted engine is ready.
`ensureJSONBridge()` resolves `true` and `jsonBridgeReady()` is `true` because
the JSON engine is bundled; those functions do not wait for a particular
editor to mount. `json` takes precedence over `value`. Tiptap and Lexical keep
their own JSON shapes, and macOS uses their live models rather than Android’s
HTML conversion bridge.

Commands cross WebKit asynchronously. `getHTML`, `getJSON`, `isActive`, and
`isFocused` read the latest received snapshot. An immediate read after
`setHTML`, `apply`, or `focus` can still show the old state. Read changed
content in `onChange`; read toolbar state in `onSelectionChange`. `native` is
the `XplatEditorHost` transport, not a tiptap or Lexical engine object. It
disposes the WebKit view and message handler when the component unmounts.

The frame accepts the usual layout props, `className`, and `style`; styles
on that frame do not style the document inside it. Android/iOS escape bags
are ignored on AppKit. Navigation and network loads inside the editor are
blocked, including following document links.

Engine-specific limits:

- RichText and Tiptap use StarterKit: `taskList`, `highlight`, `subscript`,
  `superscript`, and `align*` do nothing. RichText uses engine history on
  macOS, so the Android-only history limitations do not apply. RichText
  selection positions use ProseMirror document coordinates, as Tiptap does.
- Tiptap’s current web facade does not display `placeholder`; AppKit retains
  that limitation. RichText exposes the placeholder as an accessible label;
  its visual empty-paragraph hint is not implemented.
- Lexical custom nodes and plugins are configurable through `web` on the web
  DOM editor; native renderers ignore those options. Direct `dispatchCommand`
  access is unavailable through the native handle. Its
  selection offsets remain the web facade’s best-effort flat text offsets.
  `horizontalRule` and checklist commands depend on the registered plugin
  handlers; the fixed facade does not add dedicated checklist or horizontal
  rule plugins. These commands are not claimed as supported on AppKit.

To run the maintained checks from this repository, build the three packages
with `pnpm --filter @octane-xplat/richtext --filter @octane-xplat/tiptap
--filter @octane-xplat/lexical build`, then run
`pnpm --filter @octane-xplat/richtext test:macos` and
`pnpm --filter @octane-xplat/richtext test:packed`. These checks require an
Apple Silicon Mac with Xcode’s command-line tools.

The maintained [isolated WebKit fixture](../../packages/richtext/test/verify-wk.mjs)
and [packed AppKit consumer](../../packages/richtext/test/packed-consumer.mjs) check
local engine loading, HTML/JSON interchange, refs, controlled updates, and
teardown without screenshots. Command dispatch is separate from real OS
keyboard input, selection, and hit-testing; those interactions remain
unverified.

## JSON interchange on native

On Android, the facade lazily imports the DOM-free tiptap slices and `zeed-dom` the
first time a `TiptapEditor` mounts (or call `ensureJSONBridge()` yourself).
`onJSONReady(ok)` reports whether the runtime hosted them — NativeScript's
embedded V8 lacks ICU, which `linkifyjs` originally broke on; the workspace
patch (`linkifyjs@4.3.3`) wraps its Unicode-property regexes in `new RegExp`
with ASCII fallbacks. The `tiptap-probe` demo
([`tiptap-probe.ts`](../../packages/demos/src/tiptap-probe.ts)) re-verifies the
whole path — imports, schema, JSON→HTML, HTML→JSON — on every harness run.

```tsx
import { TiptapEditor, ensureJSONBridge } from '@octane-xplat/tiptap'

// Optional preloading on native, before showing the editor.
export async function prepareEditor() {
	return await ensureJSONBridge()
}
export function Notes() {
	return (
		<TiptapEditor
			json={{ type: 'doc', content: [{ type: 'paragraph' }] }}
			onJSONReady={(ok) => console.log('JSON available:', ok)}
		/>
	)
}
```

JSON is interchange, not truth: Aztec's document is a flat span list, so a
native `getJSON()` is a best-effort mapping and HTML stays the canonical
round-trip format. Tiptap packages pin to `3.28.0` through the workspace's
pnpm overrides to match `@octanejs/tiptap@0.0.51` — extension ranges float
(`^3.28.0` resolved `extension-list@3.31.x`, which needs a `core` export
that version lacks), so do not widen the pin.

```tsx
import { TiptapEditor } from '@octane-xplat/tiptap'

export function Notes() {
	return (
		<TiptapEditor
			value="<p>Travel notes</p>"
			onChange={(html) => console.log('Save canonical HTML:', html)}
			onJSONChange={(doc) => console.log('Interchange JSON:', doc)}
		/>
	)
}
```

## Lexical variant

`@octane-xplat/lexical` is the same facade contract over
[`@octanejs/lexical`](https://github.com/octanejs/octane/tree/main/packages/lexical)
(the octane port of `@lexical/react`):

```tsx
import { LexicalEditor, supported } from '@octane-xplat/lexical'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	return supported ? (
		<LexicalEditor value="<p>Travel notes</p>" onChange={(html) => console.log(html)} />
	) : (
		<Text>Editor unavailable</Text>
	)
}
```

Web renders a LexicalComposer with the facade's built-in nodes and plugins
(rich text, history, lists, links, autofocus); `AutoLinkNode` parses docs
produced by fuller editors. Native renders `RichTextEditor` and
converts to/from **lexical serialized editor state** through a lazy
headless `createEditor` (no `@lexical/headless` — it pulls `happy-dom`)
with `zeed-dom` standing in for the DOM. `getJSON`/`setJSON` therefore
exchange `EditorState.toJSON()` shapes, not tiptap doc JSON — the two
facades' JSON is not interchangeable.

```tsx
import { LexicalEditor, supported } from '@octane-xplat/lexical'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	return supported ? (
		<LexicalEditor value="<p>Travel notes</p>" onChange={(html) => console.log(html)} />
	) : (
		<Text>Editor unavailable</Text>
	)
}
```

On web, `web.nodes` adds Lexical node classes to the built-in nodes and
`web.plugins` renders Octane plugin components inside the composer. Set
`replaceNodes` to true when `web.nodes` is the complete custom-node registry.
These options only affect the web DOM editor; native renderers ignore them.
See the package README for a complete custom-node round-trip example.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'
import { BadgeNode, BadgePlugin } from './lexical-extensions'

export function Notes() {
	return <LexicalEditor web={{ nodes: [BadgeNode], plugins: <BadgePlugin /> }} />
}
```

On Android there is no live `LexicalEditor` — `dispatchCommand`, node
transforms, and plugin behaviors do not exist; `native` still returns the
real editing surface (`AztecText`), and the headless editor is an internal
conversion detail.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'

export function Notes() {
	return (
		<LexicalEditor
			value="<p>Travel notes</p>"
			onJSONChange={(state) => console.log('Lexical serialized state:', state)}
		/>
	)
}
```

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
([`lexical-probe.ts`](../../packages/demos/src/lexical-probe.ts)) re-verifies
imports and both conversion directions on every harness run.

See [`LexicalEditorDemo`](../../packages/demos/src/LexicalEditorDemo.tsrx) for
the maintained example.

## What is not there yet

- iOS editing — the Swift facade over Aztec-iOS is deferred; the stub keeps
  shared screens mounting.
- Formatting parity is the shared vocabulary only — Aztec extras (`code`
  inline vs `codeBlock`, task lists) and StarterKit extras (hard breaks,
  trailing nodes) do not fully interconvert.
- Android has no WebView bridge: the editor never instantiates
  `prosemirror-view`/`EditorView`, so browser-only tiptap extensions (drag
  handles, bubble menus) do not apply on native. Caller-supplied `web`
  extensions likewise configure only the browser engine — the Android facade
  and bundled AppKit engine ignore the prop.
- Lexical: no live `LexicalEditor` on Android — the facade's serialized
  state is a conversion format, and custom plugins/nodes are web-only via
  direct `@octanejs/lexical` import. Selection positions reported through
  `onSelectionChange` are best-effort flat text offsets on web; JSON→HTML
  fidelity on native is bounded by the zeed-dom shim (link targets,
  `text-align`-style properties survive; bespoke styles may not).
