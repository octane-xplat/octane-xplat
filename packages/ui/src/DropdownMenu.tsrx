/** @jsxImportSource @nativescript-community/octane */
import { useRef, useState } from 'octane';
import type { DropdownMenuProps, MenuItem } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.tsrx';
import { Popover } from './Popover.tsrx';
import { Icon } from './Icon.tsrx';
import { useButtonGroup } from './button-group-context';

/** Self-drawn dropdown menu — `trigger` plus an anchored item list via
 *  Popover. The same anchored listbox renders on every target (decision
 *  #48): bounded, unvirtualized items. */
export function DropdownMenu(props: DropdownMenuProps) @{
	const anchor = useRef<any>(null);
	const group = useButtonGroup();
	const disabled = !!(props.disabled || group?.isDisabled);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.open !== undefined;
	const open = controlled ? props.open : internal;

	const setOpen = (next: boolean) => {
		if (disabled && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};

	const select = (item: MenuItem) => {
		if (item.disabled) return;
		setOpen(false);
		item.onSelect?.();
	};

	<>
		<Pressable
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-menu-trigger', props.triggerClassName, group && `vx-button--group-${group.position}`, group?.size && `vx-button--size-${group.size}`, props.className)}
			style={props.style}
			disabled={disabled}
			accessibilityLabel={props.accessibilityLabel}
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
	</>
}
