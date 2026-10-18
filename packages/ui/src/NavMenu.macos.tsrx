/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useMemo } from 'octane';
import type { NavHeadingMenuProps, NavHeadingMenuItemProps } from './props';
import { cx } from '@octane-xplat/lib';

import { Icon } from './Icon.macos.tsrx';
import { Text } from './Text.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { followHref } from './nav-href';
import { NavHeadingCloseContext, NavHeadingMenuContext, useNavHeadingCloseContext, useNavHeadingMenuContext,
	NavHeadingMenuProvider,
} from './nav-contexts';

export { NavHeadingMenuContext, useNavHeadingMenuContext, NavHeadingCloseContext, useNavHeadingCloseContext };

const MIN_WIDTHS: Record<string, number> = { sm: 168, md: 200, lg: 240 };

/** NavHeadingMenu — menu-of-links column shown from a heading popover.
 *  Native leaf: a plain item column — arrow/typeahead keyboard navigation
 *  is a pointer-platform behavior; item activation fires `onClick` +
 *  closes the parent menu. */
export function NavHeadingMenu(props: NavHeadingMenuProps) @{
	const closeCtx = useContext(NavHeadingCloseContext);
	const closeMenu = closeCtx?.closeMenu;
	const size = props.size ?? 'md';

	const ctx = useMemo(
		() => ({ closeMenu: closeMenu ?? (() => {}), size }),
		[closeMenu, size],
	);

	const minWidth = props.minWidth != null ? (typeof props.minWidth === 'number' ? props.minWidth : undefined) : MIN_WIDTHS[size];

	<NavHeadingMenuProvider value={ctx}>
		<masonview display="flex" id={props.id} flexDirection="column" className={cx('vx-navmenu', 'vx-navmenu--' + size, props.className)} style={{ ...(props.style as any), minWidth }}>
			{props.children}
		</masonview>
	</NavHeadingMenuProvider>
}

/** NavHeadingMenuItem — one row in a NavHeadingMenu: icon + label +
 *  optional description; `href` activates through the route table. */
export function NavHeadingMenuItem(props: NavHeadingMenuItemProps) @{
	const ctx = useContext(NavHeadingMenuContext);
	const closeCtx = useContext(NavHeadingCloseContext);
	const isDisabled = props.isDisabled ?? false;

	const activate = () => {
		if (isDisabled) return;
		props.onClick?.();
		if (props.href) followHref(props.href);
		(ctx?.closeMenu ?? closeCtx?.closeMenu)?.();
	};

	<Pressable

		id={props.id}
		className={cx('vx-navmenu-item', 'vx-navmenu-item--' + (ctx?.size ?? 'md'), isDisabled && 'vx-navmenu-item--disabled', props.className)}
		style={props.style}
		disabled={isDisabled}
		accessibilityRole="link"
		accessibilityState={{ disabled: isDisabled }}
		onPress={activate}
	>
		<masonview display="flex" flexDirection="row" alignItems="center" gap={8} flexGrow={1}>
			{props.icon != null ? (
				typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon
			) : null}
			<masonview display="flex" flexDirection="column" flexGrow={1}>
				{typeof props.label === 'string' ? <Text className="vx-navmenu-item-label">{props.label}</Text> : props.label}
				{props.description != null ? (
					typeof props.description === 'string' ? <Text className="vx-navmenu-item-desc">{props.description}</Text> : props.description
				) : null}
			</masonview>
		</masonview>
	</Pressable>
}
