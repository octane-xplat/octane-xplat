/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useState } from 'octane'
import type { ISOTimeString } from './props'
import { cx } from './cx'
import { Pressable } from './Pressable'
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

/** Bottom-sheet time picker — scrollable option columns + commit row.
 *  Columns are scrollviews of tap-to-select rows (the self-drawn wheel
 *  equivalent — a NativeScript `listpicker` per column is the alternative,
 *  but scroll columns keep sizing/theming identical across targets). */
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
		<scrollview className="vx-timewheel-column" accessibilityLabel={label}>
			<stacklayout>
				{choices.map((c: { value: number; label: string }) => (
					<flexboxlayout
						key={c.value}
						className={cx('vx-timewheel-option', c.value === currentValue && 'vx-timewheel-option--selected')}
						accessibilityRole={"button" as any}
						accessibilityState={{ selected: c.value === currentValue } as any}
						accessibilityLabel={`${label} ${c.label}`}
						onTap={() => onPick(c.value)}
					>
						<label text={c.label} />
					</flexboxlayout>
				))}
			</stacklayout>
		</scrollview>
	)

	<flexboxlayout flexDirection="column" className="vx-timewheel">
		<flexboxlayout flexDirection="row" className="vx-timewheel-columns">
			{column('Hour', hourChoices, hour24, setHour24)}
			{column('Minute', minuteChoices, minute, setMinute)}
			{props.hasSeconds ? column('Second', minuteChoices, second, setSecond) : null}
		</flexboxlayout>
		<flexboxlayout flexDirection="row" className="vx-timewheel-actions">
			<Pressable className="vx-timewheel-cancel" accessibilityLabel="Cancel" onPress={props.onDismiss}>
				<label text="Cancel" />
			</Pressable>
			<Pressable className="vx-timewheel-done" accessibilityLabel="Done" disabled={!commitValid} accessibilityState={{ disabled: !commitValid } as any} onPress={commit}>
				<label text="Done" />
			</Pressable>
		</flexboxlayout>
	</flexboxlayout>
}
