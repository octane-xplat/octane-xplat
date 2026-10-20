/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts.macos.tsrx';
import { MenuSurface } from './MenuSurface.macos.tsrx';
import { useRef, useState } from 'octane';
import type { DropdownMenuProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { Pressable } from './Pressable.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { useButtonGroup } from './button-group-context';
import { useSize } from './size-context';

/** Self-drawn dropdown menu — `trigger` plus an anchored item list via
 *  Popover. The same anchored listbox renders on every target (decision
 *  #48): bounded, unvirtualized items. */
export function DropdownMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: DropdownMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenu(props: NavigationMenuImplementation<DropdownMenuProps>) @{
	const anchor = useRef<any>(null);
	const group = useButtonGroup();
	const size = useSize(props.size ?? group?.size, 'md');
	const disabled = !!(props.isDisabled || group?.isDisabled);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.isOpen !== undefined;
	const open = props.isOpen ?? internal;

	const setOpen = (next: boolean) => {
		if (disabled && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};

	<>
		<Pressable
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-menu-trigger', props.triggerClassName, group && `vx-button--group-${group.position}`, `vx-button--size-${size}`, props.className)}
			style={props.style}
			disabled={disabled}
			accessibilityLabel={props.accessibilityLabel}
			web={{ 'aria-haspopup': 'menu', 'aria-expanded': open }}
			onPress={() => setOpen(!open)}
		>
			{props.trigger}
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={cx('vx-menu', props.menuClassName)}
		>
			<MenuSurface closeMenu={() => setOpen(false)} label={props.accessibilityLabel}>
				<MenuData items={props.items} />{props.children}
			</MenuSurface>
		</Popover>
	</>
}
