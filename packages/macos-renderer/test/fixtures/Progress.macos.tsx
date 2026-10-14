/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const progressRef = { current: null as any }
export const progressRefEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		progressRefEvents.push('attach')
		return () => progressRefEvents.push('cleanup')
	}
}

const refs = [progressRef, [callback]]

export default function Progress() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const ranges = [
		{ value: 30, maxValue: 60 },
		{ value: 150, maxValue: 200 },
		{},
		{ value: 120, maxValue: 50 },
		{ value: 50, maxValue: 0 },
		{ value: 50, maxValue: -10 },
		{ value: -3, maxValue: 100 },
		{},
		{ value: 12.5, maxValue: 25 },
	]

	const content = () => (
		<progress
			key={phase === 6 ? 'replacement' : 'progress'}
			id="progress"
			ref={refs}
			{...ranges[phase]}
			style={phase < 2 ? { width: 140, height: 16, opacity: 0.5 } : { width: 140, height: 16 }}
		/>
	)

	return (
		<stacklayout>
			<progress id="progress-default" />
			<progress id="progress-range" {...ranges[phase]} />
			<stacklayout id="progress-left" style={{ width: 240, height: 110 }}>
				{(phase >= 3 ? ['tail', 'progress'] : ['progress', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="progress-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</stacklayout>
			<contentview id="progress-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<flexboxlayout id="advance-progress" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</flexboxlayout>
		</stacklayout>
	)
}
