import type { UserProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Avatar } from './Avatar.web.tsrx';

/** User — avatar + name/description row. `onSelect` makes the row
 *  pressable. */
export function User(props: UserProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-user', props.onSelect ? 'vx-user--pressable' : undefined, props.className]}
		style={props.style}
		role={props.onSelect ? 'button' : undefined}
		tabIndex={props.onSelect ? 0 : undefined}
		onClick={props.onSelect}
		onKeyDown={(e: any) => { if (props.onSelect && e.key === 'Enter') props.onSelect(); }}
	>
		<Avatar src={props.src} fallback={props.fallback} alt={props.name} size={props.size} />
		<div className="vx-user-body">
			{props.name != null ? <span className="vx-user-name">{props.name}</span> : null}
			{props.description != null ? <span className="vx-user-desc">{props.description}</span> : null}
		</div>
	</div>
}
