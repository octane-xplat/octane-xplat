/** @jsxImportSource @xplat/macos/renderer */
import { useEffect, useState } from 'octane';
import type { TimestampProps, TimestampFormat } from './props';
import {
	DEFAULT_AUTO_THRESHOLD,
	formatInstant,
	formatTimestampText,
	formatTooltipLines,
	getLiveInterval,
	isRelativeFormat,
	parseTimestampValue,
	resolveTimestampFormat,
} from './time-format';

import { cx } from './cx';
import { textRoleClasses } from './text-role';
import { Hoverable } from './Hoverable.tsrx';

/** Timestamp — macOS leaf. The AppKit host's Hoverable carries the tooltip
 *  card (labels + copyable values as plain rows; the copy affordance is
 *  pointer-web only). */
export function Timestamp(props: TimestampProps) @{
	const format = props.format ?? 'auto';
	const autoThreshold = props.autoThreshold ?? DEFAULT_AUTO_THRESHOLD;
	const hasTooltip = props.hasTooltip ?? true;
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
			timer = setTimeout(
				() => {
					setNow(new Date());
					tick();
				},
				getLiveInterval((Date.now() - date.getTime()) / 1000),
			);
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

	const lines =
		!invalid && hasTooltip
			? formatTooltipLines(
					date,
					props.tooltipEntries?.length ? props.tooltipEntries : [{ format: 'full' }],
					undefined,
				)
			: [];

	const labelNode = (
		<label
			id={props.id}
			className={cx('vx-timestamp', roleClasses, props.className)}
			style={props.style}
			text={text}
			accessibilityLabel={relative ? absoluteLabel : undefined}
		/>
	);

	return lines.length > 0 ? (
		<Hoverable
			card={
				<flexboxlayout flexDirection="column" style={{ padding: 8, gap: 4 }}>
					{lines.map((line, i) => (
						<flexboxlayout key={i} flexDirection="row" style={{ gap: 8 }}>
							{line.label != null ? (
								<label className="text-sm text-muted" text={line.label} />
							) : null}
							<label className="text-sm" text={line.value} />
						</flexboxlayout>
					))}
				</flexboxlayout>
			}
			placement="top"
		>
			{labelNode}
		</Hoverable>
	) : (
		labelNode
	);
}
