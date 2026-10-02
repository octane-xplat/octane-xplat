/** @jsxImportSource @nativescript-community/octane */
import { MenuData } from './MenuParts';
import { MenuSurface } from './MenuSurface';
import { useRef, useState } from 'octane';
import type { ContextMenuProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable';
import { Popover } from './Popover';

/** Self-drawn context menu — long-press opens the same anchored list as
 *  DropdownMenu, positioned over the children. There is no right-click on
 *  touch targets; long-press is the honest equivalent gesture. */
export function ContextMenu(props: ContextMenuProps) @{
	const anchor = useRef<any>(null);
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const controlled = props.isOpen !== undefined || props.open !== undefined;
	const open = props.isOpen ?? props.open ?? internal;

	const setOpen = (next: boolean) => {
		if ((props.isDisabled ?? props.disabled) && next) return;
		if (!controlled) setInternal(next);
		props.onOpenChange?.(next);
	};

	<flexboxlayout
		ref={(v: any) => { anchor.current = v; if (v) applyEscapeProps(v, props); }}
		id={props.id}
		className={cx('vx-contextmenu', props.className)}
		style={props.style}
		onLongPress={(props.isDisabled ?? props.disabled) ? undefined : () => setOpen(true)}
	>
		{props.children}
		{props.trigger && <Pressable accessibilityLabel={props.accessibilityLabel ?? 'Open actions'} disabled={props.isDisabled ?? props.disabled} onPress={() => setOpen(!open)}>{props.trigger}</Pressable>}
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={cx('vx-menu', props.menuClassName)}
		>
			<MenuSurface closeMenu={() => setOpen(false)} label={props.accessibilityLabel}>
				<MenuData items={props.items} />{props.menu}
			</MenuSurface>
		</Popover>
	</flexboxlayout>
}
