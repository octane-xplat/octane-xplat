/** @jsxImportSource @octane-xplat/linux-gtk */
import { useState } from 'octane'

export function App() {
	const [count, setCount] = useState(0)
	return (
		<stacklayout spacing={8} className="screen">
			<label text={`Count: ${count}`} style={{ color: '#fff' }} />
			<button
				text="Increment"
				enabled={true}
				onPress={() => setCount(count + 1)}
			/>
		</stacklayout>
	)
}
