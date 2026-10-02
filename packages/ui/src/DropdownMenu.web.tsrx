import { MenuData } from './MenuParts.web.tsrx';
import { MenuSurface } from './MenuSurface.web.tsrx';
import { useRef, useState } from 'octane';
import type { DropdownMenuProps } from "./props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { useButtonGroup } from './button-group-context';

/** Self-drawn dropdown menu — `trigger` plus an anchored item list via
 *  Popover. The same anchored listbox renders on every target (decision
 *  #48): bounded, unvirtualized items. */
export function DropdownMenu(props: DropdownMenuProps) @{
	const anchor = useRef<any>(null);
	const initialFocus = useRef<'first' | 'last' | 'container'>('container');
	const group = useButtonGroup();
	const disabled = !!((props.isDisabled ?? props.disabled) || group?.isDisabled);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.isOpen !== undefined || props.open !== undefined;
	const open = props.isOpen ?? props.open ?? internal;

	const setOpen = (next: boolean) => {
		if (disabled && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};


	<>
		<Pressable
			ref={(e: any) => { anchor.current = e; }}
			id={props.id}
			className={['vx-menu-trigger', props.triggerClassName, group && `vx-button--group-${group.position}`, group?.size && `vx-button--size-${group.size}`, props.className]}
			style={props.style}
			disabled={disabled}
			accessibilityLabel={props.accessibilityLabel}
			onPress={() => setOpen(!open)}
			accessibilityState={{ disabled }}
			web={{ onpointerdown: () => { initialFocus.current = 'container' }, 'aria-haspopup': 'menu', 'aria-expanded': String(open), onkeydown: (event: any) => { if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return; if (event.key === 'Enter' || event.key === ' ') initialFocus.current = 'first'; if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? 'last' : 'first'; setOpen(true); } } }}
		>
			{props.trigger}
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={['vx-menu', props.menuClassName]}
		>
			<MenuSurface initialFocus={initialFocus.current} closeMenu={() => setOpen(false)} label={props.accessibilityLabel}>
				<MenuData items={props.items} />{props.children}
			</MenuSurface>
		</Popover>
	</>
}
