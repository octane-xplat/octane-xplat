# `@octane-xplat/richtext`

The native rich-text editing leaf: WordPress Aztec's `AztecText` on Android —
a `Spannable`-backed `EditText`, not a WebView. iOS mounts an unsupported
placeholder until the Aztec-iOS Swift facade lands; web and Windows
return `supported: false` (the `@octane-xplat/tiptap` facade covers web).

```tsx
import { useState } from 'octane'
import { RichTextEditor, supported } from '@octane-xplat/richtext'
import { Text } from '@octane-xplat/ui'

export function Notes() {
	const [html, setHtml] = useState('<p>Trip notes</p>')
	return supported ? (
		<RichTextEditor value={html} onChange={setHtml} />
	) : (
		<Text>Editing is unavailable on this target</Text>
	)
}
```

Content in/out is document HTML via Aztec `fromHtml`/`toPlainHtml`. The
`ref` callback returns an imperative handle (`getHTML`/`setHTML`,
`apply(format)`, `linkTo`/`removeLink`, `isActive`, `undo`/`redo`,
`focus`/`blur`, `native`) once the editor exists, and `onSelectionChange`
reports the active `RichTextFormat` set at the caret.

Structural commands exist on the Aztec surface: `split()` breaks the block
at the caret, `join()` merges a block into the previous one from a
collapsed caret at its start, and `indent()`/`outdent()` demote or promote
the selected blocks — a real nested-list restructure on `<ul>`/`<ol>`, a
`\t` indent on plain blocks. `canIndent()`/`canOutdent()` report whether
the current selection can take the command. All six return `false` when
the command cannot apply; markup Aztec does not understand (for example
`<div data-*>` wrappers) is opaque to them. On AppKit the commands return
`false` — the engine transport cannot report a synchronous result.

```tsx
import { useRef } from 'octane'
import { RichTextEditor, type RichTextEditorHandle } from '@octane-xplat/richtext'
import { Button } from '@octane-xplat/ui'

export function Formatting() {
	const editor = useRef<RichTextEditorHandle | null>(null)
	return (
		<>
			<RichTextEditor
				ref={(handle) => {
					editor.current = handle
				}}
				onSelectionChange={({ active }) => console.log(active)}
			/>
			<Button onPress={() => editor.current?.apply('bold')}>Bold</Button>
			<Button
				onPress={() => {
					const handle = editor.current
					if (!handle) return
					handle.setHTML('<p>New note</p>')
					console.log(handle.getHTML(), handle.isActive('bold'))
					handle.linkTo('https://example.com')
					handle.removeLink()
					handle.undo()
					handle.redo()
					handle.focus()
					handle.blur()
				}}
			>
				Try editor commands
			</Button>
		</>
	)
}
```

```tsx
import { useRef } from 'octane'
import { RichTextEditor, type RichTextEditorHandle } from '@octane-xplat/richtext'
import { Button } from '@octane-xplat/ui'

export function Formatting() {
	const editor = useRef<RichTextEditorHandle | null>(null)
	return (
		<>
			<RichTextEditor
				ref={(handle) => {
					editor.current = handle
				}}
				onSelectionChange={({ active }) => console.log(active)}
			/>
			<Button onPress={() => editor.current?.apply('bold')}>Bold</Button>
			<Button
				onPress={() => {
					const handle = editor.current
					if (!handle) return
					handle.setHTML('<p>New note</p>')
					console.log(handle.getHTML(), handle.isActive('bold'))
					handle.linkTo('https://example.com')
					handle.removeLink()
					handle.undo()
					handle.redo()
					handle.focus()
					handle.blur()
				}}
			>
				Try editor commands
			</Button>
		</>
	)
}
```

The Android Aztec dependency (`org.wordpress:aztec:v2.1.7`) arrives through
the leaf's `platforms/android/include.gradle` — no app-level gradle work.
See the framework guide for the full contract and the demo:
[`docs/app/rich-text.md`](../../docs/app/rich-text.md) and
[`packages/demos/src/RichTextEditorDemo.tsrx`](../demos/src/RichTextEditorDemo.tsrx).

## macOS AppKit

The macOS export mounts a bundled local editor document in WKWebView.
RichText uses StarterKit; Tiptap and Lexical use their existing web facades.
Wait for `onReady`; synchronous getters return the latest received snapshot
and commands cross WebKit asynchronously. The `native` handle is the Swift
host transport. See [AppKit setup and engine limits](../../docs/rich-text.md#macos-appkit-editing).
