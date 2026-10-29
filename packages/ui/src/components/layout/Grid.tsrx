/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { GridProps, GridSpanProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { gridTrackListToCss } from '../collections/grid-tracks'

let warnedAboutGap = false

/**
 * Two-dimensional track layout — children take `row`/`col`/`rowSpan`/`colSpan` placement props. Import from `@octane-xplat/ui`.
 *
 * @see GridProps for the track grammar, diagnostics, and an example; LayoutChildProps for placement.
 */
export function Grid(props: GridProps) @{
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true
		console.warn('[Grid] gap was removed; use child margins')
	}

	const rowTracks = gridTrackListToCss(props.rows, 'rows')
	const columnTracks = gridTrackListToCss(
		typeof props.columns === 'number'
			? String(props.columns)
			: typeof props.columns === 'object'
				? 'auto'
				: props.columns,
		'columns',
	)

	// Omitted tracks belong to the CSS cascade. Do not emit undefined style
	// entries: the driver's deferred Mason replay would clear class tracks.
	// Mason's grid engine auto-places unpositioned children row-major
	// (grid-auto-flow); explicit `row`/`col` child props become CSS grid
	// lines in the driver. No imperative placement pass needed.

	<masonview
		id={props.id}
		ref={(view: any) => {
			applyEscapeProps(view, props)
		}}
		className={cx('vx-grid', props.className)}
		style={mergeStyle(
			{
				display: 'grid',
				gridAutoFlow: 'row',
				...(rowTracks ? { gridTemplateRows: rowTracks } : {}),
				...(columnTracks ? { gridTemplateColumns: columnTracks } : {}),
			},
			props.style,
		)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	>
		{props.children}
	</masonview>
}

/** GridSpan — spanning Grid child (Astryx); passes through col/row span as
 *  child placement metadata. */
export function GridSpan(props: GridSpanProps) @{
	<masonview
		id={props.id}
		className={cx('vx-gridspan', props.className)}
		style={{
			...styleRecord(props.style),
			gridColumn:
				props.columns === 'full' || props.columns == null ? undefined : 'span ' + props.columns,
			gridRow: props.rows ? 'span ' + props.rows : undefined,
		}}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.children}
	</masonview>
}
