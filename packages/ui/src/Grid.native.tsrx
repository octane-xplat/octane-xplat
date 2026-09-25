/** @jsxImportSource @nativescript-community/octane */
import type { GridProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassConfigOf } from './glass';

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	if (props.gap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap is not supported; use child margins instead.');
	}

	<gridlayout
		id={props.id}
		ref={(view: any) => applyEscapeProps(view, props)}
		rows={props.rows}
		columns={props.columns}
		className={cx('vx-grid', glassClassOf(props.glass), props.className)}
		style={props.style}
		iosGlassEffect={glassConfigOf(props.glass)}
	>
		{props.children}
	</gridlayout>
}
