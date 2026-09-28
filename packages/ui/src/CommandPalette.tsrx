/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { CommandPaletteProps, MenuItem } from "./props";
import { cx } from "./cx";
import { Overlay } from './Overlay.tsrx';
import { TextInput } from './TextInput.tsrx';
import { Icon } from './Icon.tsrx';

/** CommandPalette — in-window overlay: search field + filtered action
 *  list. Shade dismisses; Enter selects the first match. */
export function CommandPalette(props: CommandPaletteProps) @{
	const [query, setQuery] = useState('');

	const setOpen = (next: boolean) => {
		if (!next) setQuery('');
		props.onOpenChange?.(next);
	};

	const shown = query
		? props.items.filter((i) => (i.label ?? i.key).toLowerCase().includes(query.toLowerCase()))
		: props.items;

	const select = (item: MenuItem) => {
		if (item.disabled) return;
		setOpen(false);
		item.onSelect?.();
	};

	<Overlay open={props.open} shadeCover={true} onDismiss={() => setOpen(false)} className="vx-cmdk-layer">
		<flexboxlayout
			className={cx('vx-commandpalette', props.className)}
			style={props.style}
			id={props.id}
			horizontalAlignment="center"
			verticalAlignment="top"
			marginTop={80}
		>
			<TextInput
				className="vx-cmdk-search"
				placeholder={props.placeholder ?? 'Type a command…'}
				value={query}
				onChange={setQuery}
				onSubmit={() => { if (shown.length && !shown[0].disabled) select(shown[0]); }}
			/>
			<flexboxlayout className="vx-menu-list vx-cmdk-list">
				@for (const item of shown; key item.key) {
					<flexboxlayout
						className={cx('vx-menu-item', item.disabled && 'vx-menu-item--disabled')}
						onTap={item.disabled ? undefined : () => select(item)}
					>
						{item.icon ? <Icon name={item.icon} /> : null}
						{item.label != null ? <label className="vx-menu-item-label" text={item.label} /> : null}
					</flexboxlayout>
				}
			</flexboxlayout>
		</flexboxlayout>
	</Overlay>
}
