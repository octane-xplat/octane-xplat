import type { GridProps } from './props';
import { applyEscapeProps } from './escape-props';

function parseTracks(spec?: string) {
	return spec?.split(',').map((part) => {
		const track = part.trim();
		if (track === 'auto') return 'auto';
		if (track.endsWith('*')) return `${track.slice(0, -1) || '1'}fr`;
		return /^\d+(?:\.\d+)?$/.test(track) ? `${track}px` : track;
	}).join(' ');
}

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap;
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap was removed; use child margins');
	}

	<div
		id={props.id}
		className={['vx-grid', props.className]}
		style={{
			...props.style,
			...(props.rows ? { gridTemplateRows: parseTracks(props.rows) } : {}),
			...(props.columns ? { gridTemplateColumns: parseTracks(props.columns) } : {}),
		}}
		ref={(el: any) => applyEscapeProps(el, props)}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		{props.children}
	</div>
}
