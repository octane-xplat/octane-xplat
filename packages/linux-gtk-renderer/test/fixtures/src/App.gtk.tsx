/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'

export function App() {
	const [count, setCount] = useState(0)
	return (
		<masonview
			className="screen"
			style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
		>
			<label text={`Count: ${count}`} style={{ color: '#fff', padding: 12 }} />
			<button text="Increment" isEnabled={true} onTap={() => setCount(count + 1)} />
		</masonview>
	)
}
