/** @jsxImportSource @nativescript-community/octane */
import type { GridProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

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
	>
		{props.children}
	</gridlayout>
}
