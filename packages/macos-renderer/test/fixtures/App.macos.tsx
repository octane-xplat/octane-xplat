/** @jsxImportSource @octane-xplat/macos-renderer */
import { useSignal$ } from 'octane/signals/client'

export default function App() {
	const count$ = useSignal$(0)
	return (
		<stack>
			<label id="count" style={{ fontSize: 22, fontWeight: 700 }}>
				{String(count$.get())}
			</label>
			<label id="revision" text="First revision" />
			<flexboxlayout id="increment" onTap={() => count$.set(count$.get() + 1)}>
				<label text="Increment" />
			</flexboxlayout>
		</stack>
	)
}
