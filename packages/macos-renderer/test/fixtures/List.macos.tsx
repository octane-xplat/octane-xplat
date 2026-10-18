/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const listRef = { current: null as any }
export const listChanges: any[] = []
export const listRefEvents: string[] = []
const refs = [
	listRef,
	[
		(view: any) => {
			if (view) {
				listRefEvents.push('attach')
				return () => listRefEvents.push('cleanup')
			}
		},
	],
]

export default function ListPicker() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<listpicker
			key={phase === 6 ? 'replacement' : 'list'}
			id="list"
			ref={refs}
			{...(phase === 2
				? {}
				: {
						items: phase === 0 ? ['Same', 'Same', null, 42, ''] : ['New', 'Next', 'Last'],
						selectedIndex: phase === 0 ? 1 : 2,
					})}
			onSelectedIndexChange={(event) => listChanges.push(event)}
			style={phase < 2 ? { width: 160, height: 32, opacity: 0.5 } : { width: 160, height: 32 }}
		/>
	)

	return (
		<masonview flexDirection="column" style={{display: "flex"}}>
			<listpicker id="list-default" />
			<listpicker id="list-natural" items={['Natural']} />
			<masonview flexDirection="column" id="list-left" style={{display: "flex", ...({ width: 240, height: 110 })}}>
				{(phase >= 3 ? ['tail', 'list'] : ['list', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="list-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</masonview>
			<contentview id="list-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<masonview id="advance-list" onTap={() => phase$.set(phase + 1)} style={{display: "flex"}}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}
