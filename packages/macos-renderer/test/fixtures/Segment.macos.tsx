/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const segmentRef = { current: null as any }
export const segmentChanges: any[] = []
export const segmentRefEvents: string[] = []
const refs = [
	segmentRef,
	[
		(view: any) => {
			if (view) {
				segmentRefEvents.push('attach')
				return () => segmentRefEvents.push('cleanup')
			}
		},
	],
]

export default function SegmentedBar() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<segmentedbar
			key={phase === 6 ? 'replacement' : 'segment'}
			id="segment"
			ref={refs}
			{...(phase === 2
				? {}
				: {
						items:
							phase === 0
								? [{ title: 'Same' }, { title: 'Same' }, {}, { title: 'Last' }, { title: '' }]
								: [{ title: 'New' }, { title: 'Next' }, { title: 'Last' }],
						selectedIndex: phase === 0 ? 1 : phase === 3 ? 99 : phase === 4 ? -8 : 2,
					})}
			onSelectedIndexChange={(event) => segmentChanges.push(event)}
			style={
				phase < 2
					? {
							width: 160,
							height: 32,
							opacity: 0.5,
							selectedBackgroundColor: phase === 0 ? '#ff0000' : '#00ff00',
						}
					: { width: 160, height: 32 }
			}
		/>
	)

	return (
		<stacklayout>
			<segmentedbar id="segment-default" />
			<segmentedbar id="segment-natural" items={[{ title: 'Natural' }]} />
			<stacklayout id="segment-left" style={{ width: 240, height: 110 }}>
				{(phase >= 3 ? ['tail', 'segment'] : ['segment', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="segment-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</stacklayout>
			<contentview id="segment-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<flexboxlayout id="advance-segment" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</flexboxlayout>
		</stacklayout>
	)
}
