/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export const dateRef = { current: null as any }
export const dateChanges: any[] = []
export const dateRefEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		dateRefEvents.push('attach')
		return () => dateRefEvents.push('cleanup')
	}
}

const refs = [dateRef, [callback]]

export default function DatePicker() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<datepicker
			key={phase === 6 ? 'replacement' : 'date'}
			id="date"
			ref={refs}
			{...(phase === 2
				? {}
				: {
						date: new Date(2026, 4, phase === 0 ? 10 : 12, 17, 30),
						minDate: new Date(2026, 4, 1, 8),
						maxDate: new Date(2026, 4, 20, 21),
						isEnabled: phase !== 1,
					})}
			onDateChange={(event) => dateChanges.push(event)}
			style={phase < 2 ? { width: 160, height: 32, opacity: 0.5 } : { width: 160, height: 32 }}
		/>
	)

	return (
		<stacklayout>
			<datepicker id="idle-default" />
			<datepicker id="intrinsic-size" year={2026} month={6} day={15} />
			<stacklayout id="date-left" style={{ width: 240, height: 110 }}>
				{(phase >= 3 ? ['tail', 'date'] : ['date', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="date-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</stacklayout>
			<contentview id="date-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<flexboxlayout id="advance-date" onTap={() => phase$.set(phase + 1)}>
				<label text="Advance" />
			</flexboxlayout>
		</stacklayout>
	)
}
