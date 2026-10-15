import type { GridProps } from './props';
import { applyEscapeProps } from './escape-props';
import { gridTrackListToCss } from './grid-tracks';

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap;
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap was removed; use child margins');
	}

	const rowTracks = gridTrackListToCss(props.rows, 'rows');
	const columnTracks = gridTrackListToCss(props.columns, 'columns');

	<div
		id={props.id}
		className={['vx-grid', props.className]}
		style={{
			...(props.style as any),
			...(rowTracks ? { gridTemplateRows: rowTracks } : {}),
			...(columnTracks ? { gridTemplateColumns: columnTracks } : {}),
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
