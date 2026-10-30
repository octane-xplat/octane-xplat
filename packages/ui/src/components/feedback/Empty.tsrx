/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { EmptyProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon'

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps): unknown @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-empty', props.isCompact && 'vx-empty--compact', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.icon ? (
			typeof props.icon === 'string' ? (
				<Icon name={props.icon} className="vx-empty-icon" />
			) : (
				props.icon
			)
		) : null}
		{props.title != null ? (
			<label className="vx-empty-title" text={typeof props.title === 'string' ? props.title : ''} />
		) : null}
		{props.description != null ? (
			<label
				className="vx-empty-desc"
				text={typeof props.description === 'string' ? props.description : ''}
			/>
		) : null}
		{typeof props.title === 'string' ? null : props.title}
		{typeof props.description === 'string' ? null : props.description}
		{props.children}
		{props.actions != null ? (
			<masonview className="vx-empty-actions">{props.actions}</masonview>
		) : null}
	</masonview>
}
