/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle , styleRecord} from './style-merge'
import { appKitHost } from './host-bridge'
import { createPortal } from './native-portal'
import { useMemo } from 'octane';
import type { CommandPaletteItem, CommandPaletteProps } from './props';
import { createCommandPaletteController } from './command-palette-state';
import { useStore } from './use-store.tsrx';
import { groupTypeaheadItems } from './typeahead-source';
import { cx } from '@octane-xplat/lib';
import { useEffect, useLayoutEffect, useRef, useState } from 'octane';
import { Pressable } from './Pressable.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { scrollCommandPaletteHighlight } from './command-palette-scroll.macos';
import { bindCommandPaletteKeys } from './command-palette-keys.macos';

/** Content owns field adapters; the declaring root owns dismissal and focus return. */
function PaletteBody<T extends CommandPaletteItem>(props: { options: CommandPaletteProps<T>; controller: ReturnType<typeof createCommandPaletteController<T>>; depth: number }) @{
	const options = props.options;
	const controller = props.controller;
	const state = useStore(controller.store);
	const input = useRef<any>(null);
	const rows = useRef(new Map<string, any>());
	const groups = useMemo(() => groupTypeaheadItems(state.results), [state.results]);
	useEffect(() => {
		if (!state.open) return;
		// The separate root renders before AppKit attaches it to its sheet.
		let unbind: (() => void) | undefined;
		const timer = setTimeout(() => {
			if (!input.current?.window) return;
			unbind = bindCommandPaletteKeys(input.current, (event) => {
				controller.keyDown(event);
				if (['ArrowDown', 'ArrowUp', 'PageUp', 'PageDown'].includes(event.key)) {
					scrollCommandPaletteHighlight(rows.current.get(controller.store.getSnapshot().highlighted ?? ''));
				}
			}, true, controller.search);
		}, 0);

		return () => { clearTimeout(timer); unbind?.(); };
	}, [state.open]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const id = state.highlighted ?? state.results[0]?.id;
			scrollCommandPaletteHighlight(rows.current.get(id ?? ''));
		}, 0);

		return () => clearTimeout(timer);
	}, [state.results]);

	<LayerDepthProvider value={props.depth}>
	<masonview className={cx('vx-commandpalette', props.options.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, { ...(options.width != null ? { width: options.width } : {}), ...styleRecord(options.style) }))} id={props.options.id} accessibilityLabel={props.options.label ?? 'Command palette'}>
		<masonview className="vx-cmdk-input-row" style={mergeStyle({flexDirection: "row"}, {display: "flex"})}>
			<textfield ref={(view: any) => { input.current = view; }} id={`${options.id ?? 'command-palette'}-query`} className="vx-cmdk-search" accessibilityLabel={options.label ?? 'Command palette'} placeholder={options.placeholder ?? 'Search commands…'} value={state.query} onTextChange={controller.search} />
			<Pressable id={`${props.options.id ?? 'command-palette'}-clear`} onPress={() => props.controller.search('')} accessibilityLabel="Clear search"><label text="Clear" /></Pressable>
			<Pressable id={`${props.options.id ?? 'command-palette'}-cancel`} onPress={props.controller.close} accessibilityLabel="Cancel"><label text="Cancel" /></Pressable>
		</masonview>
		<label id={`${props.options.id ?? 'command-palette'}-status`} className="vx-cmdk-status" text={state.status === 'loading' ? props.options.loadingText ?? 'Loading…' : state.status === 'error' ? props.options.errorText ?? 'Could not load commands. Try again.' : state.status === 'ready' && !state.results.length ? state.query.trim() ? props.options.emptySearchText ?? 'No results' : props.options.emptyBootstrapText ?? 'Type to search' : ''} />
		{state.status === 'error' ? <Pressable onPress={() => props.controller.search(state.query)} accessibilityLabel="Retry"><label text="Retry" /></Pressable> : null}
		<scrollview className="vx-cmdk-list" style={{ height: options.maxHeight ?? 320 }}>
			<masonview className="vx-menu-list" style={mergeStyle({flexDirection: "column"}, {display: "flex"})}>
				@for (const group of groups; index gi; key group.heading ?? gi) {
					<masonview accessibilityLabel={group.heading ?? undefined} style={mergeStyle({flexDirection: "column"}, {display: "flex"})}>
						{group.heading != null ? <label className="vx-cmdk-heading" text={group.heading} /> : null}
						@for (const item of group.items; key item.id) {
							<Pressable ref={(view: any) => { if (view) rows.current.set(item.id, view); else rows.current.delete(item.id); }} id={`${props.options.id ?? 'command-palette'}-item-${item.id}`} className={cx('vx-menu-item', item.disabled && 'vx-menu-item--disabled', item.id === state.highlighted && 'vx-cmdk-highlighted')} disabled={item.disabled} accessibilityLabel={item.label} accessibilityState={{ disabled: item.disabled, selected: item.id === state.selected }} onPress={() => props.controller.select(item.id)}>
								{props.options.renderItem ? props.options.renderItem(item, item.id === state.selected) : <>
									{item.icon ? <Icon name={item.icon} /> : null}
									<masonview className="vx-cmdk-item-content" style={mergeStyle({flexDirection: "column"}, {display: "flex"})}><label className="vx-menu-item-label" text={item.label} />{item.description ? <label className="vx-cmdk-description" text={item.description} /> : null}</masonview>
									{item.shortcut ? <label className="vx-cmdk-shortcut" text={item.shortcut} /> : null}
								</>}
							</Pressable>
						}
					</masonview>
				}
			</masonview>
		</scrollview>
		{props.options.footer != null && props.options.footer !== false ? <masonview className="vx-cmdk-footer" style={{display: "flex"}}>{props.options.footer}</masonview> : null}
	</masonview>
	</LayerDepthProvider>
}

