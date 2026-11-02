/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'

export const timeRef = { current: null as any }
export const timeChanges: any[] = []
export const timeRefEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		timeRefEvents.push('attach')
		return () => timeRefEvents.push('cleanup')
	}
}

const refs = [timeRef, [callback]]

export default function TimePicker() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<timepicker
			key={phase === 6 ? 'replacement' : 'time'}
			id="time"
			ref={refs}
			{...(phase === 2
				? {}
				: {
						time: phase === 0 ? '10:25:42' : '12:35',
						minHour: phase === 1 ? 9 : 8,
						minMinute: phase === 1 ? 20 : 10,
						maxHour: phase === 1 ? 18 : 20,
						maxMinute: phase === 1 ? 40 : 50,
						isEnabled: phase !== 1,
					})}
			onTimeChange={(event) => timeChanges.push(event)}
			style={phase < 2 ? { width: 160, height: 32, opacity: 0.5 } : { width: 160, height: 32 }}
		/>
	)

	return (
		<masonview
			style={{
				flexDirection: 'column',
				display: 'flex',
			}}
		>
			<timepicker id="idle-default" />
			<timepicker
				id="range-check"
				{...(phase === 2
					? {}
					: {
							time: phase === 0 ? '08:00' : '20:00',
							minHour: phase === 1 ? 18 : 9,
							minMinute: phase === 1 ? 30 : 15,
							maxHour: 17,
							maxMinute: phase === 1 ? 20 : 45,
						})}
			/>
			<timepicker id="intrinsic-size" hour={6} minute={15} />
			<masonview
				id="time-left"
				style={mergeStyle(
					{ flexDirection: 'column' },
					{
						display: 'flex',
						width: 240,
						height: 110,
					},
				)}
			>
				{(phase >= 3 ? ['tail', 'time'] : ['time', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="time-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</masonview>
			<contentview id="time-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<masonview id="advance-time" onTap={() => phase$.set(phase + 1)} style={{ display: 'flex' }}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}
