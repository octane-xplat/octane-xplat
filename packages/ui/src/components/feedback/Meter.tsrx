/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { MeterProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { meterRange } from './meter-math'
import { nativeAccessibilityRole } from '../overlays/escape-props'
import '../media/svg'

/** Ring markup matching the web leaf's conic-gradient: a track circle plus a
 *  dash-array arc rotated to start at 12 o'clock, drawn by `svgview`
 *  (androidsvg on Android, SVGKit on iOS). The module-level import above is
 *  the side effect that registers the element. */
function ringSvg(
	size: number,
	strokeWidth: number,
	ratio: number,
	color: string,
	trackColor: string,
): string {
	const c = size / 2
	const r = Math.max(0, (size - strokeWidth) / 2)
	const circumference = 2 * Math.PI * r
	const track = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${strokeWidth}"/>`
	const arc =
		ratio > 0 && r > 0
			? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${ratio * circumference} ${circumference}" transform="rotate(-90 ${c} ${c})"/>`
			: ''

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${track}${arc}</svg>`
}

/**
 * Circular gauge for a measured quantity (storage, rating) — not task progress. Import from `@octane-xplat/ui`.
 *
 * @see MeterProps; ProgressBarProps for operations.
 */
export function Meter(props: MeterProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? props.max ?? 100
	const { max: rangeMax, value, ratio } = meterRange(props.value, min, max)
	const size = props.size ?? 24
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size))
	const color = props.color ?? '#3376cc'
	const trackColor = props.trackColor ?? '#e1ecf7'

	<masonview
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={mergeStyle(
			{ display: 'grid' },
			{ width: size, height: size, ...styleRecord(props.style) },
		)}
		accessible={true}
		accessibilityRole={nativeAccessibilityRole('meter')}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={props.valueLabel ?? `${value} of ${rangeMax}`}
	>
		<svgview
			src={ringSvg(size, strokeWidth, ratio, color, trackColor)}
			stretch="aspectFit"
			style={{ width: size, height: size }}
		/>
		<masonview
			style={mergeStyle({ display: 'grid' }, { justifySelf: 'center', alignSelf: 'center' })}
		>
			{props.children}
		</masonview>
	</masonview>
}
