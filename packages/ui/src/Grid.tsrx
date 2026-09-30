/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { GridProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { autoPlaceGridChildren, ensureGridTracks } from './grid-auto-placement';
import { gridChildPlacement } from './grid-placement';

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	const grid = useRef<any>(null);
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap;
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap was removed; use child margins');
	}

	useEffect(() => {
		const host = grid.current;
		if (!host) return;

		const views: any[] = [];
		host.eachChildView((child: any) => {
			views.push(child);
			return true;
		});

		const placement = autoPlaceGridChildren(
			views.map(gridChildPlacement),
			props.rows,
			props.columns,
		);

		host.rows = ensureGridTracks(props.rows, placement.rowCount);
		host.columns = ensureGridTracks(props.columns, placement.columnCount);
		for (let index = 0; index < views.length; index++) {
			views[index].row = placement.cells[index].row;
			views[index].col = placement.cells[index].col;
		}
	}, [props.children, props.rows, props.columns]);

	<gridlayout
		id={props.id}
		ref={(view: any) => {
			grid.current = view;
			applyEscapeProps(view, props);
		}}
		rows={props.rows}
		columns={props.columns}
		className={cx('vx-grid', props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.children}
	</gridlayout>
}
