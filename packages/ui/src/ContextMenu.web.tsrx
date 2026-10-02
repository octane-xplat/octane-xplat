import { MenuData } from './MenuParts.web.tsrx';
import { MenuSurface } from './MenuSurface.web.tsrx';
import { useRef, useState } from 'octane';
import type { ContextMenuProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Pressable } from './Pressable.web.tsrx';
import { Popover } from './Popover.web.tsrx';

/** Self-drawn context menu — right-click (or long-press on touch) opens the
 *  same anchored list as DropdownMenu, positioned over the children. */
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


	<div
		ref={(e: any) => { anchor.current = e; if (e) applyEscapeProps(e, props); }}
		id={props.id}
		className={['vx-contextmenu', props.className]}
		style={props.style}
		tabIndex={0}
		aria-haspopup="menu"
		aria-expanded={open}
		onKeyDown={(event: any) => { if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return; if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); setOpen(true); } }}
		onContextMenu={(e: any) => {
			if (props.isDisabled ?? props.disabled) return;
			e.preventDefault();
			setOpen(true);
		}}
	>
		{props.children}
		{props.trigger && <Pressable accessibilityLabel={props.accessibilityLabel ?? 'Open actions'} disabled={props.isDisabled ?? props.disabled} onPress={() => setOpen(!open)}>{props.trigger}</Pressable>}
		<Popover
			anchor={anchor}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={() => setOpen(false)}
			className={['vx-menu', props.menuClassName]}
		>
			<MenuSurface closeMenu={() => setOpen(false)} label={props.accessibilityLabel}>
				<MenuData items={props.items} />{props.menu}
			</MenuSurface>
		</Popover>
	</div>
}
