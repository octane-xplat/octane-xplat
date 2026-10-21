/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { AlertProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Alert — status callout. `tone` picks a class modifier. */
export function Alert(props: AlertProps) @{
	const tone = props.tone ?? 'info';

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-alert', 'vx-alert--' + tone, props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<masonview className="vx-alert-body" style={{display: "flex"}}>
			{props.title != null ? <label className="vx-alert-title" text={props.title} /> : null}
			{props.children}
		</masonview>
	</masonview>
}
