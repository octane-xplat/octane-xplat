/** @jsxImportSource @octane-xplat/jsx/dom */
import type { EmptyProps } from './props'
import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon.web.tsrx'

/** Empty — empty-state block: icon + title + description + actions
 *  (Astryx `EmptyState`). `isCompact` tightens the rhythm via the
 *  `vx-empty--compact` class hook. */
export function Empty(props: EmptyProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-empty', props.isCompact && 'vx-empty--compact', props.className]}
		style={props.style}
	>
		{props.icon ? (
			typeof props.icon === 'string' ? (
				<Icon name={props.icon} className="vx-empty-icon" />
			) : (
				props.icon
			)
		) : null}
		{props.title != null ? <span className="vx-empty-title">{props.title}</span> : null}
		{props.description != null ? <span className="vx-empty-desc">{props.description}</span> : null}
		{props.children}
		{props.actions != null ? <div className="vx-empty-actions">{props.actions}</div> : null}
	</div>
}
