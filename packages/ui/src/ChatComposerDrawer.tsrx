/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { ChatComposerDrawerProps } from './props';
import { cx } from './cx';
import { Badge } from './Badge.tsrx';
import { nativeAccessibilityRole } from './escape-props';

/** Collapsible drawer panel for a chat composer — attachments, context
 *  chips, previews. With `count`, a toggle row renders the collapsed
 *  summary (badge + label); without it the drawer is always expanded.
 *  The collapse is instant on native (the grid-row crossfade is a DOM
 *  behavior). */
export function ChatComposerDrawer(props: ChatComposerDrawerProps) @{
	const isControlled = props.isCollapsed !== undefined;
	const [internalCollapsed, setInternalCollapsed] = useState(props.defaultIsCollapsed ?? false);
	const isCollapsed = isControlled ? props.isCollapsed : internalCollapsed;
	const canCollapse = props.count != null;
	const label = props.label ?? 'Items';

	const toggle = () => {
		const next = !isCollapsed;
		if (!isControlled) setInternalCollapsed(next);
		props.onCollapsedChange?.(next);
	};

	<flexboxlayout
		id={props.id}
		className={cx('vx-chatdrawer', isCollapsed && 'vx-chatdrawer--collapsed', props.className)}
		style={props.style}
		flexDirection="column"
	>
		{canCollapse ? (
			<flexboxlayout
				className="vx-chatdrawer-toggle"
				flexDirection="row"
				alignItems="center"
				justifyContent="center"
				accessibilityRole={nativeAccessibilityRole('button') as any}
				accessibilityLabel={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
				accessibilityState={{ expanded: !isCollapsed } as any}
				onTap={toggle}
			>
				{isCollapsed ? (
					<flexboxlayout className="vx-chatdrawer-summary" flexDirection="row" alignItems="center">
						{props.collapsedSummary === undefined ? (
							<>
								<Badge className="vx-chatdrawer-badge"><label text={`${props.count}`} /></Badge>
								<label className="vx-chatdrawer-label" text={label} />
							</>
						) : (
							props.collapsedSummary
						)}
					</flexboxlayout>
				) : (
					<flexboxlayout className="vx-chatdrawer-handle" />
				)}
			</flexboxlayout>
		) : null}
		{!(canCollapse && isCollapsed) ? (
			<flexboxlayout className="vx-chatdrawer-inner" flexDirection="row" flexWrap="wrap">
				{props.children}
			</flexboxlayout>
		) : null}
	</flexboxlayout>
}
