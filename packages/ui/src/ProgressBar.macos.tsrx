/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ProgressBarProps } from './props';
import { cx } from '@octane-xplat/lib';
import { getColorScheme } from './colorScheme.macos';
import { mutedColor, progressFillColor, textColor } from './scheme-colors';

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

/** ProgressBar — macOS leaf. Indeterminate renders a steady 40% fill (the
 *  AppKit host has no JS-driven `animate` on views). Marks overlay via
 *  star-column grids like the mobile leaf. */
export function ProgressBar(props: ProgressBarProps) @{
	const scheme = getColorScheme();
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
	const showHead = !isLabelHidden || (!isIndeterminate && hasValueLabel);

	<masonview display="flex" ref={props.ref} id={props.id} className={cx('vx-progressbar', `vx-progressbar--${variant}`, props.className)} style={{ flexDirection: 'column', ...(isDisabled ? { opacity: 0.38 } : {}), ...(props.style as any) }} flexDirection="column" accessibilityRole="progressbar" accessibilityLabel={props.accessibilityLabel ?? props.label} accessibilityValue={isIndeterminate ? undefined : value} accessibilityMinValue={0} accessibilityMaxValue={max} accessibilityValueDescription={isIndeterminate ? 'In progress' : valueText}>
		{showHead ? (
			<masonview display="flex" flexDirection="row" justifyContent="space-between" className="vx-progressbar-head">
				<label className="vx-progressbar-label" whiteSpace="nowrap" style={{ color: textColor(scheme), fontSize: 13 }}>
					{isLabelHidden ? ' ' : props.label}
				</label>
				{!isIndeterminate && hasValueLabel ? (
					<label className="vx-progressbar-value" whiteSpace="nowrap" style={{ color: mutedColor(scheme), fontSize: 13 }}>
						{valueText}
					</label>
				) : null}
			</masonview>
		) : null}
		<masonview display="grid" className="vx-progressbar-track" height={8} style={{ borderRadius: 4, backgroundColor: scheme === 'dark' ? '#2e2e2e' : '#eaeaea' }}>
			<masonview style={{ borderRadius: 4, backgroundColor: progressFillColor(variant, scheme) , justifySelf: 'start'}} display="flex" className={cx('vx-progressbar-fill', `vx-progressbar-fill--${variant}`)} width={isIndeterminate ? '40%' : `${pct}%`} />
			{marks.map((mark) => {
				const markPct = clamp(mark.value, 0, max) / max;
				return (
					<masonview display="grid" gridTemplateColumns={`${markPct}fr auto ${1 - markPct}fr`} key={mark.value}>
						<masonview style={{ backgroundColor: mutedColor(scheme) , gridColumn: '2'}} display="flex" className="vx-progressbar-mark" width={2} height={8} accessibilityLabel={mark.label} />
					</masonview>
				);
			})}
		</masonview>
	</masonview>
}
