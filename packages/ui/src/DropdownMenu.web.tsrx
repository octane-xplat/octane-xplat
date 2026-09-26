import { useEffect, useRef, useState } from 'octane';
import type { DropdownMenuProps, MenuItem } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { Icon } from './Icon.web.tsrx';

/** Self-drawn dropdown menu — `trigger` plus an anchored item list via
 *  Popover. The same anchored listbox renders on every target (decision
 *  #48): bounded, unvirtualized items. */
export function DropdownMenu(props: DropdownMenuProps) @{
	const anchor = useRef<any>(null);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.open !== undefined;
	const open = controlled ? props.open : internal;

	const setOpen = (next: boolean) => {
		if (props.disabled && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};

	useEffect(() => {
		if (!open) return;
		const onKey = (e: any) => { if (e.key === 'Escape') setOpen(false); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	const select = (item: MenuItem) => {
		if (item.disabled) return;
		setOpen(false);
		item.onSelect?.();
	};

	<>
		<Pressable
			bind={(e: any) => { anchor.current = e; }}
			id={props.id}
			className={['vx-menu-trigger', props.className]}
			style={props.style}
			disabled={props.disabled}
			onPress={() => setOpen(!open)}
			accessibilityState={{ disabled: props.disabled }}
		>
			{props.trigger}
		</Pressable>
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			onDismiss={() => setOpen(false)}
			className="vx-menu"
		>
			<div role="menu" className="vx-menu-list">
				{props.items.map((item: MenuItem) => (
					<div
						key={item.key}
						role="menuitem"
						aria-disabled={item.disabled || undefined}
						tabIndex={item.disabled ? undefined : 0}
						className={['vx-menu-item', item.disabled ? 'vx-menu-item--disabled' : undefined]}
						onClick={item.disabled ? undefined : () => select(item)}
						onKeyDown={(e: any) => {
							if (!item.disabled && (e.key === ' ' || e.key === 'Enter')) {
								e.preventDefault();
								select(item);
							}
						}}
					>
						{item.icon ? <Icon name={item.icon} /> : null}
						{item.label != null ? <span className="vx-menu-item-label">{item.label}</span> : null}
					</div>
				))}
			</div>
		</Popover>
	</>
}
