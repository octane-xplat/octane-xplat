/** @jsxImportSource @nativescript-community/octane */
import type { AlertProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Alert — status callout. `tone` picks a class modifier. */
export function Alert(props: AlertProps) @{
	const tone = props.tone ?? 'info';

	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="row" className={cx('vx-alert', 'vx-alert--' + tone, props.className)} style={props.style as any}>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<masonview display="flex" className="vx-alert-body">
			{props.title != null ? <label className="vx-alert-title" text={props.title} /> : null}
			{props.children}
		</masonview>
	</masonview>
}
