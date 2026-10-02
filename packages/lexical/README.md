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

The facade's plugin set is fixed on purpose. Apps needing custom nodes,
plugins, or transforms import `@octanejs/lexical` directly on web — the
facade does not expose a composer/plugin surface it cannot honor on
native. There is no live `LexicalEditor` on Android: no `dispatchCommand`,
no node transforms; `native` returns the `AztecText` and the headless
editor used for conversions is an internal detail.

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
