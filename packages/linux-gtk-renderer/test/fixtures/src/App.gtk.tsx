/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'

export function App() {
	const [count, setCount] = useState(0)
	return (
		<masonview display="flex" flexDirection="column" className="screen">
			<label text={`Count: ${count}`} style={{ color: '#fff', padding: 12 }} />
			<button text="Increment" isEnabled={true} onPress={() => setCount(count + 1)} />
		</masonview>
	)
}
