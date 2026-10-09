# `@octane-xplat/lexical`

Rich-text editing for Octane xplat apps through the Lexical document model —
one `LexicalEditor` component on web and native. Web renders a fixed-plugin
`LexicalComposer` through `@octanejs/lexical`. iOS and Android render the
`@octane-xplat/richtext` leaf (AztecEditor-iOS / WordPress Aztec) and convert
Lexical serialized state to and from HTML through the DOM-free packages
(`lexical`, `@lexical/html`, the Aztec-shaped node packages) with a `zeed-dom`
parse shim — no live Lexical editor runs there. macOS AppKit mounts a bundled
Lexical editor in a WKWebView.

```tsx
import { useState } from 'octane'
import { LexicalEditor, supported } from '@octane-xplat/lexical'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	const [html, setHtml] = useState('<p>Trip notes</p>')
	return supported ? (
		<LexicalEditor value={html} onChange={setHtml} />
	) : (
		<Text>Editing is unavailable on this target</Text>
	)
}
```

`value`/`onChange` exchange document HTML. `getJSON`/`setJSON` exchange
lexical serialized editor state (`EditorState.toJSON()`): synchronous on
web, bridged on iOS/Android after `onJSONReady(true)` — the lazy bridge reports
`false` (and `getJSON()` returns `null`) on runtimes that cannot host the
document-model modules. On Android, HTML is the canonical interchange
format; serialized state is a best-effort mapping. `editable={false}` renders
a read-only document, `placeholder` shows hint text on an empty document, and
`autofocus` focuses the field on mount.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'

export function ReadOnlyNote({ html }: { html: string }) {
	return <LexicalEditor value={html} editable={false} />
}
```

```tsx
import { useRef, useState } from 'octane'
import { LexicalEditor, type LexicalEditorHandle } from '@octane-xplat/lexical'
import { Button } from '@octane-xplat/ui'

export function DocumentCopy() {
	const editor = useRef<LexicalEditorHandle | null>(null)
	const [html, setHtml] = useState('<p>Trip notes</p>')
	const [jsonReady, setJsonReady] = useState(false)
	return (
		<>
			<LexicalEditor
				value={html}
				onChange={setHtml}
				ref={(handle) => {
					editor.current = handle
				}}
				onReady={() => setJsonReady(editor.current?.getJSON() != null)}
				onJSONReady={setJsonReady}
			/>
			<Button
				isDisabled={!jsonReady}
				onPress={() => {
					const document = editor.current?.getJSON()
					if (document) editor.current?.setJSON(document)
				}}
			>
				Round-trip document
			</Button>
		</>
	)
}
```

## Web customization

On web, `web.nodes` adds custom Lexical node classes to the facade's built-in
nodes, and `web.plugins` renders additional Octane plugin components inside
the Lexical composer. Set `replaceNodes` to `true` when `web.nodes` should be
the full custom node registry. Set `replacePlugins` to `true` to replace the
default history, list, link, and autofocus plugins with your own composition;
the rich-text surface and facade change/ref bindings remain installed. This
lets a custom node keep its Lexical JSON type and HTML representation during
a round-trip.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'
import { BadgeNode, BadgePlugin } from './lexical-extensions'

export function NoteEditor() {
	return (
		<LexicalEditor
			value='<p><span data-badge>Voyager</span></p>'
			web={{ nodes: [BadgeNode], plugins: <BadgePlugin /> }}
		/>
	)
}
```

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'
import { BadgeNode, BadgePlugin } from './lexical-extensions'

