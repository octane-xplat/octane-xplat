import { useEffect, useRef, useState } from 'octane';
import type { ContextMenuProps, MenuItem } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Popover } from './Popover.web.tsrx';
import { Icon } from './Icon.web.tsrx';

/** Self-drawn context menu — right-click (or long-press on touch) opens the
 *  same anchored list as DropdownMenu, positioned over the children. */
export function ContextMenu(props: ContextMenuProps) @{
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

	<div
		ref={(e: any) => { anchor.current = e; if (e) applyEscapeProps(e, props); }}
		id={props.id}
		className={['vx-contextmenu', props.className]}
		style={props.style}
		onContextMenu={(e: any) => {
			if (props.disabled) return;
			e.preventDefault();
			setOpen(true);
		}}
	>
		{props.children}
		<Popover
			anchor={anchor}
			open={open}
			placement="bottom"
			onDismiss={() => setOpen(false)}
			className="vx-menu"
		>
			<div role="menu" className="vx-menu-list">
				{props.items.map((item: MenuItem) => (
					<div
						key={item.key}
						role="menuitem"
						aria-disabled={item.disabled || undefined}
						className={['vx-menu-item', item.disabled ? 'vx-menu-item--disabled' : undefined]}
						onClick={item.disabled ? undefined : () => select(item)}
					>
						{item.icon ? <Icon name={item.icon} /> : null}
						{item.label != null ? <span className="vx-menu-item-label">{item.label}</span> : null}
					</div>
				))}
			</div>
		</Popover>
	</div>
}
