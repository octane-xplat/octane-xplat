import type { NavigationMenuProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';
import { useListFocus } from './list-focus.web.tsrx';

/** NavigationMenu — a simple horizontal (or vertical) strip of nav items.
 *  The local items-array component shares the nav-item anatomy with
 *  TopNavItem; items with `href` render as anchors, others as buttons. */
export function NavigationMenu(props: NavigationMenuProps) @{
	const { listRef, handleKeyDown, handleFocus } = useListFocus<HTMLElement>({
		itemSelector: '.vx-navmenu-strip-item',
		orientation: props.horizontal === false ? 'vertical' : 'horizontal',
	});

	const isHorizontal = props.horizontal !== false;

	<nav
		ref={(el: any) => { listRef.current = el; applyEscapeProps(el, props); }}
		id={props.id}
		className={['vx-navmenu-strip', !isHorizontal && 'vx-navmenu-strip--vertical', props.className]}
		style={props.style}
		aria-label={props.accessibilityLabel}
		onKeyDown={handleKeyDown}
		onFocus={handleFocus}
	>
		@for (const item of props.items; key item.key) {
			@if (item.href != null && !item.disabled) {
				<a
					className={['vx-navmenu-strip-item', item.active && 'vx-navmenu-strip-item--active']}
					href={item.href}
					aria-current={item.active ? 'page' : undefined}
					onClick={() => item.onSelect?.()}
				>
					{item.icon ? <Icon name={item.icon} size={16} /> : null}
					{item.label}
				</a>
			} @else {
				<button
					type="button"
					className={['vx-navmenu-strip-item', item.active && 'vx-navmenu-strip-item--active']}
					disabled={item.disabled}
					aria-disabled={item.disabled || undefined}
					aria-current={item.active ? 'page' : undefined}
					onClick={() => { if (!item.disabled) item.onSelect?.(); }}
				>
					{item.icon ? <Icon name={item.icon} size={16} /> : null}
					{item.label}
				</button>
			}
		}
	</nav>
}
