/** @jsxImportSource @nativescript-community/octane */
import type { NavigationMenuProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.tsrx';

/** NavigationMenu — row (or column) of nav items. Mostly a desktop/web
 *  idiom; the mobile equivalent is Tabs/Drawer. */
export function NavigationMenu(props: NavigationMenuProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection={props.horizontal === false ? 'column' : 'row'}
		className={cx('vx-navmenu', props.horizontal === false ? 'vx-navmenu--col' : 'vx-navmenu--row', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		@for (const item of props.items; key item.key) {
			<flexboxlayout
				className={cx('vx-navmenu-item', item.active && 'vx-navmenu-item--on', item.disabled && 'vx-navmenu-item--disabled')}
				onTap={item.disabled ? undefined : item.onSelect}
			>
				{item.icon ? <Icon name={item.icon} /> : null}
				{item.label != null ? <label className="vx-navmenu-label" text={item.label} /> : null}
			</flexboxlayout>
		}
	</flexboxlayout>
}
