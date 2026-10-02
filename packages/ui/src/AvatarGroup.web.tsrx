import { descriptorChildren } from 'octane';
import type { AvatarGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { toChildArray, mapChildren } from './child-array';
import { Avatar } from './Avatar.web.tsrx';

/** AvatarGroup — row of overlapping avatars. `max` collapses the rest into
 *  a `+N` avatar. Overlap is one-third of `size`, applied per-item so it
 *  works identically without relying on sibling CSS selectors. */
function AvatarGroupImpl(props: AvatarGroupProps) @{
	const size = props.size ?? 32;
	const children = toChildArray(props.children);
	const shown = props.max != null ? children.slice(0, props.max) : children;
	const overflow = children.length - shown.length;
	const itemStyle = (i: number) => (i === 0 ? undefined : { marginLeft: -size / 3 });

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar-group', props.className]}
		style={props.style}
	>
		{mapChildren(shown, (child: any, i: number) => (
			<div className="vx-avatar-group-item" style={itemStyle(i)}>{child}</div>
		))}
		{overflow > 0
			? <div className="vx-avatar-group-item" style={itemStyle(shown.length)}><Avatar fallback={`+${overflow}`} size={size} /></div>
			: null}
	</div>
}

/** Ask Octane to preserve inspectable child descriptors for collection operations. */
export const AvatarGroup = descriptorChildren(AvatarGroupImpl);
