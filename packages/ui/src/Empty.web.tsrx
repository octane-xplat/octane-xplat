import type { EmptyProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-empty', props.className]} style={props.style}>
		{props.icon ? <Icon name={props.icon} className="vx-empty-icon" /> : null}
		{props.title != null ? <span className="vx-empty-title">{props.title}</span> : null}
		{props.description != null ? <span className="vx-empty-desc">{props.description}</span> : null}
		{props.children}
	</div>
}
