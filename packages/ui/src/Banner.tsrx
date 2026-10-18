/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { BannerProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Banner — inline notice strip with optional dismiss affordance. */
export function Banner(props: BannerProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="row" className={cx('vx-banner', props.className)} style={mergeStyle({display: "flex"}, props.style as any)}>
		{props.icon ? <Icon name={props.icon} className="vx-banner-icon" /> : null}
		<masonview className="vx-banner-body" style={{display: "flex"}}>{props.children}</masonview>
		{props.onDismiss ? <label className="vx-banner-dismiss" text="✕" onTap={props.onDismiss} /> : null}
	</masonview>
}
