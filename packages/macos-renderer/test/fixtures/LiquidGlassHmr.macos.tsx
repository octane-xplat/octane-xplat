/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
export default function App() {
	const count$ = useSignal$(0)
	return (
		<stacklayout>
			<liquidglass id="hmr-glass" style={{ width: 180, height: 40 }}>
				<label id="glass-revision" text={'First revision' + count$.get()} />
			</liquidglass>
			<flexboxlayout id="advance" onTap={() => count$.set(count$.get() + 1)}>
				<label text="Next" />
			</flexboxlayout>
		</stacklayout>
	)
}
