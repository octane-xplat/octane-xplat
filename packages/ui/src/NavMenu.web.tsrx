import { useCallback, useContext, useMemo, useRef } from 'octane';
import type { NavHeadingMenuProps, NavHeadingMenuItemProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';
import { Text } from './Text.web.tsrx';
import { NavHeadingCloseContext, NavHeadingMenuContext, NavHeadingMenuProvider, useNavHeadingCloseContext, useNavHeadingMenuContext } from './nav-contexts';
import { useListFocus } from './list-focus.web.tsrx';
import { followHref } from './nav-href.web';

export { NavHeadingMenuContext, useNavHeadingMenuContext, NavHeadingCloseContext, useNavHeadingCloseContext };

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

/** NavHeadingMenu — menu-of-links column shown from a heading popover.
 *  role=menu + roving tabindex + arrow/Home/End + first-character
 *  typeahead + Enter/Space activation for non-anchor items; Escape closes
 *  the heading's popover via NavHeadingCloseContext. */
export function NavHeadingMenu(props: NavHeadingMenuProps) @{
	const closeCtx = useContext(NavHeadingCloseContext);
	const closeMenu = closeCtx?.closeMenu;
	const size = props.size ?? 'md';

	const { listRef, handleKeyDown, handleFocus, focusItem } = useListFocus<HTMLDivElement>({
		itemSelector: ITEM_SELECTOR,
		orientation: 'vertical',
		hasRovingTabIndex: true,
		onEscape: closeMenu,
	});

	// First-character typeahead over enabled items.
	const typeBuffer = useRef({ text: '', at: 0 });
	const getItems = useCallback((): HTMLElement[] => {
		const root = listRef.current;
		return root ? Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
	}, []);

	const listKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				const focused = document.activeElement as HTMLElement | null;
				if (focused?.getAttribute('role') === 'menuitem') {
					e.preventDefault();
					focused.click();
					return;
				}
			}

			// typeahead — printable single chars jump to the next matching label
			if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const now = Date.now();
				if (now - typeBuffer.current.at > 500) typeBuffer.current.text = '';
				typeBuffer.current.at = now;
				typeBuffer.current.text += e.key.toLowerCase();
				const items = getItems();
				const labels = items.map((el) => (el.textContent ?? '').trim().toLowerCase());
				const current = items.findIndex((el) => el === document.activeElement || el.contains(document.activeElement));
				for (let i = 1; i <= items.length; i++) {
					const idx = (current + i) % items.length;
					if (labels[idx]?.startsWith(typeBuffer.current.text)) {
						focusItem(items[idx]);
						e.preventDefault();
						return;
					}
				}
			}

			handleKeyDown(e);
		},
		[handleKeyDown, getItems, focusItem],
	);

	const ctx = useMemo(
		() => ({ closeMenu: closeMenu ?? (() => {}), size }),
		[closeMenu, size],
	);

	const inlineStyle = props.minWidth != null ? { ...props.style, minWidth: props.minWidth } : props.style;

	<NavHeadingMenuProvider value={ctx}>
		<div
			ref={(el: HTMLDivElement | null) => { listRef.current = el; if (el) applyEscapeProps(el, props); }}
			id={props.id}
			className={['vx-navmenu', 'vx-navmenu--' + size, props.className]}
			style={inlineStyle}
			role="menu"
			onKeyDown={listKeyDown}
			onFocus={handleFocus}
		>
			{props.children}
		</div>
	</NavHeadingMenuProvider>
}

/** NavHeadingMenuItem — one row in a NavHeadingMenu: icon + label +
 *  optional description; a link when `href` is set, else a menuitem div
 *  whose activation fires `onClick` and closes the parent menu. */
export function NavHeadingMenuItem(props: NavHeadingMenuItemProps) @{
	const ctx = useContext(NavHeadingMenuContext);
	const closeCtx = useContext(NavHeadingCloseContext);
	const isDisabled = props.isDisabled ?? false;

	const handleClick = (e: any) => {
		if (isDisabled) {
			e?.preventDefault?.();
			return;
		}

		props.onClick?.();
		(ctx?.closeMenu ?? closeCtx?.closeMenu)?.();
	};

	const cls = ['vx-navmenu-item', 'vx-navmenu-item--' + (ctx?.size ?? 'md'), isDisabled && 'vx-navmenu-item--disabled', props.className];

	const content = (
		<>
			{props.icon != null ? (
				<span className="vx-navmenu-item-icon" aria-hidden="true">
					{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
				</span>
			) : null}
			<span className="vx-navmenu-item-content">
				{typeof props.label === 'string' ? <Text className="vx-navmenu-item-label">{props.label}</Text> : props.label}
				{props.description != null ? (
					typeof props.description === 'string' ? <Text className="vx-navmenu-item-desc">{props.description}</Text> : props.description
				) : null}
			</span>
		</>
	);

	@if (props.href != null && !isDisabled) {
		<a
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			className={cls}
			style={props.style}
			role="menuitem"
			tabIndex={-1}
			href={props.href}
			onClick={handleClick}
		>
			{content}
		</a>
	} @else {
		<div
			ref={(el: any) => applyEscapeProps(el, props)}
			id={props.id}
			className={cls}
			style={props.style}
			role="menuitem"
			tabIndex={isDisabled ? undefined : -1}
			aria-disabled={isDisabled || undefined}
			onClick={handleClick}
		>
			{content}
		</div>
	}
}
