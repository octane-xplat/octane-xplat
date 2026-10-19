/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useSignal$ } from 'octane/signals/client'

export const activityRef = { current: null as any }
export const activityRefEvents: string[] = []
const callback = (view: any) => {
	if (view) {
		activityRefEvents.push('attach')
		return () => activityRefEvents.push('cleanup')
	}
}

const refs = [activityRef, [callback]]

export default function Activity() {
	const phase$ = useSignal$(0)
	const phase = phase$.get()
	const content = () => (
		<activityindicator
			key={phase === 6 ? 'replacement' : 'activity'}
			id="activity"
			ref={refs}
			{...(phase === 2 ? {} : { busy: phase !== 1 })}
			style={phase < 2 ? { width: 32, height: 32, opacity: 0.5 } : { width: 32, height: 32 }}
		/>
	)

	return (
		<masonview style={{flexDirection: "column", ...({display: "flex"})}}>
			<activityindicator id="idle-default" />
			<activityindicator id="intrinsic-size" busy />
			<masonview id="activity-left" style={mergeStyle({flexDirection: "column"}, {display: "flex", ...({ width: 240, height: 110 })})}>
				{(phase >= 3 ? ['tail', 'activity'] : ['activity', 'tail']).map((id) =>
					id === 'tail' ? (
						<label key="tail" id="activity-tail" text="tail" style={{ width: 32, height: 20 }} />
					) : phase < 4 || phase === 5 || phase === 6 || phase === 8 ? (
						content()
					) : null,
				)}
			</masonview>
			<contentview id="activity-right" style={{ width: 240, height: 60 }}>
				{phase === 4 ? content() : null}
			</contentview>
			<masonview id="advance-activity" onTap={() => phase$.set(phase + 1)} style={{display: "flex"}}>
				<label text="Advance" />
			</masonview>
		</masonview>
	)
}
