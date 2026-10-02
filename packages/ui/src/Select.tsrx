/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane'
import type { SelectProps } from './props'
import { cx } from './cx'
import { Pressable } from './Pressable'
import { Popover } from './Popover'
import { TextInput } from './TextInput.tsrx'
import { FieldProvider, useFieldControlProps } from './field-context'
import { useIndicator, CheckIndicator, CheckboxIndicator } from './indicators'
import { nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { useSelect } from './useSelect'

/** Finite-list selection with local search; Typeahead owns async result sources. */
export function Select(inputProps: SelectProps) @{
	const props = useFieldControlProps(inputProps)
	const state = useSelect(props)
	const anchor = useRef<any>(null)
	const search = useRef<any>(null)
	const didFocus = useRef(false)
	const CheckInd = useIndicator('check') ?? CheckIndicator
	const MultiInd = useIndicator('checkbox') ?? CheckboxIndicator
	useEffect(() => { if (!state.open) didFocus.current = false }, [state.open])

	<>
		<Pressable ref={(view: any) => { anchor.current = view }} id={props.id} className={cx('vx-select-trigger', props.isDisabled && 'vx-select--disabled', props.isReadOnly && 'vx-select--readonly', state.busy && 'vx-select--loading', props.className)} style={props.style} disabled={props.isDisabled} onPress={() => state.setOpen(!state.open)} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled }} accessibilityValue={state.triggerText}>
			<label className={cx('vx-select-value', !state.selected.length && 'vx-select-placeholder')} text={state.triggerText} />
			{props.hasClear && state.selected.length && !state.blocked ? <Pressable className="vx-select-clear" disabled={state.pending} accessibilityLabel="Clear selection" onPress={state.clear}><label text="×" /></Pressable> : null}
			{state.busy ? <label className="vx-select-loading" text="Loading…" accessibilityLiveRegion={'polite' as any} /> : null}
			{!props.isReadOnly ? <label className="vx-select-caret" text="▾" /> : null}
		</Pressable>
		<Popover anchor={anchor} open={state.open} placement={props.placement ?? 'bottom'} onDismiss={() => state.setOpen(false)} className="vx-menu">
			{props.searchable ? <flexboxlayout className="vx-select-search-row" flexDirection="row">
				<FieldProvider value={null}><TextInput id={props.id ? `${props.id}-search` : undefined} className="vx-select-search" value={state.query} placeholder={props.searchPlaceholder ?? 'Search…'} accessibilityLabel="Search options" ref={(handle: any) => { search.current = handle; if (!handle || didFocus.current) return; didFocus.current = true; handle.focus() }} onChange={state.setQuery} /></FieldProvider>
				{state.query ? <Pressable className="vx-select-search-clear" accessibilityLabel="Clear search" onPress={() => { state.setQuery(''); search.current?.focus?.() }}><label text="×" /></Pressable> : null}
			</flexboxlayout> : null}
			{props.multiple && props.hasSelectAll ? <Pressable id={props.id ? `${props.id}-select-all` : undefined} className="vx-select-all" disabled={state.pending || !state.enabled.length} accessibilityLabel={`${props.selectAllLabel ?? 'Select all'}, ${state.selectAllState}`} onPress={state.selectAll}><MultiInd state={state.selectAllState} /><label text={props.selectAllLabel ?? 'Select all'} /></Pressable> : null}
			<label className="vx-select-feedback" text={state.announcement} accessibilityLiveRegion={'polite' as any} />
			<scrollview height={Math.min(props.maxMenuHeight ?? 280, Math.max(40, state.shown.length * 56 + state.groups.length * 24))}>
				<flexboxlayout className="vx-menu-list vx-select-list" flexDirection="column">
					{!state.shown.length && !state.busy ? <label className="vx-select-empty" text={state.emptyText} /> : null}
					@for (const group of state.groups; index gi; key gi) {
						<flexboxlayout flexDirection="column">
							{group.heading != null ? <label className="vx-select-group" text={group.heading} /> : null}
							@for (const option of group.options; key option.value) {
								<flexboxlayout id={props.id ? `${props.id}-option-${option.value}` : undefined} className={cx('vx-menu-item', 'vx-select-option', state.selected.includes(option.value) && 'vx-select-option--on', option.isDisabled && 'vx-menu-item--disabled')} flexDirection="row" onTap={() => state.pick(option)} accessibilityRole={nativeAccessibilityRole('button') as any} accessibilityLabel={`${option.label ?? option.value}${option.description ? ', ' + option.description : ''}${state.selected.includes(option.value) ? ', Selected' : ''}${option.isDisabled ? ', Disabled' : ''}`} accessibilityState={nativeAccessibilityState({ selected: state.selected.includes(option.value), disabled: option.isDisabled || state.pending }) as any}>
									<flexboxlayout className="vx-select-check">{props.multiple ? <MultiInd state={state.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} /> : <CheckInd state={state.selected.includes(option.value) ? 'checked' : 'unchecked'} isDisabled={option.isDisabled} />}</flexboxlayout>
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
