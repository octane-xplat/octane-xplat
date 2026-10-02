import { useEffect, useId, useMemo, useRef } from 'octane';
import type { CommandPaletteItem, CommandPaletteProps } from './props';
import { Overlay } from './Overlay.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { useStore } from './use-store.web.tsrx';
import { createCommandPaletteController } from './command-palette-state';
import { groupTypeaheadItems } from './typeahead-source';

/** Desktop command search: focus remains in the input while arrows highlight results. */
export function CommandPalette<T extends CommandPaletteItem>(props: CommandPaletteProps<T>) @{
	const controller = useMemo(() => createCommandPaletteController(() => props), []);
	useEffect(() => controller.configure(props), [props.open, props.searchSource, props.items, props.searchMode, props.value, props.onOpenChange, props.onValueChange]);
	useEffect(() => () => controller.dispose(), []);
	const state = useStore(controller.store);
	const generatedId = useId();
	const listId = `${generatedId}-commands`;
	const input = useRef<HTMLInputElement | null>(null);
	const groups = useMemo(() => groupTypeaheadItems(state.results), [state.results]);
	const optionId = (id: string) => `${props.id ?? listId}-item-${id}`;
	const keyDown = (event: any) => {
		controller.keyDown(event);
		if (event.defaultPrevented && ['ArrowDown', 'ArrowUp', 'PageUp', 'PageDown'].includes(event.key)) {
			const highlighted = controller.store.get().highlighted;
			if (highlighted) document.getElementById(optionId(highlighted))?.scrollIntoView?.({ block: 'nearest' });
		}
	};

	<Overlay accessibilityLabel={props.label ?? 'Command palette'} open={state.open} shadeCover={true} onDismiss={controller.close} className="vx-cmdk-layer">
		<div
			className={['vx-commandpalette', props.className]}
			style={{ ...(props.width != null ? { width: props.width } : {}), ...props.style }}
			id={props.id}
			role="group"
			aria-label={props.label ?? 'Command palette'}
			{...props.web}
		>
			<div className="vx-cmdk-input-row">
				<input
					ref={input}
					id={`${props.id ?? generatedId}-query`}
					className="vx-input vx-cmdk-search"
					type="text"
					role="combobox"
					aria-label={props.label ?? 'Command palette'}
					aria-expanded={state.open}
					aria-controls={listId}
					aria-activedescendant={state.highlighted ? optionId(state.highlighted) : undefined}
					aria-autocomplete="list"
					aria-busy={state.status === 'loading' || undefined}
					placeholder={props.placeholder ?? 'Type a command…'}
					value={state.query}
					onInput={(event: any) => controller.search(event.target.value)}
					onKeyDown={keyDown}
					autoComplete="off"
				/>
				<button type="button" className="vx-input-clear" aria-label="Clear search" disabled={!state.query} onClick={() => { controller.search(''); input.current?.focus(); }}>×</button>
				<button type="button" className="vx-cmdk-cancel" onClick={controller.close}>Cancel</button>
			</div>
			<div id={`${props.id ?? generatedId}-status`} className="vx-cmdk-status" role="status" aria-live="polite">
				{state.status === 'loading' ? props.loadingText ?? 'Loading…'
					: state.status === 'error' ? props.errorText ?? 'Could not load commands. Try again.'
						: state.status === 'ready' && !state.results.length ? state.query.trim() ? props.emptySearchText ?? 'No results' : props.emptyBootstrapText ?? 'Type to search'
							: state.query.trim() ? `${state.results.length} result${state.results.length === 1 ? '' : 's'}` : ''}
			</div>
			{state.status === 'error' ? <button type="button" onClick={() => controller.search(state.query)}>Retry</button> : null}
			<div id={listId} role="listbox" aria-label="Commands" className="vx-menu-list vx-cmdk-list" style={{ maxHeight: props.maxHeight ?? 320 }}>
				{groups.map((group, gi) => (
					<div key={group.heading ?? gi} role={group.heading != null ? 'group' : undefined} aria-label={group.heading ?? undefined}>
						{group.heading != null ? <div className="vx-cmdk-heading" aria-hidden="true">{group.heading}</div> : null}
						{group.items.map((item) => (
							<div
								key={item.id}
								id={optionId(item.id)}
								role="option"
								aria-selected={item.id === state.selected}
								aria-disabled={item.disabled || undefined}
								className={['vx-menu-item', item.disabled ? 'vx-menu-item--disabled' : undefined, item.id === state.highlighted ? 'vx-cmdk-highlighted' : undefined]}
								onMouseDown={(event: any) => event.preventDefault()}
								onMouseEnter={() => { if (!item.disabled) controller.highlight(item.id); }}
								onClick={() => controller.select(item.id)}
							>
								{props.renderItem ? props.renderItem(item, item.id === state.selected) : <>
									{item.icon ? <Icon name={item.icon} /> : null}
									<div className="vx-cmdk-item-content"><span className="vx-menu-item-label">{item.label}</span>{item.description ? <span className="vx-cmdk-description">{item.description}</span> : null}</div>
									{item.shortcut ? <kbd className="vx-cmdk-shortcut">{item.shortcut}</kbd> : null}
								</>}
							</div>
						))}
					</div>
				))}
			</div>
			{props.footer !== false ? <div className="vx-cmdk-footer">{props.footer ?? <><kbd>↑</kbd><kbd>↓</kbd> Navigate <kbd>Enter</kbd> Select <kbd>Esc</kbd> Close</>}</div> : null}
		</div>
	</Overlay>
}
