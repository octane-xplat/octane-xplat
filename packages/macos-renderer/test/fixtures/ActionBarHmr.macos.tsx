/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
export default function App() {
	const count$ = useSignal$(0)
	return (
		<masonview style={{flexDirection: "column", ...({display: "flex"})}}>
			<actionbar
				id="hmr-actionbar"
				title={'First revision' + count$.get()}
				flat={count$.get() > 0}
				style={{ width: 240, height: 44 }}
			/>
			<masonview id="advance" onTap={() => count$.set(count$.get() + 1)} style={{display: "flex"}}>
				<label text="Next" />
			</masonview>
		</masonview>
	)
}
