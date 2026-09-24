/** @jsxImportSource @nativescript-community/octane */
import type { GridProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	if (props.gap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap is not supported; use child margins instead.');
	}

	<gridlayout
		ref={(view: any) => applyEscapeProps(view, props)}
		rows={props.rows}
		columns={props.columns}
		className={cx('vx-grid', props.className)}
		style={props.style}
	>
		{props.children}
	</gridlayout>
}
