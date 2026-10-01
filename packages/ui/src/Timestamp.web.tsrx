import { useEffect, useState } from 'octane';
import type { TimestampProps } from './props';
import type { TimestampTooltipLine } from './time-format';
import {
	DEFAULT_AUTO_THRESHOLD,
	formatInstant,
	formatTimestampText,
	formatTooltipLines,
	getLiveInterval,
	isAbsoluteFormat,
	isRelativeFormat,
	parseTimestampValue,
	resolveTimestampFormat,
} from './time-format';

import type { TimestampFormat } from './props';
import { applyEscapeProps } from './escape-props';
import { Hoverable } from './Hoverable.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { copyText } from './clipboard-write';
import { textRoleClasses } from './text-role';

const COPY_FEEDBACK_MS = 1500;

function CopyButton(props: { value: string; label?: string }) @{
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
		return () => clearTimeout(t);
	}, [copied]);

	<button
		type="button"
		className="vx-timestamp-copy"
		aria-label={copied ? 'Copied' : `Copy ${props.value}`}
		title={copied ? 'Copied' : 'Copy'}
		onClick={() => {
			void copyText(props.value).then((ok) => {
				if (ok) setCopied(true);
			});
		}}
	>
		<Icon name={copied ? 'xplat-check' : 'xplat-copy'} size={12} />
	</button>
}

function TimestampCard(props: { lines: readonly TimestampTooltipLine[] }) @{
	const hasLabelColumn = props.lines.some((l) => l.label != null);
	const hasActionColumn = props.lines.some((l) => l.isCopyable);
	const template = hasLabelColumn
		? hasActionColumn
			? 'auto 1fr auto'
			: 'auto 1fr'
		: hasActionColumn
			? '1fr auto'
			: '1fr';

	<div className="vx-timestamp-card">
		<div className="vx-timestamp-card-grid" style={{ gridTemplateColumns: template }}>
			{props.lines.map((line, i) => (
				<div key={i} className="vx-timestamp-card-row">
					{hasLabelColumn ? <div className="vx-timestamp-card-label">{line.label ?? ''}</div> : null}
					<div className="vx-timestamp-card-value">{line.value}</div>
					{hasActionColumn ? (
						<div className="vx-timestamp-card-action">
							{line.isCopyable ? <CopyButton value={line.value} /> : null}
						</div>
					) : null}
				</div>
			))}
		</div>
	</div>
}

/** Timestamp — human-readable instant. `<time dateTime>` carries the ISO
 *  instant; relative formats announce the absolute `full` form via
 *  aria-label. 'auto' is relative below `autoThreshold` seconds, else
 *  `date_time`. `isLive` re-renders on the relative cadence. `hasTooltip`
 *  opens the Hoverable card with one row per tooltip entry. */
export function Timestamp(props: TimestampProps) @{
	const format = props.format ?? 'auto';
	const autoThreshold = props.autoThreshold ?? DEFAULT_AUTO_THRESHOLD;
	const hasTooltip = props.hasTooltip ?? true;
	const isLive = props.isLive ?? false;
	const isTimezoneShown = props.isTimezoneShown ?? false;

	const date = parseTimestampValue(props.value);
	const invalid = Number.isNaN(date.getTime());

	const [now, setNow] = useState(() => new Date());
	const relative = !invalid && isRelativeFormat(resolveTimestampFormat(format, (now.getTime() - date.getTime()) / 1000, autoThreshold));

	useEffect(() => {
		if (!isLive || invalid || !relative) {
			return;
		}

		const tick = () => {
			const interval = getLiveInterval((Date.now() - date.getTime()) / 1000);
			const t = setTimeout(() => {
				setNow(new Date());
				tick();
			}, interval);

			return t;
		};

		const interval = getLiveInterval((Date.now() - date.getTime()) / 1000);
		const t = setTimeout(() => {
			setNow(new Date());
			tick();
		}, interval);

		return () => clearTimeout(t);
	}, [isLive, invalid, relative, props.value]);

	const diffSeconds = invalid ? 0 : (now.getTime() - date.getTime()) / 1000;
	const resolved = resolveTimestampFormat(format, diffSeconds, autoThreshold);
	const text = invalid
		? 'Invalid Date'
		: formatTimestampText(date, resolved as Exclude<TimestampFormat, 'auto'>, now, undefined, isTimezoneShown);

	const absoluteLabel = invalid ? undefined : formatInstant(date, 'full', undefined, {});
	const iso = invalid ? undefined : date.toISOString();

	const lines =
		!invalid && hasTooltip
			? formatTooltipLines(
					date,
					props.tooltipEntries?.length ? props.tooltipEntries : [{ format: 'full' }],
					undefined,
				)
			: [];

	const roleClasses = textRoleClasses({
		type: props.type ?? 'supporting',
		size: props.size,
		color: props.color ?? 'secondary',
		weight: props.weight,
	});

	const time = (
		<time
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={['vx-timestamp', ...roleClasses, props.className]}
			style={props.style}
			dateTime={iso}
			aria-label={isRelativeFormat(resolved) ? absoluteLabel : undefined}
		>
			{text}
		</time>
	);

	return hasTooltip && lines.length > 0 ? (
		<Hoverable card={<TimestampCard lines={lines} />} placement="top">
			{time}
		</Hoverable>
	) : (
		time
	);
}