// Full replacement: register every node class Lexical needs for your documents.
export function CustomEditor() {
	return (
		<LexicalEditor
			web={{ replaceNodes: true, nodes: [BadgeNode], replacePlugins: true, plugins: <BadgePlugin /> }}
		/>
	)
}
```

The `web` options are ignored on native, where Aztec does the editing and the
fixed headless node set handles JSON conversion: no caller plugins, custom
nodes, browser views, or arbitrary JavaScript transforms run there.

## Engine and feature boundary

| Target | Editing engine | `web` options | Caller plugins, custom nodes, and browser views |
| --- | --- | --- | --- |
| Web | Lexical `LexicalComposer` with the facade's default nodes and plugins | `nodes`, `plugins`, and replacement flags apply | Supported by the web Lexical engine |
| Android | WordPress Aztec `AztecText`; a headless Lexical editor converts serialized state to and from HTML | Ignored | Unsupported; no live Lexical editor, plugin, transform, custom node, or browser view runs |
| iOS | AztecEditor-iOS through the native Swift facade; HTML-backed JSON conversion | Ignored | Unsupported; no caller JavaScript engine plugins run |
| macOS AppKit | Bundled Lexical editor in WKWebView | Ignored by the AppKit host | Unsupported through this facade |

On Android, save HTML as the canonical document. Lexical serialized state is
a best-effort conversion through the fixed built-in node set; it is not a live
Lexical editor state that supports commands or plugins. There is no live
`LexicalEditor` on Android: no `dispatchCommand`, no node transforms;
`native` returns the `AztecText` and the headless editor used for
conversions is an internal detail. The 2026-10-06
[Aztec nested-tree run](../../.agents/docs/parity/nested-tree-editor.md)
preserved nested wrappers, attributes, and child order through synthetic text
edits and save/reopen, but flattened paragraphs and accumulated `<br>` elements
on reopen. That run exercised the shared Aztec HTML leaf, not Lexical's JSON
conversion or structural commands. See the
[per-row capability record](../../docs/notes/editor-capabilities.md).

Focus callbacks report focus entering or leaving the editable surface.
`onJSONReady(true)` fires once the web editor handle exists, so `getJSON()` is
available from `onReady` and after readiness. On native, `onJSONReady` still
reports when the lazy conversion bridge settles.

```tsx
<LexicalEditor
	onJSONReady={(ready) => console.log('JSON ready:', ready)}
	onFocus={() => console.log('Editor focused')}
	onBlur={() => console.log('Editor blurred')}
/>
```

The lexical family pins to `0.51.0` and `@octanejs/lexical` to `0.2.0`
(peers `octane ^0.6.0`). `@lexical/link` carries a workspace patch for its
ICU-dependent URL-matcher literal. See
[`docs/app/rich-text.md`](../../docs/app/rich-text.md) for the shared contract,
format vocabulary, and known limits.

## macOS AppKit

The macOS export mounts a bundled local editor document in WKWebView.
RichText uses StarterKit; Tiptap and Lexical use their existing web facades.
Wait for `onReady`; synchronous getters return the latest received snapshot
and commands cross WebKit asynchronously. The `native` handle is the Swift
host transport. See [AppKit setup and engine limits](../../docs/app/rich-text.md#macos-appkit-editing).

## Native content and format limits

On iOS and Android, `json` takes precedence over `value`, including later
HTML prop updates. Removing `json` returns control to `value`. An imperative
`setHTML` cancels a pending JSON replacement; host recreation preserves the
latest requested or edited content. These lifecycle rules have object-driver
regression coverage, separate from native keyboard-input qualification.

```tsx
import { LexicalEditor, type LexicalJSON, type LexicalEditorHandle } from '@octane-xplat/lexical'

export function Notes({ json }: { json?: LexicalJSON }) {
	return <LexicalEditor json={json} value="<p>HTML when JSON is absent</p>" />
}

export function replaceHTML(editor: LexicalEditorHandle) {
	editor.setHTML('<p>Replacement, including before JSON readiness</p>')
}
```

Use the [platform format subset](../../docs/app/rich-text.md#format-subset)
when building a toolbar. On iOS/Android, unsupported `apply` requests throw
`RangeError` before changing content. Links require `linkTo`; iOS lacks
`taskList` and alignment. Native JSON is a fixed-schema conversion through
HTML and cannot preserve arbitrary caller nodes or run engine plugins.

```ts
import type { LexicalEditorHandle } from '@octane-xplat/lexical'

export function insertLink(editor: LexicalEditorHandle) {
	editor.linkTo('https://example.com', 'Example')
}
```
