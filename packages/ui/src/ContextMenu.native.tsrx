/** @jsxImportSource @nativescript-community/octane */
import { useRef, useState } from 'octane';
import type { ContextMenuProps, MenuItem } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Popover } from './Popover.native.tsrx';
import { Icon } from './Icon.native.tsrx';

/** Self-drawn context menu — long-press opens the same anchored list as
 *  DropdownMenu, positioned over the children. There is no right-click on
 *  touch targets; long-press is the honest equivalent gesture. */
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

	const select = (item: MenuItem) => {
		if (item.disabled) return;
		setOpen(false);
		item.onSelect?.();
	};

	<flexboxlayout
		ref={(v: any) => { anchor.current = v; if (v) applyEscapeProps(v, props); }}
		id={props.id}
		className={cx('vx-contextmenu', props.className)}
		style={props.style}
		onLongPress={props.disabled ? undefined : () => setOpen(true)}
	>
		{props.children}
		<Popover
			anchor={anchor}
			open={open}
			placement="bottom"
			onDismiss={() => setOpen(false)}
			className="vx-menu"
		>
			<flexboxlayout className="vx-menu-list">
				{props.items.map((item: MenuItem) => (
					<flexboxlayout
						key={item.key}
						className={cx('vx-menu-item', item.disabled && 'vx-menu-item--disabled')}
						onTap={item.disabled ? undefined : () => select(item)}
					>
						{item.icon ? <Icon name={item.icon} /> : null}
						{item.label != null ? <label className="vx-menu-item-label" text={item.label} /> : null}
					</flexboxlayout>
				))}
			</flexboxlayout>
		</Popover>
	</flexboxlayout>
}
