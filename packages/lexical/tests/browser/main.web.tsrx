import { createRoot, useRef, useState } from 'octane'
import { LexicalEditor, type LexicalEditorHandle } from '../../src/index.web'
import { BadgeNode } from './BadgeNode'

function Smoke() {
	const [value, setValue] = useState('<p><span data-badge>Voyager</span> notes</p>')
	const [editable, setEditable] = useState(true)
	const [mounted, setMounted] = useState(true)
	const handle = useRef<LexicalEditorHandle | null>(null)
	const result: Record<string, any> = ((window as any).__lexicalSmoke ??= {
		jsonReady: [],
		ready: 0,
		focus: 0,
		blur: 0,
		changes: [],
		json: null,
	})

	return (
		<>
			<button id="external-update" onClick={() => setValue('<p>External update</p>')}>External update</button>
			<button id="toggle-readonly" onClick={() => setEditable((current) => !current)}>Toggle read-only</button>
			<button id="undo" onClick={() => handle.current?.undo()}>Undo</button>
			<button id="redo" onClick={() => handle.current?.redo()}>Redo</button>
			<button id="roundtrip" onClick={() => {
				const json = handle.current?.getJSON()
				result.json = json
				result.roundTripHTML = handle.current?.getHTML()
				if (json) handle.current?.setJSON(json)
			}}>Round-trip JSON</button>
			<button id="toggle-mount" onClick={() => setMounted((current) => !current)}>Toggle mount</button>
			{mounted ? (
				<LexicalEditor
					id="lexical-input"
					value={value}
					editable={editable}
					web={{ nodes: [BadgeNode] }}
					ref={(next) => { handle.current = next }}
					onChange={(html) => {
						result.changes.push(html)
						setValue(html)
					}}
					onJSONReady={(ready) => result.jsonReady.push(ready)}
					onReady={() => { result.ready++ }}
					onFocus={() => { result.focus++ }}
					onBlur={() => { result.blur++ }}
				/>
			) : null}
		</>
	)
}

createRoot(document.getElementById('app')!).render(<Smoke />)
