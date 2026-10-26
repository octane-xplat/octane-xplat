import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts.web.tsrx';
import { MenuSurface } from './MenuSurface.web.tsrx';
import { useId, useRef, useState } from 'octane';
import type { DropdownMenuProps } from "./props";
import { Button } from './Button.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { MenuSheet, useMenuSheet } from './menu-sheet.web.tsrx';
import { useButtonGroup } from './button-group-context';
import { resolveMenuWidth } from './menu-width';
import type { PopoverInternalProps } from './internal-props';

const MenuPopover = Popover as unknown as (props: PopoverInternalProps) => any;

/** Self-drawn dropdown menu — a shared-`Button` trigger (`button` props,
 *  Astryx `button`) plus an anchored item list via Popover. The same
 *  anchored listbox renders on every target (decision #48): bounded,
 *  unvirtualized items. */
export function DropdownMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: DropdownMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenu(props: NavigationMenuImplementation<DropdownMenuProps>) @{
	const anchor = useRef<any>(null);
	const triggerId = useId();
	const menuId = useId();
	const initialFocus = useRef<'first' | 'last' | 'container'>('container');
	const group = useButtonGroup();
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

	const button = props.button ?? { label: 'Menu' };
	const buttonLabel = typeof button.label === 'string' ? button.label : undefined;
	const iconOnly = button.isIconOnly === true;
	const endContent = button.endContent ?? (props.hasChevron !== false && !iconOnly ? <Icon name="xplat-chevron-down" size={16} /> : undefined);
	const menuWidth = props.menuWidth != null ? resolveMenuWidth(props.menuWidth, 'calc(100vw - 32px)') : null;


	<>
		<Button
			{...button}
			ref={(e: any) => { anchor.current = e; }}
			id={props.id ?? triggerId}
			className={['vx-menu-trigger', button.className]}
			isDisabled={disabled || button.isDisabled}
			endContent={endContent}
			clickAction={() => setOpen(!open)}
			accessibilityState={{ ...button.accessibilityState, expanded: open }}
			web={{
				...button.web,
				'aria-haspopup': 'menu',
				'aria-expanded': String(open),
				'aria-controls': menuId,
				onpointerdown: (event: any) => { (button.web?.onpointerdown as any)?.(event); initialFocus.current = 'container' },
				// APG menu-button: Enter/Space/ArrowDown open with the first item
				// focused, ArrowUp the last. Default is suppressed so the native
				// button's own click activation can't toggle again (keyup below
				// covers Space's keyup-side activation).
				onkeydown: (event: any) => {
					(button.web?.onkeydown as any)?.(event);
					if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
					if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); initialFocus.current = 'first'; setOpen(true); }
					if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? 'last' : 'first'; setOpen(true); }
				},
				onkeyup: (event: any) => { if (event.key === ' ') event.preventDefault(); },
			}}
		/>
		@if (asSheet) {
			<MenuSheet open={open} onOpenChange={setOpen} label={props.label ?? buttonLabel} items={props.items}>{props.children}</MenuSheet>
		} @else {
			<MenuPopover
				anchor={anchor}
				open={open}
				placement={props.placement ?? 'bottom'}
				alignment={props.alignment}
				onDismiss={() => setOpen(false)}
				className={['vx-menu', props.menuClassName]}
				style={menuWidth ? { [menuWidth.property]: menuWidth.value } : undefined}
				anchorMinWidth={menuWidth == null}
			>
				<MenuSurface initialFocus={initialFocus.current} closeMenu={() => setOpen(false)} label={props.label ?? buttonLabel} labelledBy={props.id ?? triggerId} className={props.className} style={props.style} web={{ id: menuId }}>
					<MenuData items={props.items} />{props.children}
				</MenuSurface>
			</MenuPopover>
		}
	</>
}
