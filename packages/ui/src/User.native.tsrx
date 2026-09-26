/** @jsxImportSource @nativescript-community/octane */
import type { UserProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Avatar } from './Avatar.native.tsrx';

/** User — avatar + name/description row. `onSelect` makes the row
 *  tappable. */
export function User(props: UserProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-user', props.onSelect && 'vx-user--pressable', props.className)}
		style={props.style}
		onTap={props.onSelect}
	>
		<Avatar src={props.src} fallback={props.fallback} alt={props.name} size={props.size} />
		<flexboxlayout className="vx-user-body">
			{props.name != null ? <label className="vx-user-name" text={props.name} /> : null}
			{props.description != null ? <label className="vx-user-desc" text={props.description} /> : null}
		</flexboxlayout>
	</flexboxlayout>
}
