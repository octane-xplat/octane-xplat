/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { GridProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { bindNativeGridPlacement } from './native-grid-placement';

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

		return bindNativeGridPlacement(host, props.rows, props.columns);
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
