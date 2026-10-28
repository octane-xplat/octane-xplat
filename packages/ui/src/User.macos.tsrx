/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { UserProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Avatar } from './Avatar.macos.tsrx'

/** User — avatar + name/description row. `onSelect` makes the row
 *  tappable. */
export function User(props: UserProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-user', props.onSelect && 'vx-user--pressable', props.className)}
		style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, props.style))}
		onTap={props.onSelect}
	>
		<Avatar src={props.src} fallback={props.fallback} alt={props.name} size={props.size} />
		<masonview className="vx-user-body" style={{ display: 'flex' }}>
			{props.name != null ? <label className="vx-user-name" text={props.name} /> : null}
			{props.description != null ? (
				<label className="vx-user-desc" text={props.description} />
			) : null}
		</masonview>
	</masonview>
}
