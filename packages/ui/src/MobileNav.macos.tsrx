/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useId, useCallback } from 'octane';
import type { MobileNavProps, MobileNavToggleProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon.macos.tsrx';
import { Text } from './Text.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { AppShellMobileContext, useAppShellMobile } from './nav-contexts';

export { AppShellMobileContext, useAppShellMobile };

/** MobileNav — the navigation drawer. Inside AppShell its open state comes
 *  from context; standalone it takes `isOpen`/`onOpenChange`.
 *
 *  Native leaf: renders as an overlay covering its parent cell — backdrop +
 *  edge-pinned panel. (On Android, hardware back dismissal is owned by the
 *  router's back interceptor when one is registered; otherwise the backdrop
 *  tap closes.) Slide-in animation is not implemented on this leaf yet —
 *  the drawer appears/dismisses instantly. */
export function MobileNav(props: MobileNavProps) @{
	const appShell = useContext(AppShellMobileContext);
	const fallbackId = useId();
	const id = props.id ?? appShell.mobileNavId ?? fallbackId;

	const isControlled = props.isOpen != null;
	const isOpen = isControlled ? props.isOpen : appShell.isMobileNavOpen;

	const onOpenChange = useCallback(
		(next: boolean) => {
			if (props.onOpenChange) {
				props.onOpenChange(next);
			} else if (next) {
				appShell.openMobileNav();
			} else {
				appShell.closeMobileNav();
			}
		},
		[props.onOpenChange, appShell],
	);

	// `auto` resolves to `start` — the toggle's position can't be read on
	// native, and start is the platform convention (documented deviation).
	const side = props.side === 'auto' || props.side == null ? 'start' : props.side;
	const width = props.width ?? 320;

	@if (!isOpen) {
		null
	} @else {
		<gridlayout
			id={id}
			className={cx('vx-mobilenav', 'vx-mobilenav--' + side, 'vx-mobilenav--open', props.className)}
			style={props.style}
			accessibilityLabel={props.label ?? (typeof props.header === 'string' ? props.header : 'Navigation')}
		>
			<flexboxlayout className="vx-mobilenav-backdrop" onTap={() => onOpenChange(false)} />
			<flexboxlayout
				flexDirection="column"
				className="vx-mobilenav-drawer"
				horizontalAlignment={side === 'start' ? 'left' : 'right'}
				style={{ width }}
			>
				@if (props.header != null) {
					<flexboxlayout className="vx-mobilenav-header" flexDirection="row" alignItems="center">
						{typeof props.header === 'string' ? <Text className="vx-mobilenav-heading">{props.header}</Text> : props.header}
					</flexboxlayout>
				}
				<scrollview className="vx-mobilenav-content" flexGrow={1}>
					<flexboxlayout flexDirection="column">{props.children}</flexboxlayout>
				</scrollview>
			</flexboxlayout>
		</gridlayout>
	}
}

/** MobileNavToggle — the hamburger. Renders nothing unless the AppShell
 *  mobile context says the drawer is enabled and mobile layout is active. */
export function MobileNavToggle(props: MobileNavToggleProps) @{
	const { isMobile, isMobileNavEnabled, toggleMobileNav } = useAppShellMobile();

	@if (!isMobile || !isMobileNavEnabled) {
		null
	} @else {
		<Pressable
			id={props.id}
			className={cx('vx-mobilenav-toggle', props.className)}
			style={props.style}
			accessibilityLabel={props.label ?? 'Open navigation'}
			onPress={toggleMobileNav}
		>
			{props.children ?? <Icon name="xplat-menu" size={20} />}
		</Pressable>
	}
}
