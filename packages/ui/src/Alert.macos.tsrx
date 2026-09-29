/** @jsxImportSource @xplat/macos/renderer */
import type { AlertProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.macos.tsrx';

/** Alert — status callout. `tone` picks a class modifier. */
// Tone → border colors mirror .vx-alert--* in theme/tokens.css — the
// AppKit host has no CSS layer, so the chrome metric lives inline.
const TONE_BORDER: Record<string, string> = {
	info: '#171717',
	warning: '#d9a400',
	error: '#dc2626',
	success: '#2e9e5b',
}

export function Alert(props: AlertProps) @{
	const tone = props.tone ?? 'info';
	const toneColor = TONE_BORDER[tone] ?? '#171717';

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-alert', 'vx-alert--' + tone, props.className)}
		style={{
			borderWidth: 1,
			borderTopWidth: 1,
			borderColor: toneColor,
			borderTopColor: toneColor,
			borderRadius: 6,
			borderTopLeftRadius: 6,
			...props.style,
		}}
	>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<flexboxlayout className="vx-alert-body">
			{props.title != null ? <label className="vx-alert-title" text={props.title} /> : null}
			{props.children}
		</flexboxlayout>
	</flexboxlayout>
}
