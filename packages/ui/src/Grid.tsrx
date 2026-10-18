/** @jsxImportSource @nativescript-community/octane */
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

	// Mason's grid engine auto-places unpositioned children row-major
	// (grid-auto-flow); explicit `row`/`col` child props become CSS grid
	// lines in the driver. No imperative placement pass needed.
	<masonview display="grid" gridAutoFlow="row" gridTemplateRows={gridTrackListToCss(props.rows, 'rows')} gridTemplateColumns={gridTrackListToCss(props.columns, 'columns')} id={props.id} ref={(view: any) => {
			applyEscapeProps(view, props);
		}} className={cx('vx-grid', props.className)} style={props.style as any} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState) as any} accessibilityLiveRegion={props.accessibilityLiveRegion as any}>
		{props.children}
	</masonview>
}
