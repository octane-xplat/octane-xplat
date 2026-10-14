/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane'
import type { SelectViewProps } from './select-view'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable'
import { Popover } from './Popover'
import { TextInput } from './TextInput.tsrx'
import { FieldProvider } from './field-context'
import { CheckIndicator, CheckboxIndicator } from './indicators'
import { useIndicator } from './use-indicator'
import { nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'

/** Select presentation — resolved finite-list state in, user intents out.
 *  Internal only; consumers use `Select`. */
export function SelectView(props: SelectViewProps) @{
	const anchor = useRef<any>(null)
	const search = useRef<any>(null)
	const didFocus = useRef(false)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	const busy = Boolean(props.isLoading || props.pending)
	const blocked = Boolean(props.isDisabled || props.isReadOnly)
	useEffect(() => { if (!props.open) didFocus.current = false }, [props.open])

	<>
		<Pressable ref={(view: any) => { anchor.current = view }} id={props.id} className={cx('vx-select-trigger', props.isDisabled && 'vx-select--disabled', props.isReadOnly && 'vx-select--readonly', busy && 'vx-select--loading', props.className)} style={props.style} disabled={props.isDisabled} onPress={() => props.onOpenChange(!props.open)} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled }} accessibilityValue={props.triggerText}>
			<label className={cx('vx-select-value', !props.selected.length && 'vx-select-placeholder')} text={props.triggerText} />
			{props.hasClear && props.selected.length && !blocked ? <Pressable className="vx-select-clear" disabled={props.pending} accessibilityLabel="Clear selection" onPress={props.onClear}><label text="×" /></Pressable> : null}
			{busy ? <label className="vx-select-loading" text="Loading…" accessibilityLiveRegion={'polite' as any} /> : null}
			{!props.isReadOnly ? <label className="vx-select-caret" text="▾" /> : null}
		</Pressable>
		<Popover anchor={anchor} open={props.open} placement={props.placement ?? 'bottom'} onDismiss={() => props.onOpenChange(false)} className="vx-menu">
			{props.searchable ? <flexboxlayout className="vx-select-search-row" flexDirection="row">
				<FieldProvider value={null}><TextInput id={props.id ? `${props.id}-search` : undefined} className="vx-select-search" value={props.query} placeholder={props.searchPlaceholder ?? 'Search…'} accessibilityLabel="Search options" ref={(handle: any) => { search.current = handle; if (!handle || didFocus.current) return; didFocus.current = true; handle.focus() }} onChange={props.onQueryChange} /></FieldProvider>
				{props.query ? <Pressable className="vx-select-search-clear" accessibilityLabel="Clear search" onPress={() => { props.onQueryChange(''); search.current?.focus?.() }}><label text="×" /></Pressable> : null}
			</flexboxlayout> : null}
			{props.multiple && props.hasSelectAll ? <Pressable id={props.id ? `${props.id}-select-all` : undefined} className="vx-select-all" disabled={props.pending || !props.enabled.length} accessibilityLabel={`${props.selectAllLabel ?? 'Select all'}, ${props.selectAllState}`} onPress={props.onSelectAll}><MultiInd state={props.selectAllState} /><label text={props.selectAllLabel ?? 'Select all'} /></Pressable> : null}
			<label className="vx-select-feedback" text={props.announcement} accessibilityLiveRegion={'polite' as any} />
			<scrollview height={Math.min(props.maxMenuHeight ?? 280, Math.max(40, props.shown.length * 56 + props.groups.length * 24))}>
				<flexboxlayout className="vx-menu-list vx-select-list" flexDirection="column">
					{!props.shown.length && !busy ? <label className="vx-select-empty" text={props.emptyText} /> : null}
					@for (const group of props.groups; index gi; key gi) {
						<flexboxlayout flexDirection="column">
							{group.heading != null ? <label className="vx-select-group" text={group.heading} /> : null}
							@for (const option of group.options; key option.value) {
								<flexboxlayout id={props.id ? `${props.id}-option-${option.value}` : undefined} className={cx('vx-menu-item', 'vx-select-option', props.selected.includes(option.value) && 'vx-select-option--on', option.isDisabled && 'vx-menu-item--disabled')} flexDirection="row" onTap={() => props.onPick(option)} accessibilityRole={nativeAccessibilityRole('button') as any} accessibilityLabel={`${option.label ?? option.value}${option.description ? ', ' + option.description : ''}${props.selected.includes(option.value) ? ', Selected' : ''}${option.isDisabled ? ', Disabled' : ''}`} accessibilityState={nativeAccessibilityState({ selected: props.selected.includes(option.value), disabled: option.isDisabled || props.pending }) as any}>
									<flexboxlayout className="vx-select-check">{props.multiple ? <MultiInd state={props.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} /> : <CheckInd state={props.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} />}</flexboxlayout>
									<flexboxlayout flexDirection="column"><label className="vx-menu-item-label" text={option.label ?? option.value} />{option.description ? <label className="vx-select-description" text={option.description} /> : null}</flexboxlayout>
								</flexboxlayout>
							}
						</flexboxlayout>
					}
				</flexboxlayout>
			</scrollview>
		</Popover>
	</>
}
