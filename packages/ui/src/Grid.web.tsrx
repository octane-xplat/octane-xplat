import type { GridProps, GridSpanProps, GridResponsiveColumns } from './props';
import { styleRecord } from './style-merge'
import { applyEscapeProps } from './escape-props';
import { gridTrackListToCss } from './grid-tracks';
import { applyWebProps } from './platformProps.web';

function columnsToCss(columns: GridProps['columns']): string | undefined {
	if (columns == null) return undefined;
	if (typeof columns === 'number') return `repeat(${columns}, minmax(0, 1fr))`;
	if (typeof columns === 'object') {
		const r = columns as GridResponsiveColumns;
		const mode = r.repeat === 'fit' ? 'auto-fit' : 'auto-fill';
		const track = r.max != null ? `minmax(min(100%, max(${r.minWidth}px, (100% - ${(r.max - 1)} * 16px) / ${r.max})), 1fr)` : `minmax(${r.minWidth}px, 1fr)`;
		return `repeat(${mode}, ${track})`;
	}
	return gridTrackListToCss(columns, 'columns');
}

export function Grid(props: GridProps) @{
	const rowTracks = gridTrackListToCss(props.rows, 'rows');
	const columnTracks = columnsToCss(props.columns);

	<div
		id={props.id}
		className={['vx-grid', props.className]}
		style={{
			...styleRecord(props.style),
			display: 'grid',
			...(rowTracks ? { gridTemplateRows: rowTracks } : {}),
			...(columnTracks ? { gridTemplateColumns: columnTracks } : {}),
		}}
		ref={(el: any) => { applyEscapeProps(el, props); applyWebProps(el, props.web) }}
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

/** GridSpan — a `Grid` child spanning tracks (Astryx). `columns="full"`
 *  spans every declared column (`grid-column: 1 / -1`). */
export function GridSpan(props: GridSpanProps) @{
	const col = props.columns;
	const row = props.rows;
	<div
		id={props.id}
		className={['vx-gridspan', props.className]}
		style={{
			...styleRecord(props.style),
			gridColumn: col === 'full' ? '1 / -1' : typeof col === 'number' ? `span ${col}` : undefined,
			gridRow: typeof row === 'number' ? `span ${row}` : undefined,
		}}
		ref={(el: any) => { applyEscapeProps(el, props); applyWebProps(el, props.web) }}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
	>
		{props.children}
	</div>
}
