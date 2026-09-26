import { useEffect, useState } from 'octane';
import type { CommandPaletteProps, MenuItem } from "./props";
import { Overlay } from './Overlay.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';
import { Icon } from './Icon.web.tsrx';

/** CommandPalette — in-window overlay: search field + filtered action
 *  list. Esc or shade dismisses; Enter selects the first match. */
export function CommandPalette(props: CommandPaletteProps) @{
	const [query, setQuery] = useState('');

	const setOpen = (next: boolean) => {
		if (!next) setQuery('');
		props.onOpenChange?.(next);
	};

	useEffect(() => {
		if (!props.open) return;
		const onKey = (e: any) => { if (e.key === 'Escape') setOpen(false); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [props.open]);

	const shown = query
		? props.items.filter((i) => (i.label ?? i.key).toLowerCase().includes(query.toLowerCase()))
		: props.items;

	const select = (item: MenuItem) => {
		if (item.disabled) return;
		setOpen(false);
		item.onSelect?.();
	};

	<Overlay open={props.open} shadeCover={true} onDismiss={() => setOpen(false)} className="vx-cmdk-layer">
		<div className={['vx-commandpalette', props.className]} style={props.style} id={props.id}>
			<TextInput
				className="vx-cmdk-search"
				placeholder={props.placeholder ?? 'Type a command…'}
				value={query}
				onChange={setQuery}
				onSubmit={() => { if (shown.length && !shown[0].disabled) select(shown[0]); }}
			/>
			<div role="listbox" className="vx-menu-list vx-cmdk-list">
				{shown.map((item: MenuItem) => (
					<div
						key={item.key}
						role="option"
						aria-disabled={item.disabled || undefined}
						className={['vx-menu-item', item.disabled ? 'vx-menu-item--disabled' : undefined]}
						onClick={item.disabled ? undefined : () => select(item)}
					>
						{item.icon ? <Icon name={item.icon} /> : null}
						{item.label != null ? <span className="vx-menu-item-label">{item.label}</span> : null}
					</div>
				))}
			</div>
		</div>
	</Overlay>
}
