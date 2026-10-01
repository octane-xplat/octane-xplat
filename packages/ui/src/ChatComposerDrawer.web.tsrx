import { useId, useState } from 'octane';
import type { ChatComposerDrawerProps } from './props';
import { Badge } from './Badge.web.tsrx';

/** Collapsible drawer panel for a chat composer — attachments, context
 *  chips, previews. With `count`, a toggle row renders a collapsed summary
 *  (badge + label) and the content crossfades/collapses via grid rows.
 *  Without `count` the drawer is always expanded. */
export function ChatComposerDrawer(props: ChatComposerDrawerProps) @{
	const isControlled = props.isCollapsed !== undefined;
	const [internalCollapsed, setInternalCollapsed] = useState(props.defaultIsCollapsed ?? false);
	const isCollapsed = isControlled ? props.isCollapsed : internalCollapsed;
	const canCollapse = props.count != null;
	const contentId = useId();
	const label = props.label ?? 'Items';

	const toggle = () => {
		const next = !isCollapsed;
		if (!isControlled) setInternalCollapsed(next);
		props.onCollapsedChange?.(next);
	};

	<div
		id={props.id}
		className={['vx-chatdrawer', isCollapsed ? 'vx-chatdrawer--collapsed' : undefined, props.className]}
		style={props.style}
	>
		{canCollapse ? (
			<div
				className="vx-chatdrawer-toggle"
				role="button"
				tabIndex={0}
				aria-expanded={!isCollapsed}
				aria-controls={contentId}
				aria-label={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
				onClick={toggle}
				onKeyDown={(e: any) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggle();
					}
				}}
			>
				<div
					className={['vx-chatdrawer-summary', !isCollapsed ? 'vx-chatdrawer-summary--hidden' : undefined]}
					aria-hidden="true"
				>
					{props.collapsedSummary === undefined ? (
						<>
							<Badge className="vx-chatdrawer-badge">{props.count}</Badge>
							<span className="vx-chatdrawer-label">{label}</span>
						</>
					) : (
						props.collapsedSummary
					)}
				</div>
				<div
					className={['vx-chatdrawer-handle', isCollapsed ? 'vx-chatdrawer-handle--hidden' : undefined]}
				/>
			</div>
		) : null}
		<div
			id={contentId}
			className={['vx-chatdrawer-content', canCollapse && isCollapsed ? 'vx-chatdrawer-content--collapsed' : undefined]}
			{...(canCollapse && isCollapsed ? { inert: true } : {})}
		>
			<div className="vx-chatdrawer-inner">{props.children}</div>
		</div>
	</div>
}
