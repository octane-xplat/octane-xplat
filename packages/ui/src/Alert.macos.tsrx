/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle, styleRecord } from './style-merge'
import type { AlertProps } from "./props";
import { cx } from "@octane-xplat/lib";
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

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-alert', 'vx-alert--' + tone, props.className)} style={mergeStyle({flexDirection: "row"}, mergeStyle({display: "flex"}, {
			borderWidth: 1,
			borderTopWidth: 1,
			borderColor: toneColor,
			borderTopColor: toneColor,
			borderRadius: 6,
			borderTopLeftRadius: 6,
			...styleRecord(props.style),
		}))}>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<masonview className="vx-alert-body" style={{display: "flex"}}>
			{props.title != null ? <label className="vx-alert-title" text={props.title} /> : null}
			{props.children}
		</masonview>
	</masonview>
}
