import { useMemo, useState } from 'octane'
import type { ISOTimeString } from './props'
import { cx } from './cx'
import { formatISOTime, isTimeInRange, parseISOTime } from './datetime'

interface TimeWheelProps {
	value?: ISOTimeString
	hasSeconds?: boolean
	hourFormat?: '12h' | '24h'
	min?: ISOTimeString
	max?: ISOTimeString
	onCommit: (time: ISOTimeString) => void
	onDismiss?: () => void
}

/** Bottom-sheet time picker — scrollable option columns (hour, minute,
 *  seconds, AM/PM) + commit row. The touch surface for `bottom-sheet` /
 *  `adaptive-bottom-sheet` presentations; a self-drawn wheel equivalent —
 *  column lists rather than a rotary drum. */
export function TimeWheelPanel(props: TimeWheelProps) @{
	const start = props.value ? parseISOTime(props.value) : null
	const is12 = (props.hourFormat ?? '12h') === '12h'
	const [hour24, setHour24] = useState(start?.hour ?? 9)
	const [minute, setMinute] = useState(start?.minute ?? 0)
	const [second, setSecond] = useState(start?.second ?? 0)

	const hourChoices = useMemo(() => {
		const list: { value: number; label: string }[] = []
		for (let h = 0; h < 24; h++) {
			list.push({ value: h, label: is12 ? String(h % 12 || 12) : String(h).padStart(2, '0') })
		}

		return list
	}, [is12])

	const minuteChoices = useMemo(() => {
		const list: { value: number; label: string }[] = []
		for (let m = 0; m < 60; m++) list.push({ value: m, label: String(m).padStart(2, '0') })
		return list
	}, [])

	const secondChoices = minuteChoices

	const current = formatISOTime({ hour: hour24, minute, second }, true)
	const commitValid = isTimeInRange(current, props.min, props.max)

	const commit = () => {
		if (!commitValid) return
		props.onCommit(formatISOTime({ hour: hour24, minute, second }, props.hasSeconds))
	}

	const column = (
		label: string,
		choices: { value: number; label: string }[],
		currentValue: number,
		onPick: (v: number) => void,
	) => (
		<div className="vx-timewheel-column" role="listbox" aria-label={label}>
			{choices.map((c) => (
				<button
					key={c.value}
					type="button"
					role="option"
					aria-selected={c.value === currentValue}
					className={cx('vx-timewheel-option', c.value === currentValue && 'vx-timewheel-option--selected')}
					onClick={() => onPick(c.value)}
				>
					{c.label}
				</button>
			))}
		</div>
	)

	<div className="vx-timewheel">
		<div className="vx-timewheel-columns">
			{column('Hour', hourChoices, hour24, setHour24)}
			{column('Minute', minuteChoices, minute, setMinute)}
			{props.hasSeconds ? column('Second', secondChoices, second, setSecond) : null}
		</div>
		<div className="vx-timewheel-actions">
			<button type="button" className="vx-timewheel-cancel" onClick={props.onDismiss}>Cancel</button>
			<button type="button" className="vx-timewheel-done" disabled={!commitValid || undefined} onClick={commit}>Done</button>
		</div>
	</div>
}
