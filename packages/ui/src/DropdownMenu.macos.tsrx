/** @jsxImportSource @octane-xplat/macos-renderer */
import { MenuData } from './MenuParts.macos.tsrx';
import { MenuSurface } from './MenuSurface.macos.tsrx';
import { useRef, useState } from 'octane';
import type { DropdownMenuProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { useButtonGroup } from './button-group-context';

/** Self-drawn dropdown menu — `trigger` plus an anchored item list via
 *  Popover. The same anchored listbox renders on every target (decision
 *  #48): bounded, unvirtualized items. */
export function DropdownMenu(props: DropdownMenuProps) @{
	const anchor = useRef<any>(null);
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
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-menu-trigger', props.triggerClassName, group && `vx-button--group-${group.position}`, group?.size && `vx-button--size-${group.size}`, props.className)}
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
