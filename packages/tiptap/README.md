# `@octane-xplat/tiptap`

The unified rich-text facade: one `TiptapEditor` component across web and
native. Web renders a real tiptap `Editor` through `@octanejs/tiptap`'s
`EditorContent`; Android renders the `@octane-xplat/richtext` leaf (WordPress
Aztec on Android, iOS stub) and layers tiptap document JSON on top through
the DOM-free ProseMirror slices (`@tiptap/pm`, `@tiptap/static-renderer`)
with a `zeed-dom` parse shim. No DOM-bound tiptap code (`EditorView`) ever
enters a native bundle — divergence lives at the file-suffix boundary.

```tsx
import { useState } from 'octane'
import { TiptapEditor, supported } from '@octane-xplat/tiptap'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	const [html, setHtml] = useState('<p>Trip notes</p>')
	return supported ? (
		<TiptapEditor value={html} onChange={setHtml} />
	) : (
		<Text>Editing is unavailable on this target</Text>
	)
}
```

On web the `web` prop configures the underlying tiptap `Editor`: `extensions`
appends caller `Extension`/`Node`/`Mark` entries after the built-in
StarterKit, and `starterKit` takes `StarterKit.configure()` options or
`false` to hand the schema to `extensions` entirely. A caller `starterKit`
entry replaces the built-in instead of registering it twice. The options are
web-only — the Android facade and bundled AppKit engine cannot host
DOM-bound ProseMirror extensions and ignore the prop.

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

`value`/`onChange` exchange document HTML. `getJSON`/`setJSON` exchange
tiptap document JSON: synchronous on web, bridged on native after
`onJSONReady(true)` — the lazy bridge reports `false` (and `getJSON()`
returns `null`) on runtimes that cannot host the schema modules. On native,
HTML is the canonical interchange format; JSON output is a best-effort
mapping of Aztec's flat span list onto ProseMirror's tree.

```tsx
import { useRef, useState } from 'octane'
import { TiptapEditor, type TiptapEditorHandle } from '@octane-xplat/tiptap'
import { Button } from '@octane-xplat/ui'

export function DocumentCopy() {
	const editor = useRef<TiptapEditorHandle | null>(null)
	const [html, setHtml] = useState('<p>Trip notes</p>')
	const [jsonReady, setJsonReady] = useState(false)
	return (
		<>
			<TiptapEditor
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

The tiptap family pins to `3.28.0` to match `@octanejs/tiptap@0.0.51` —
extension `^` ranges float ahead of core and break (`getPreviousBlockSibling`),
so consumers should keep the workspace override. See
[`docs/app/rich-text.md`](../../docs/app/rich-text.md) for the shared contract,
format vocabulary, and known limits.

## macOS AppKit

The macOS export mounts a bundled local editor document in WKWebView.
RichText uses StarterKit; Tiptap and Lexical use their existing web facades.
Wait for `onReady`; synchronous getters return the latest received snapshot
and commands cross WebKit asynchronously. The `native` handle is the Swift
host transport. See [AppKit setup and engine limits](../../docs/rich-text.md#macos-appkit-editing).
