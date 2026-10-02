# `@octane-xplat/tiptap`

The unified rich-text facade: one `TiptapEditor` component across web and
native. Web renders a real tiptap `Editor` through `@octanejs/tiptap`'s
`EditorContent`; native renders the `@octane-xplat/richtext` leaf (WordPress
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
