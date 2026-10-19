/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'
export default function App() {
	const count$ = useSignal$(0)
	return (
		<masonview style={{flexDirection: "column", ...({display: "flex"})}}>
			<liquidglass id="hmr-glass" style={{ width: 180, height: 40 }}>
				<label id="glass-revision" text={'First revision' + count$.get()} />
			</liquidglass>
			<masonview id="advance" onTap={() => count$.set(count$.get() + 1)} style={{display: "flex"}}>
				<label text="Next" />
			</masonview>
		</masonview>
	)
}
