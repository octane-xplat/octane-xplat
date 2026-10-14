/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const stackRefs: any[] = []
export const childRefs: Record<string, { current: any }> = {
	a: { current: null },
	b: { current: null },
	c: { current: null },
}

export const refEvents: string[] = []
export const tapEvents: string[] = []
const stackRef = (view: any) => {
	if (view) {
		stackRefs.push(view)
		refEvents.push('attach')
		return () => refEvents.push('cleanup')
	}
}

export default function App() {
	const count$ = useSignal$(0)
	return (
		<stacklayout>
			<label id="count" style={{ fontSize: 22, fontWeight: 700 }}>
				{String(count$.get())}
			</label>
			<contentview id="hmr-content" style={{ width: 180, height: 32 }}>
				<label id="revision" text="First revision" />
			</contentview>
			<docklayout id="hmr-dock" style={{ width: 180, height: 32 }}>
				<label id="dock-revision" text="First revision" />
			</docklayout>
			<wraplayout id="hmr-wrap" itemWidth={80} itemHeight={30} style={{ width: 180, height: 60 }}>
				<label id="wrap-revision" text="First revision" />
			</wraplayout>
			<stacklayout
				id="layout"
				onTap={
					count$.get() === 1
						? (event) =>
								tapEvents.push(event.eventName + ':' + String(event.object === stackRefs[0]))
						: undefined
				}
				ref={stackRef}
				orientation={count$.get() === 1 ? 'horizontal' : undefined}
				style={{ width: 240, height: 80, padding: 8 }}
			>
				{(count$.get() >= 2 ? [] : count$.get() === 1 ? ['c', 'a', 'b'] : ['a', 'b', 'c']).map(
					(id) => (
						<label
							key={id}
							id={id}
							ref={childRefs[id]}
							text={id}
							horizontalAlignment={id === 'a' ? 'center' : 'left'}
							verticalAlignment={id === 'a' ? 'middle' : 'top'}
							style={{ width: 40, height: 16 }}
						/>
					),
				)}
			</stacklayout>
			<flexboxlayout id="increment" onTap={() => count$.set(count$.get() + 1)}>
				<label text="Increment" />
			</flexboxlayout>
		</stacklayout>
	)
}