function PalettePortal(props: { target: unknown; options: any; controller: any; depth: number; present(): void }) {
	useLayoutEffect(() => { props.present() }, [props.target])
	return createPortal(<PaletteBody options={props.options} controller={props.controller} depth={props.depth} />, props.target)
}

/** AppKit window-modal sheet whose content belongs to the declaring tree. */
export function CommandPalette<T extends CommandPaletteItem>(options: CommandPaletteProps<T>) @{
	const controller = useMemo(() => createCommandPaletteController(() => options), []);
	useEffect(() => controller.configure(options), [options.open, options.searchSource, options.items, options.searchMode, options.value, options.onOpenChange, options.onValueChange]);
	useEffect(() => () => controller.dispose(), []);
	// Results belong to the portal body; only visibility updates this owner.
	const open = useStore(controller.store, (state) => state.open);
	const anchor = useRef<any>(null);
	const sheet = useRef<any>(null);
	const [target, setTarget] = useState<any>(null);
	const dismissal = useLayerDismissal({ get active() { return open; }, isPresent: () => !!sheet.current, dismiss: controller.close });
	useEffect(() => {
		if (!open) return;
		const width = options.width ?? styleRecord(options.style).width;
		const presented = appKitHost()?.presentSheet?.(anchor.current, {
			minWidth: typeof width === 'number' ? width : 480,
			onDismissed: controller.close,
		});
		if (!presented) {
			console.warn('[octane-xplat] CommandPalette requires an AppKit sheet presenter.');
			controller.close();
			return;
		}
		sheet.current = presented;
		setTarget(presented.target);
		return () => {
			presented.close();
			if (sheet.current === presented) sheet.current = null;
			setTarget(null);
		};
	}, [open]);

	<>
		<masonview ref={anchor} style={{ display: 'flex', width: 0, height: 0 }} />
		{target ? <PalettePortal target={target} options={options} controller={controller} depth={dismissal.depth} present={() => sheet.current?.present()} /> : null}
	</>
}
