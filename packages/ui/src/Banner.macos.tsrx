/** @jsxImportSource @octane-xplat/macos-renderer */
import type { BannerProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.macos.tsrx';

/** Banner — inline notice strip with optional dismiss affordance. */
export function Banner(props: BannerProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-banner', props.className)}
		style={props.style}
	>
		{props.icon ? <Icon name={props.icon} className="vx-banner-icon" /> : null}
		<flexboxlayout className="vx-banner-body">{props.children}</flexboxlayout>
		{props.onDismiss ? <label className="vx-banner-dismiss" text="✕" style={{ marginLeft: 8, width: 12, height: 16, textAlign: 'center' }} onTap={props.onDismiss} /> : null}
	</flexboxlayout>
}
