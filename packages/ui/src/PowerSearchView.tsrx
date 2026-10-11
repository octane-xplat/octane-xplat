/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane'
import type { PowerSearchHandle } from './props'
import type { PowerSearchViewProps } from './power-search-view'
import { SearchInput } from './SearchInput.tsrx'
import { Icon } from './Icon'
import { Button } from './Button.tsrx'
import { Pressable } from './Pressable'
import { Popover } from './Popover'
import { PowerSearchToken } from './PowerSearchToken'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor'
import { powerSearchTranslate } from './power-search-strings'
import { cx } from './cx'

export function PowerSearchView(props: PowerSearchViewProps) @{
	const anchor = useRef<any>(null)
	const inputHandle = useRef<any>(null)
	const { query, editing, results, internal } = props
	const Suggestion:any=Pressable
	const status = props.status
	useEffect(()=>{props.handleRef?.({focusTypeahead:()=>inputHandle.current?.focus?.(),blurTypeahead:()=>inputHandle.current?.blur?.()} as PowerSearchHandle)},[props.handleRef])
	useEffect(()=>{if(props.hasAutoFocus)inputHandle.current?.focus?.()},[props.hasAutoFocus])
	const Editor: any = editing
		? props.components?.[internal.getOperator(editing.filter.field, editing.filter.operator ?? '')?.value.type ?? 'string']?.Editor ?? PowerSearchFilterEditor
		: PowerSearchFilterEditor

	<flexboxlayout id={props.id} className={cx('vx-power-search', `vx-power-search--size-${props.size ?? 'md'}`, props.isDisabled && 'vx-power-search--disabled', props.className)} style={props.style} ref={(v:any)=>{anchor.current=v}}>
		<flexboxlayout className="vx-power-search-row">
			{props.startIcon ? typeof props.startIcon === 'string' ? <Icon className="vx-power-search-start-icon" name={props.startIcon} /> : props.startIcon : null}
			{props.filters.map((filter, index) => {
				const field = internal.getField(filter.field), operator = internal.getOperator(filter.field, filter.operator)
				if (!field || !operator) return null
				const Token = props.components?.[filter.value.type]?.Token ?? PowerSearchToken
				return <Token key={`${filter.field}-${index}`} config={props.config} filter={filter} field={field} operator={operator} maxLength={props.maxTokenLength ?? 40} timezoneID={props.timezoneID} onPress={()=>!props.isReadOnly && props.onEdit(filter,index)} onRemove={props.isReadOnly ? undefined : ()=>props.onRemove(index)} isDisabled={props.isDisabled || props.isReadOnly} />
			})}
			<SearchInput ref={(h:any)=>inputHandle.current=h} className="vx-power-search-input" value={query} placeholder={props.placeholder ?? powerSearchTranslate('@astryx.powersearch.placeholder')} onChange={props.onQueryChange} onFocus={props.onInputFocus} onBlur={props.onBlur} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading} description={props.disabledMessage} hasClear={false} accessibilityLabel={props.label ?? 'Search'} />
			{props.resultCount != null ? <label className="vx-power-search-count" accessibilityLiveRegion={'polite' as any} text={String(props.resultCount)} /> : null}
			{props.endContent}
			{props.hasClear !== false && props.filters.length > 0 ? <Button label="Clear" variant="ghost" onPress={props.onClear} isDisabled={props.isDisabled} /> : null}
		</flexboxlayout>
		<Popover anchor={anchor} open={props.suggestionsOpen} placement="bottom" onDismiss={()=>props.onDismiss()} className="vx-power-search-results" style={props.menuWidth ? {width:props.menuWidth} : undefined}>
			<flexboxlayout className="vx-power-search-result-list">
				{results.map((item:any)=><Suggestion key={item.id} className="vx-power-search-result" onPress={()=>props.onChoose(item)}><label text={item.label} /></Suggestion>)}
				{results.length === 0 ? <label className="vx-power-search-empty" text="No results" /> : null}
			</flexboxlayout>
		</Popover>
		<Popover anchor={anchor} open={!!editing} placement="bottom" onDismiss={()=>props.onCancel()} className="vx-power-search-edit">
			{editing ? <Editor config={props.config} filter={editing.filter} mode={editing.index<0?'create':'edit'} onSave={props.onSave} onCancel={()=>props.onCancel()} saveButtonLabel={props.popoverSaveButtonLabel} isReadOnly={props.isReadOnly} timezoneID={props.timezoneID} /> : null}
		</Popover>
		{status?.message ? <label className={cx('vx-power-search-status', `vx-power-search-status--${status.type}`, `vx-power-search-status--${props.statusVariant ?? 'attached'}`)} text={status.message} /> : null}
	</flexboxlayout>
}
