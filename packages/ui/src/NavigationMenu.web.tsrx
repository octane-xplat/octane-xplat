import type { NavigationMenuProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** NavigationMenu — row (or column) of nav items. Mostly a desktop/web
 *  idiom; the mobile equivalent is Tabs/Drawer. */
export function NavigationMenu(props: NavigationMenuProps) @{
	<nav
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-navmenu', props.horizontal === false ? 'vx-navmenu--col' : 'vx-navmenu--row', props.className]}
		style={props.style}
		aria-label={props.accessibilityLabel}
	>
		{props.items.map((item: any) => (
			<span
				key={item.key}
				role="link"
				aria-current={item.active ? 'page' : undefined}
				aria-disabled={item.disabled || undefined}
				tabIndex={item.disabled ? undefined : 0}
				className={['vx-navmenu-item', item.active ? 'vx-navmenu-item--on' : undefined, item.disabled ? 'vx-navmenu-item--disabled' : undefined]}
				onClick={item.disabled ? undefined : item.onSelect}
				onKeyDown={(e: any) => { if (!item.disabled && e.key === 'Enter') item.onSelect?.(); }}
			>
				{item.icon ? <Icon name={item.icon} /> : null}
				{item.label != null ? <span className="vx-navmenu-label">{item.label}</span> : null}
			</span>
		))}
	</nav>
}
