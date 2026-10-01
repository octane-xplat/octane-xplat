/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { TimerProps } from './props';
import {
	elapsedMilliseconds,
	msUntilNextChange,
	resolveTimerFormat,
	timerPresentation,
} from './timer-format';

import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { textRoleClasses } from './text-role';

/** Timer — live elapsed duration label since `startTime` (ms; defaults to
 *  mount). Native has no `<time>` element — the ISO 8601 duration rides on
 *  `accessibilityValue`. Tick cadence follows the displayed precision. */
export function Timer(props: TimerProps) @{
	const format = resolveTimerFormat(props.format);
	const startRef = useRef<number>(0);
	if (startRef.current === 0) {
		startRef.current = props.startTime ?? Date.now();
	}

	const startTime = props.startTime ?? startRef.current;

	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;
		const tick = () => {
			if (cancelled) return;
			const at = Date.now();
			const elapsed = elapsedMilliseconds(at, startTime);
			timer = setTimeout(() => {
				setNow(Date.now());
				tick();
			}, msUntilNextChange(at, startTime, elapsed, format));
		};

		tick();
		return () => {
			cancelled = true;
			if (timer !== undefined) clearTimeout(timer);
		};
	}, [startTime, format]);

	const elapsed = elapsedMilliseconds(now, startTime);
	const { dateTime, text } = timerPresentation(elapsed, format);
	const roleClasses = textRoleClasses({
		type: props.type ?? 'supporting',
		size: props.size,
		color: props.color ?? 'secondary',
		weight: props.weight,
	});

	<label
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-timer', roleClasses, props.className)}
		style={props.style}
		text={text}
		accessibilityValue={dateTime}
	/>
}
