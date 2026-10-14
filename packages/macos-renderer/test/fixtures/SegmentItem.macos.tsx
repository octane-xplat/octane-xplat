/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const segmentItemRef = { current: null as any }
export const segmentItemEvents: string[] = []
const refs = [segmentItemRef, [(element: any) => {
	if (element) {
		segmentItemEvents.push('attach')
		return () => segmentItemEvents.push('cleanup')
	}
}]]

export default function SegmentItems() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const item = () => <segmentedbaritem key={phase === 4 ? 'replacement' : 'item'} id="segment-item" ref={refs} {...(phase === 2 ? {} : { title: phase === 0 ? 'Same' : 'Updated' })} />
	return (
		<stacklayout>
			<segmentedbar id="item-natural" horizontalAlignment="left"><segmentedbaritem title={phase === 0 ? 'A' : 'A much longer segment title'} /></segmentedbar>
			<segmentedbar id="item-bar" selectedIndex={1} style={{ width: 220, height: 32 }}>
				{phase !== 7 && (phase === 1 ? ['last', 'item', 'empty', 'first'] : ['first', 'item', 'empty', 'last']).map((id) =>
					id === 'item' ? (phase === 5 || phase === 6 ? null : item()) : <segmentedbaritem key={id} id={'item-' + id} title={id === 'empty' ? '' : id === 'first' ? 'Same' : 'Last'} />,
				)}
				{phase === 1 ? <segmentedbaritem key="inserted" id="item-inserted" title="Inserted" /> : null}
			</segmentedbar>
			<contentview style={{ width: 220, height: 40 }}>
				<segmentedbar id="item-other">{phase === 5 ? item() : null}</segmentedbar>
			</contentview>
			<flexboxlayout id="advance-item" onTap={() => phase$.set(phase + 1)}><label text="Advance items" /></flexboxlayout>
		</stacklayout>
	)
}
