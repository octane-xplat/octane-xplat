/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane';
import type { CommandPaletteItem, CommandPaletteProps } from './props';
import { createCommandPaletteController } from './command-palette-state';
import { useStore } from './use-store.tsrx';
import { groupTypeaheadItems } from './typeahead-source';
import { cx } from './cx';
import { useEffect, useRef } from 'octane';
import { Pressable } from './Pressable.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { bindCommandPaletteKeys } from './command-palette-keys.macos';

/** AppKit inline surface; scoped hardware keys and an explicit Cancel action. */
export function CommandPalette<T extends CommandPaletteItem>(options: CommandPaletteProps<T>) @{
	const controller = useMemo(() => createCommandPaletteController(() => options), []);
	useEffect(() => controller.configure(options), [options.open, options.searchSource, options.items, options.searchMode, options.value, options.onOpenChange, options.onValueChange]);
	useEffect(() => () => controller.dispose(), []);
	const state = useStore(controller.store);
	const input = useRef<any>(null);
	const props = { options, controller };
	const groups = useMemo(() => groupTypeaheadItems(state.results), [state.results]);
	useEffect(() => {
		if (!state.open || !input.current) return;
		return bindCommandPaletteKeys(input.current, controller.keyDown, true, controller.search);
	}, [state.open]);

	@if (state.open) {
	<flexboxlayout flexDirection="column" className={cx('vx-commandpalette', props.options.className)} style={{ ...(options.width != null ? { width: options.width } : {}), ...options.style }} id={props.options.id} accessibilityLabel={props.options.label ?? 'Command palette'}>
		<flexboxlayout flexDirection="row" className="vx-cmdk-input-row">
			<textfield ref={(view: any) => { input.current = view; }} id={`${options.id ?? 'command-palette'}-query`} className="vx-cmdk-search" accessibilityLabel={options.label ?? 'Command palette'} placeholder={options.placeholder ?? 'Search commands…'} value={state.query} onTextChange={controller.search} />
			<Pressable id={`${props.options.id ?? 'command-palette'}-clear`} onPress={() => props.controller.search('')} accessibilityLabel="Clear search"><label text="Clear" /></Pressable>
			<Pressable id={`${props.options.id ?? 'command-palette'}-cancel`} onPress={props.controller.close} accessibilityLabel="Cancel"><label text="Cancel" /></Pressable>
		</flexboxlayout>
		<label id={`${props.options.id ?? 'command-palette'}-status`} className="vx-cmdk-status" text={state.status === 'loading' ? props.options.loadingText ?? 'Loading…' : state.status === 'error' ? props.options.errorText ?? 'Could not load commands. Try again.' : state.status === 'ready' && !state.results.length ? state.query.trim() ? props.options.emptySearchText ?? 'No results' : props.options.emptyBootstrapText ?? 'Type to search' : ''} />
		{state.status === 'error' ? <Pressable onPress={() => props.controller.search(state.query)} accessibilityLabel="Retry"><label text="Retry" /></Pressable> : null}
		<scrollview className="vx-cmdk-list" style={{ height: options.maxHeight ?? 320 }}>
			<flexboxlayout flexDirection="column" className="vx-menu-list">
				@for (const group of groups; index gi; key group.heading ?? gi) {
					<flexboxlayout flexDirection="column" accessibilityLabel={group.heading ?? undefined}>
						{group.heading != null ? <label className="vx-cmdk-heading" text={group.heading} /> : null}
						@for (const item of group.items; key item.id) {
							<Pressable id={`${props.options.id ?? 'command-palette'}-item-${item.id}`} className={cx('vx-menu-item', item.disabled && 'vx-menu-item--disabled', item.id === state.highlighted && 'vx-cmdk-highlighted')} disabled={item.disabled} accessibilityLabel={item.label} accessibilityState={{ disabled: item.disabled, selected: item.id === state.selected }} onPress={() => props.controller.select(item.id)}>
								{props.options.renderItem ? props.options.renderItem(item, item.id === state.selected) : <>
									{item.icon ? <Icon name={item.icon} /> : null}
									<flexboxlayout flexDirection="column" className="vx-cmdk-item-content"><label className="vx-menu-item-label" text={item.label} />{item.description ? <label className="vx-cmdk-description" text={item.description} /> : null}</flexboxlayout>
									{item.shortcut ? <label className="vx-cmdk-shortcut" text={item.shortcut} /> : null}
								</>}
							</Pressable>
						}
					</flexboxlayout>
				}
			</flexboxlayout>
		</scrollview>
		{props.options.footer != null && props.options.footer !== false ? <flexboxlayout className="vx-cmdk-footer">{props.options.footer}</flexboxlayout> : null}
	</flexboxlayout>
	}
}
