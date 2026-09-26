import type { CardProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-card', props.className]} style={props.style}>
		{props.header != null ? <div className="vx-card-header">{props.header}</div> : null}
		<div className="vx-card-body">{props.children}</div>
		{props.footer != null ? <div className="vx-card-footer">{props.footer}</div> : null}
	</div>
}
