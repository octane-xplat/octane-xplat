/** @jsxImportSource @nativescript-community/octane */
import { AccessibilityRole } from '@nativescript/core';
import type { MeterProps } from './props';
import { cx } from './cx';
import { meterRange } from './meter-math';
import './svg.native';

/** Ring markup matching the web leaf's conic-gradient: a track circle plus a
 *  dash-array arc rotated to start at 12 o'clock, drawn by `svgview`
 *  (androidsvg on Android, SVGKit on iOS). The module-level import above is
 *  the side effect that registers the element. */
function ringSvg(size: number, strokeWidth: number, ratio: number, color: string, trackColor: string): string {
	const c = size / 2;
	const r = Math.max(0, (size - strokeWidth) / 2);
	const circumference = 2 * Math.PI * r;
	const track = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${strokeWidth}"/>`;
	const arc = ratio > 0 && r > 0
		? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${ratio * circumference} ${circumference}" transform="rotate(-90 ${c} ${c})"/>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${track}${arc}</svg>`;
}

export function Meter(props: MeterProps) @{
	const max = props.max ?? 100;
	const { max: rangeMax, value, ratio } = meterRange(props.value, max);
	const size = props.size ?? 24;
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size));
	const color = props.color ?? '#3376cc';
	const trackColor = props.trackColor ?? '#e1ecf7';

	<gridlayout
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={{ width: size, height: size, ...props.style }}
		accessible={true}
		accessibilityRole={AccessibilityRole.ProgressBar}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={`${value} of ${rangeMax}`}
	>
		<svgview src={ringSvg(size, strokeWidth, ratio, color, trackColor)} stretch="aspectFit" style={{ width: size, height: size }} />
		<gridlayout horizontalAlignment="center" verticalAlignment="middle">
			{props.children}
		</gridlayout>
	</gridlayout>
}
