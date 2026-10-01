import type { ProgressBarProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Tooltip } from './Tooltip.web.tsrx';

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

/** ProgressBar — linear progress with an optional label/value row and track
 *  marks. role="progressbar" carries the label + value range; indeterminate
 *  mode drops aria-valuenow per the ARIA contract and animates the fill.
 *  `Meter` remains the ring form — this is the bar. */
export function ProgressBar(props: ProgressBarProps) @{
	const max = Math.max(props.max ?? 100, 1e-9);
	const isIndeterminate = props.isIndeterminate ?? false;
	const value = clamp(props.value ?? 0, 0, max);
	const pct = (value / max) * 100;
	const formatValueLabel =
		props.formatValueLabel ?? ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);

	const valueText = formatValueLabel(value, max);
	const isDisabled = props.isDisabled ?? false;
	const isLabelHidden = props.isLabelHidden ?? false;
	const hasValueLabel = props.hasValueLabel ?? false;
	const variant = props.variant ?? 'accent';
	const marks = isIndeterminate ? [] : (props.marks ?? []);

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-progressbar',
			`vx-progressbar--${variant}`,
			isDisabled && 'vx-progressbar--disabled',
			props.className,
		]}
		style={props.style}
	>
		{(props.label != null || isLabelHidden) && (
			<div className="vx-progressbar-head">
				<span
					className={[
						'vx-progressbar-label',
						isLabelHidden && 'vx-visually-hidden',
					]}
				>
					{props.label}
				</span>
				{!isIndeterminate && hasValueLabel ? (
					<span className="vx-progressbar-value" aria-hidden="true">{valueText}</span>
				) : null}
			</div>
		)}
		<div
			className="vx-progressbar-trackwrap"
			role="progressbar"
			aria-label={props.label}
			aria-disabled={isDisabled || undefined}
			aria-valuemin={isIndeterminate ? undefined : 0}
			aria-valuemax={isIndeterminate ? undefined : max}
			aria-valuenow={isIndeterminate ? undefined : value}
			aria-valuetext={isIndeterminate ? undefined : valueText}
		>
			<div className="vx-progressbar-track">
				<div
					className={[
						'vx-progressbar-fill',
						isIndeterminate && 'vx-progressbar-fill--indeterminate',
					]}
					style={isIndeterminate ? undefined : { width: `${pct}%` }}
				/>
				{marks.map((mark) => {
					const markPct = (clamp(mark.value, 0, max) / max) * 100;
					const placement = markPct < 25 ? 'start' : markPct > 75 ? 'end' : 'middle';
					// The Tooltip wrapper is the absolutely-positioned box so the
					// mark's tooltip anchor IS the mark.
					return (
						<Tooltip
							key={mark.value}
							className="vx-progressbar-markwrap"
							style={{ insetInlineStart: `${markPct}%` }}
							trigger={
								<span
									className="vx-progressbar-mark"
									data-placement={placement}
									aria-label={mark.label}
								/>
							}
							content={mark.label}
						/>
					);
				})}
			</div>
		</div>
	</div>
}
