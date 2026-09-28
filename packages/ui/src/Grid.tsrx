/** @jsxImportSource @nativescript-community/octane */
import type { GridProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	const deprecatedGap = (props as GridProps & { gap?: number | string }).gap;
	if (deprecatedGap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap was removed; use child margins');
	}

	<gridlayout
		id={props.id}
		ref={(view: any) => applyEscapeProps(view, props)}
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
