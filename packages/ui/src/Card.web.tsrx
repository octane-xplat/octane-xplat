import type { CardProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-card', props.variant && `vx-card--${props.variant}`, props.elevation && `vx-card--elev-${props.elevation}`, props.className]} style={{...props.style, padding: props.padding == null ? undefined : props.padding * 4, width: props.width, height: props.height, maxWidth: props.maxWidth}}>
		{props.header != null ? <div className="vx-card-header">{props.header}</div> : null}
		<div className="vx-card-body">{props.children}</div>
		{props.footer != null ? <div className="vx-card-footer">{props.footer}</div> : null}
	</div>
}
