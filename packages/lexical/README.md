# `@octane-xplat/lexical`

The unified rich-text facade, lexical flavor: one `LexicalEditor` component
across web and native. Web renders a fixed-plugin `LexicalComposer` through
`@octanejs/lexical`; Android renders the `@octane-xplat/richtext` leaf
(WordPress Aztec on Android, iOS stub) and layers lexical serialized editor
state on top through the DOM-free slices (`lexical`, `@lexical/html`, the
Aztec-shaped node packages) with a `zeed-dom` parse shim. DOM-bound lexical code stays out of Android execution — divergence lives at the
file-suffix boundary.

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
web, bridged on Android after `onJSONReady(true)` — the lazy bridge reports
`false` (and `getJSON()` returns `null`) on runtimes that cannot host the
document-model modules. On Android, HTML is the canonical interchange
format; serialized state is a best-effort mapping.

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

The `web` options are ignored on native. Native still edits with Aztec on
Android and uses the fixed headless conversion node set for JSON; plugin
components, browser DOM nodes, and arbitrary JavaScript transforms do not
run there. Apps replacing the web defaults can set both replacement options
and register the node classes Lexical requires for their documents.

```tsx
import { LexicalEditor } from '@octane-xplat/lexical'
import { BadgeNode, BadgePlugin } from './lexical-extensions'

export function NoteEditor() {
	return (
		<LexicalEditor
			web={{ replaceNodes: true, nodes: [BadgeNode], replacePlugins: true, plugins: <BadgePlugin /> }}
		/>
	)
}
```

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

There is no live `LexicalEditor` on Android: no `dispatchCommand`, no node
transforms; `native` returns the `AztecText` and the headless editor used for
conversions is an internal detail.

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
host transport. See [AppKit setup and engine limits](../../docs/rich-text.md#macos-appkit-editing).
