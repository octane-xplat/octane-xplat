/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { ChatComposerDrawerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { Badge } from './Badge';
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

	<masonview id={props.id} className={cx('vx-chatdrawer', isCollapsed && 'vx-chatdrawer--collapsed', props.className)} style={mergeStyle({display: "flex"}, props.style as any)} flexDirection="column">
		{canCollapse ? (
			<masonview className="vx-chatdrawer-toggle" flexDirection="row" alignItems="center" justifyContent="center" accessibilityRole={nativeAccessibilityRole('button') as any} accessibilityLabel={isCollapsed ? `Expand ${label}` : `Collapse ${label}`} accessibilityState={{ expanded: !isCollapsed } as any} onTap={toggle} style={{display: "flex"}}>
				{isCollapsed ? (
					<masonview className="vx-chatdrawer-summary" flexDirection="row" alignItems="center" style={{display: "flex"}}>
						{props.collapsedSummary === undefined ? (
							<>
								<Badge className="vx-chatdrawer-badge"><label text={`${props.count}`} /></Badge>
								<label className="vx-chatdrawer-label" text={label} />
							</>
						) : (
							props.collapsedSummary
						)}
					</masonview>
				) : (
					<masonview className="vx-chatdrawer-handle" style={{display: "flex"}}/>
				)}
			</masonview>
		) : null}
		{!(canCollapse && isCollapsed) ? (
			<masonview className="vx-chatdrawer-inner" flexDirection="row" flexWrap="wrap" style={{display: "flex"}}>
				{props.children}
			</masonview>
		) : null}
	</masonview>
}
