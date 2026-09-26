import type { BannerProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** Banner — inline notice strip with optional dismiss affordance. */
export function Banner(props: BannerProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-banner', props.className]}
		style={props.style}
		role="status"
	>
		{props.icon ? <Icon name={props.icon} className="vx-banner-icon" /> : null}
		<div className="vx-banner-body">{props.children}</div>
		{props.onDismiss
			? <span className="vx-banner-dismiss" role="button" aria-label="Dismiss" tabIndex={0} onClick={props.onDismiss} onKeyDown={(e: any) => { if (e.key === 'Enter') props.onDismiss?.(); }}>✕</span>
			: null}
	</div>
}
