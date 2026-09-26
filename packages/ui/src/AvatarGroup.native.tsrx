/** @jsxImportSource @nativescript-community/octane */
import type { AvatarGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { toChildArray } from './child-array';
import { Avatar } from './Avatar.native.tsrx';

/** AvatarGroup — row of overlapping avatars. `max` collapses the rest into
 *  a `+N` avatar. Overlap is one-third of `size`, applied per-item so it
 *  works identically without relying on sibling CSS selectors. */
export function AvatarGroup(props: AvatarGroupProps) @{
	const size = props.size ?? 32;
	const children = toChildArray(props.children);
	const shown = props.max != null ? children.slice(0, props.max) : children;
	const overflow = children.length - shown.length;
	const itemStyle = (i: number) => (i === 0 ? undefined : { marginLeft: -size / 3 });

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-avatar-group', props.className)}
		style={props.style}
	>
		{shown.map((child: any, i: number) => (
			<flexboxlayout key={i} className="vx-avatar-group-item" style={itemStyle(i)}>{child}</flexboxlayout>
		))}
		{overflow > 0
			? <flexboxlayout className="vx-avatar-group-item" style={itemStyle(shown.length)}><Avatar fallback={`+${overflow}`} size={size} /></flexboxlayout>
			: null}
	</flexboxlayout>
}
