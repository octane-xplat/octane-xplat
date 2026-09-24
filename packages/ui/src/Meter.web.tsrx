import type { MeterProps } from './props';
import { meterRange } from './meter-math';

export function Meter(props: MeterProps) @{
	const max = props.max ?? 100;
	const { max: rangeMax, value, ratio } = meterRange(props.value, max);
	const size = props.size ?? 24;
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size));
	const color = props.color ?? '#3376cc';
	const trackColor = props.trackColor ?? '#e1ecf7';
	const sweep = ratio * 360;
	const ringStyle = {
		position: 'absolute' as const, inset: 0, borderRadius: '50%',
		backgroundImage: `conic-gradient(${color} 0deg ${sweep}deg, ${trackColor} ${sweep}deg 360deg)`,
		mask: `radial-gradient(circle, transparent calc(50% - ${strokeWidth}px), #000 calc(50% - ${strokeWidth}px + 0.5px))`,
		WebkitMask: `radial-gradient(circle, transparent calc(50% - ${strokeWidth}px), #000 calc(50% - ${strokeWidth}px + 0.5px))`,
	};

	<div
		id={props.id}
		className={['vx-meter', props.className]}
		style={{ display: 'grid', placeItems: 'center', position: 'relative', width: size, height: size, ...props.style }}
		role="progressbar"
		aria-label={props.accessibilityLabel}
		aria-valuemin={0}
		aria-valuemax={rangeMax}
		aria-valuenow={value}
	>
		<div aria-hidden="true" style={ringStyle} />
		<div style={{ position: 'relative' }}>{props.children}</div>
	</div>
}
