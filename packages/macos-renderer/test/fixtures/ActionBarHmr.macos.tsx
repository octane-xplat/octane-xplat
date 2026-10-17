/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
export default function App() {
	const count$ = useSignal$(0)
	return (
		<stacklayout>
			<actionbar
				id="hmr-actionbar"
				title={'First revision' + count$.get()}
				flat={count$.get() > 0}
				style={{ width: 240, height: 44 }}
			/>
			<flexboxlayout id="advance" onTap={() => count$.set(count$.get() + 1)}>
				<label text="Next" />
			</flexboxlayout>
		</stacklayout>
	)
}
