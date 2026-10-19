/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { GridProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { gridTrackListToCss } from './grid-tracks';

let warnedAboutGap = false;

/**
 * Two-dimensional track layout — children take `row`/`col`/`rowSpan`/`colSpan` placement props. Import from `@octane-xplat/ui`.
 *
 * @see GridProps for the track grammar, diagnostics, and an example; LayoutChildProps for placement.
 */
export function Grid(props: GridProps) @{
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap;
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap was removed; use child margins');
	}

	const rowTracks = gridTrackListToCss(props.rows, 'rows');
	const columnTracks = gridTrackListToCss(props.columns, 'columns');

	// Omitted tracks belong to the CSS cascade. Do not emit undefined style
	// entries: the driver's deferred Mason replay would clear class tracks.
	// Mason's grid engine auto-places unpositioned children row-major
	// (grid-auto-flow); explicit `row`/`col` child props become CSS grid
	// lines in the driver. No imperative placement pass needed.
	<masonview id={props.id} ref={(view: any) => {
			applyEscapeProps(view, props);
		}} className={cx('vx-grid', props.className)} style={mergeStyle({display: "grid", gridAutoFlow: "row", ...(rowTracks ? { gridTemplateRows: rowTracks } : {}), ...(columnTracks ? { gridTemplateColumns: columnTracks } : {})}, props.style)} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState)} accessibilityLiveRegion={props.accessibilityLiveRegion}>
		{props.children}
	</masonview>
}
