/** @jsxImportSource @nativescript-community/octane */
import type { AlertProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.tsrx';

/** Alert — status callout. `tone` picks a class modifier. */
export function Alert(props: AlertProps) @{
	const tone = props.tone ?? 'info';

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-alert', 'vx-alert--' + tone, props.className)}
		style={props.style}
	>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<flexboxlayout className="vx-alert-body">
			{props.title != null ? <label className="vx-alert-title" text={props.title} /> : null}
			{props.children}
		</flexboxlayout>
	</flexboxlayout>
}
