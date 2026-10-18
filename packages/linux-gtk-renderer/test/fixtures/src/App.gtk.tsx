/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'

export function App() {
	const [count, setCount] = useState(0)
	return (
		<masonview flexDirection="column" className="screen" style={{display: "flex"}}>
			<label text={`Count: ${count}`} style={{ color: '#fff', padding: 12 }} />
			<button text="Increment" isEnabled={true} onPress={() => setCount(count + 1)} />
		</masonview>
	)
}
