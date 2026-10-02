/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useState } from 'octane';
import type { TimestampProps, TimestampFormat } from './props';
import {
	DEFAULT_AUTO_THRESHOLD,
	formatInstant,
	formatTimestampText,
	getLiveInterval,
	isRelativeFormat,
	parseTimestampValue,
	resolveTimestampFormat,
} from './time-format';

import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { textRoleClasses } from './text-role';

/** Timestamp — human-readable instant on native. A label carrying the
 *  formatted text; relative formats set the absolute `full` form as the
 *  accessible label. `isLive` re-renders on the relative cadence. There is
 *  no pointer-hover surface on touch targets, so `hasTooltip`/`tooltipEntries`
 *  are accepted for API parity but inert (the absolute instant stays
 *  reachable via the accessible label — see docs/app/components.md). */
export function Timestamp(props: TimestampProps) @{
	const format = props.format ?? 'auto';
	const autoThreshold = props.autoThreshold ?? DEFAULT_AUTO_THRESHOLD;
	const isLive = props.isLive ?? false;
	const isTimezoneShown = props.isTimezoneShown ?? false;

	const date = parseTimestampValue(props.value);
	const invalid = Number.isNaN(date.getTime());

	const [now, setNow] = useState(() => new Date());
	const diffSeconds = invalid ? 0 : (now.getTime() - date.getTime()) / 1000;
	const resolved = resolveTimestampFormat(format, diffSeconds, autoThreshold);
	const relative = !invalid && isRelativeFormat(resolved);

	useEffect(() => {
		if (!isLive || invalid || !relative) {
			return;
		}

		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;
		const tick = () => {
			if (cancelled) return;
			const interval = getLiveInterval((Date.now() - date.getTime()) / 1000);
			timer = setTimeout(() => {
				setNow(new Date());
				tick();
			}, interval);
		};

		tick();
		return () => {
			cancelled = true;
			if (timer !== undefined) clearTimeout(timer);
		};
	}, [isLive, invalid, relative, props.value]);

	const text = invalid
		? 'Invalid Date'
		: formatTimestampText(date, resolved as Exclude<TimestampFormat, 'auto'>, now, undefined, isTimezoneShown);

	const absoluteLabel = invalid ? undefined : formatInstant(date, 'full', undefined, {});

	const roleClasses = textRoleClasses({
		type: props.type ?? 'supporting',
		size: props.size,
		color: props.color ?? 'secondary',
		weight: props.weight,
	});

	<label
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-timestamp', roleClasses, props.className)}
		style={props.style}
		text={text}
		accessibilityLabel={relative ? absoluteLabel : undefined}
	/>
}
