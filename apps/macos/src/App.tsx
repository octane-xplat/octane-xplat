/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane/universal/native'
import { showDetailsWindow } from './appkit.mjs'

export default function App() {
	const [count, setCount] = useState(0)

	return (
		<stack spacing={14}>
			<label text="Octane on macOS" fontSize={24} />
			<label text={'Count: ' + count} />
			<button title="Add one" onPress={() => setCount((value) => value + 1)} />
			<button title="Open details window" onPress={() => showDetailsWindow(count)} />
		</stack>
	)
}
