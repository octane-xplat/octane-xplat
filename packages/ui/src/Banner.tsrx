/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { BannerProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Banner — inline notice strip with optional dismiss affordance. */
const statusIcon: Record<string, string> = { info: 'xplat-info', success: 'xplat-check-circle', warning: 'xplat-warning', error: 'xplat-error' };

export function Banner(props: BannerProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-banner', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{typeof props.icon === 'string' ? <Icon name={props.icon} className="vx-banner-icon" /> : props.icon ?? null}
		<masonview className="vx-banner-body" style={{display: "flex"}}>{props.children}</masonview>
		{props.onDismiss ? <label className="vx-banner-dismiss" text="✕" onTap={props.onDismiss} /> : null}
	</masonview>
}
