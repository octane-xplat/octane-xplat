/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useMemo, useRef } from 'octane';
import type { CommandPaletteItem, CommandPaletteProps } from './props';
import { createCommandPaletteController } from './command-palette-state';
import { useStore } from './use-store.tsrx';
import { groupTypeaheadItems } from './typeahead-source';
import { cx } from './cx';
import { Screen } from '@nativescript/core';
import { BottomSheet } from './BottomSheet.tsrx';
import { TextInput } from './TextInput.tsrx';
import { Pressable } from './Pressable.tsrx';
import { announceCommandPalette } from './command-palette-accessibility.mobile';
import { Icon } from './Icon';

function PaletteBody<T extends CommandPaletteItem>(props: { options: CommandPaletteProps<T>; controller: ReturnType<typeof createCommandPaletteController<T>> }) @{
	const state = useStore(props.controller.store);
	const statusView = useRef<any>(null);
	const groups = useMemo(() => groupTypeaheadItems(state.results), [state.results]);

	useEffect(() => {
		if (!state.query.trim()) return;
		const message = state.status === 'loading' ? props.options.loadingText ?? 'Loading…'
			: state.status === 'error' ? props.options.errorText ?? 'Could not load commands. Try again.'
				: !state.results.length ? props.options.emptySearchText ?? 'No results'
					: `${state.results.length} result${state.results.length === 1 ? '' : 's'}`;

		announceCommandPalette(statusView.current, message);
	}, [state.status, state.query, state.results]);

	<flexboxlayout flexDirection="column" className={cx('vx-commandpalette', props.options.className)} style={{ width: props.options.width ?? Screen.mainScreen.widthDIPs * 0.9, ...props.options.style }} id={props.options.id} accessibilityLabel={props.options.label ?? 'Command palette'}>
		<flexboxlayout flexDirection="row" className="vx-cmdk-input-row">
			<TextInput id={`${props.options.id ?? 'command-palette'}-query`} className="vx-cmdk-search" label={props.options.label ?? 'Command palette'} accessibilityLabel={props.options.label ?? 'Command palette'} placeholder={props.options.placeholder ?? 'Search commands…'} value={state.query} onChange={props.controller.search} onSubmit={() => props.controller.search(state.query)} returnKeyType="search" hasClear={false} />
			<button id={`${props.options.id ?? 'command-palette'}-clear`} text="Clear" onTap={() => props.controller.search('')} accessibilityLabel="Clear search" />
			<button id={`${props.options.id ?? 'command-palette'}-cancel`} text="Cancel" onTap={props.controller.close} />
		</flexboxlayout>
		<label ref={(view: any) => { statusView.current = view; }} id={`${props.options.id ?? 'command-palette'}-status`} className="vx-cmdk-status" text={state.status === 'loading' ? props.options.loadingText ?? 'Loading…' : state.status === 'error' ? props.options.errorText ?? 'Could not load commands. Try again.' : state.status === 'ready' && !state.results.length ? state.query.trim() ? props.options.emptySearchText ?? 'No results' : props.options.emptyBootstrapText ?? 'Type to search' : ''} />
		{state.status === 'error' ? <button text="Retry" onTap={() => props.controller.search(state.query)} /> : null}
		<scrollview className="vx-cmdk-list" height={props.options.maxHeight ?? Screen.mainScreen.heightDIPs * 0.3}>
			<stacklayout className="vx-menu-list">
				@for (const group of groups; index gi; key group.heading ?? gi) {
					<stacklayout accessibilityLabel={group.heading ?? undefined}>
						{group.heading != null ? <label className="vx-cmdk-heading" text={group.heading} /> : null}
						@for (const item of group.items; key item.id) {
							<Pressable id={`${props.options.id ?? 'command-palette'}-item-${item.id}`} className={cx('vx-menu-item', item.disabled && 'vx-menu-item--disabled', item.id === state.highlighted && 'vx-cmdk-highlighted')} disabled={item.disabled} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ disabled: item.disabled, selected: item.id === state.selected }} onPress={() => props.controller.select(item.id)}>
								{props.options.renderItem ? props.options.renderItem(item, item.id === state.selected) : <>
									{item.icon ? <Icon name={item.icon} /> : null}
									<stacklayout className="vx-cmdk-item-content"><label className="vx-menu-item-label" text={item.label} />{item.description ? <label className="vx-cmdk-description" text={item.description} /> : null}</stacklayout>
									{item.shortcut ? <label className="vx-cmdk-shortcut" text={item.shortcut} /> : null}
								</>}
							</Pressable>
						}
					</stacklayout>
				}
			</stacklayout>
		</scrollview>
		{props.options.footer != null && props.options.footer !== false ? <flexboxlayout className="vx-cmdk-footer">{props.options.footer}</flexboxlayout> : null}
	</flexboxlayout>
}

/** Touch-first search sheet. Search submits the query; explicit taps activate rows. */
export function CommandPalette<T extends CommandPaletteItem>(props: CommandPaletteProps<T>) @{
	const controller = useMemo(() => createCommandPaletteController(() => props), []);
	useEffect(() => controller.configure(props), [props.open, props.searchSource, props.items, props.searchMode, props.value, props.onOpenChange, props.onValueChange]);
	useEffect(() => () => controller.dispose(), []);
	const state = useStore(controller.store);

	<BottomSheet isOpen={state.open} onOpenChange={(open: boolean) => { if (!open) controller.close(); }} label={props.label ?? 'Command palette'} height="hug" ios={props.ios} android={props.android}>
		<PaletteBody options={props} controller={controller} />
	</BottomSheet>
}
