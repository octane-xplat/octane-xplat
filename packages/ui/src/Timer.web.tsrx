import { useEffect, useRef, useState } from 'octane'
import type { TimerProps } from './props'
import {
	elapsedMilliseconds,
	msUntilNextChange,
	resolveTimerFormat,
	timerPresentation,
} from './timer-format'

import { applyEscapeProps } from './escape-props'
import { textRoleClasses } from './text-role'

/** Timer — live elapsed duration since `startTimeMs` (ms; defaults to mount).
 *  Renders a semantic `<time>` whose `dateTime` is the ISO 8601 duration.
 *  The tick cadence follows the displayed precision — seconds under an hour
 *  in 'elapsed' mode, minutes after. */
export function Timer(props: TimerProps) @{
	const format = resolveTimerFormat(props.format)
	const startRef = useRef<number>(0)
	if (startRef.current === 0) {
		startRef.current = props.startTimeMs ?? Date.now()
	}

	const startTimeMs = props.startTimeMs ?? startRef.current

	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined
		let cancelled = false
		const tick = () => {
			if (cancelled) {
				return
			}

			const at = Date.now()
			const elapsed = elapsedMilliseconds(at, startTimeMs)
			timer = setTimeout(
				() => {
					setNow(Date.now())
					tick()
				},
				msUntilNextChange(at, startTimeMs, elapsed, format),
			)
		}

		tick()
		return () => {
			cancelled = true
			if (timer !== undefined) {
				clearTimeout(timer)
			}
		}
	}, [startTimeMs, format])

	const elapsed = elapsedMilliseconds(now, startTimeMs)
	const { dateTime, text } = timerPresentation(elapsed, format)
	const roleClasses = textRoleClasses({
		type: props.type ?? 'supporting',
		size: props.size,
		color: props.color ?? 'secondary',
		weight: props.weight,
	})

	<time
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-timer', ...roleClasses, props.className]}
		style={props.style}
		dateTime={dateTime}
	>
		{text}
	</time>
}
