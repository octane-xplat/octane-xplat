/** @jsxImportSource @nativescript-community/octane */
import type { NavigationMenuProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon';
import { Text } from './Text';
import { Pressable } from './Pressable';
import { followHref } from './nav-href';

/** NavigationMenu — a simple horizontal (or vertical) strip of nav items.
 *  Native leaf: Pressable rows; item `href` routes through `followHref`. */
export function NavigationMenu(props: NavigationMenuProps) @{
	const isHorizontal = props.horizontal !== false;

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection={isHorizontal ? 'row' : 'column'}
		className={cx('vx-navmenu-strip', !isHorizontal && 'vx-navmenu-strip--vertical', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		@for (const item of props.items; key item.key) {
			<Pressable
				className={cx('vx-navmenu-strip-item', item.active && 'vx-navmenu-strip-item--active')}
				disabled={item.disabled}
				accessibilityRole="link"
				accessibilityState={{ disabled: item.disabled, selected: item.active }}
				onPress={() => {
					if (item.disabled) return;
					item.onSelect?.();
					if (item.href) followHref(item.href);
				}}
			>
				<flexboxlayout flexDirection="row" alignItems="center" gap={6}>
					{item.icon ? <Icon name={item.icon} size={16} /> : null}
					<Text>{item.label}</Text>
				</flexboxlayout>
			</Pressable>
		}
	</flexboxlayout>
}
