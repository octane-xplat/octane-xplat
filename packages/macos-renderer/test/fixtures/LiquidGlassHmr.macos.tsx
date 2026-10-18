/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
export default function App() {
	const count$ = useSignal$(0)
	return (
		<masonview display="flex" flexDirection="column">
			<liquidglass id="hmr-glass" style={{ width: 180, height: 40 }}>
				<label id="glass-revision" text={'First revision' + count$.get()} />
			</liquidglass>
			<masonview display="flex" id="advance" onTap={() => count$.set(count$.get() + 1)}>
				<label text="Next" />
			</masonview>
		</masonview>
	)
}
