import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts.web.tsrx';
import { MenuSurface } from './MenuSurface.web.tsrx';
import { useId, useRef, useState } from 'octane';
import type { DropdownMenuProps } from "./props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { MenuSheet, useMenuSheet } from './menu-sheet.web.tsrx';
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
	const triggerId = useId();
	const initialFocus = useRef<'first' | 'last' | 'container'>('container');
	const group = useButtonGroup();
	const size = useSize(props.size ?? group?.size, 'md');
	const disabled = !!(props.isDisabled || group?.isDisabled);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.isOpen !== undefined;
	const open = props.isOpen ?? internal;
	const asSheet = useMenuSheet(props.presentation);

	const setOpen = (next: boolean) => {
		if (disabled && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};


	<>
		<Pressable
			ref={(e: any) => { anchor.current = e; }}
			id={props.id ?? triggerId}
			className={['vx-menu-trigger', props.triggerClassName, group && `vx-button--group-${group.position}`, `vx-button--size-${size}`, props.className]}
			style={props.style}
			disabled={disabled}
			accessibilityLabel={props.accessibilityLabel}
			onPress={() => setOpen(!open)}
			accessibilityState={{ disabled }}
			web={{ onpointerdown: () => { initialFocus.current = 'container' }, 'aria-haspopup': 'menu', 'aria-expanded': String(open), onkeydown: (event: any) => { if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return; if (event.key === 'Enter' || event.key === ' ') initialFocus.current = 'first'; if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? 'last' : 'first'; setOpen(true); } } }}
		>
			{props.trigger}
		</Pressable>
		@if (asSheet) {
			<MenuSheet open={open} onOpenChange={setOpen} label={props.label ?? props.accessibilityLabel} items={props.items}>{props.children}</MenuSheet>
		} @else {
			<Popover
				anchor={anchor}
				open={open}
				placement={props.placement ?? 'bottom'}
				alignment={props.alignment}
				onDismiss={() => setOpen(false)}
				className={['vx-menu', props.menuClassName]}
			>
				<MenuSurface initialFocus={initialFocus.current} closeMenu={() => setOpen(false)} label={props.accessibilityLabel ?? props.label} labelledBy={props.id ?? triggerId}>
					<MenuData items={props.items} />{props.children}
				</MenuSurface>
			</Popover>
		}
	</>
}
