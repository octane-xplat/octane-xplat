/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { PowerSearchProps, PowerSearchFilter, PartialFilter, PowerSearchHandle } from './props'
import { SearchInput } from './SearchInput.tsrx'
import { Icon } from './Icon.tsrx'
import { Button } from './Button.tsrx'
import { Pressable } from './Pressable.tsrx'
import { Popover } from './Popover.tsrx'
import { PowerSearchToken } from './PowerSearchToken.tsrx'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.tsrx'
import { createInternalConfig, createPowerSearchSource } from './power-search-config'
import { powerSearchTranslate } from './power-search-strings'
import { cx } from './cx'

export function PowerSearch(props: PowerSearchProps) @{
	const anchor = useRef<any>(null)
	const inputHandle = useRef<any>(null)
	const [query, setQuery] = useState('')
	const [editing, setEditing] = useState<{filter:PartialFilter; index:number} | null>(null)
	const [open, setOpen] = useState(false)
	const internal = useMemo(() => createInternalConfig(props.config), [props.config])
	const source = useMemo(() => createPowerSearchSource(internal, props.maxSearchResults ?? 10), [internal, props.maxSearchResults])
	const results = (source.search(query) as any[]).slice(0, props.maxSearchResults ?? 10)
	const Suggestion: any = Pressable
	useEffect(()=>{props.handleRef?.({focusTypeahead:()=>inputHandle.current?.focus?.(),blurTypeahead:()=>inputHandle.current?.blur?.()} as PowerSearchHandle)},[props.handleRef])
	useEffect(()=>{if(props.hasAutoFocus)inputHandle.current?.focus?.()},[props.hasAutoFocus])
	const chooseField = (item:any) => {
		const field = internal.getField(item.auxiliaryData?.fieldKey ?? item.id)
		if (!field) return
		setEditing({filter:{field:field.key, operator:item.auxiliaryData?.operatorKey ?? field.defaultOperator, value:item.auxiliaryData?.filterValue}, index:-1})
		setOpen(false)
	}

	const save = (filter:PowerSearchFilter|null) => {
		if (!editing) return
		if (filter) {
			const next = [...props.filters]
			const changeType = editing.index < 0 ? 'add' : 'edit'
			const index = editing.index < 0 ? next.length : editing.index
			if (changeType === 'add') next.push(filter); else next[index] = filter
			props.onChange(next, changeType, index)
		}

		setEditing(null); setQuery('')
	}

	const remove = (index:number) => props.onChange(props.filters.filter((_f,i)=>i!==index), 'remove', index)
	const status = props.status
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
				return <Token key={`${filter.field}-${index}`} config={props.config} filter={filter} field={field} operator={operator} maxLength={props.maxTokenLength ?? 40} timezoneID={props.timezoneID} onPress={()=>!props.isReadOnly && setEditing({filter,index})} onRemove={props.isReadOnly ? undefined : ()=>remove(index)} isDisabled={props.isDisabled || props.isReadOnly} />
			})}
			<SearchInput bind={(h:any)=>inputHandle.current=h} className="vx-power-search-input" value={query} placeholder={props.placeholder ?? powerSearchTranslate('@astryx.powersearch.placeholder')} onChange={(value:string)=>{setQuery(value);setOpen(true)}} onFocus={()=>{props.onFocus?.();setOpen(true)}} onBlur={props.onBlur} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading} description={props.disabledMessage} hasClear={false} accessibilityLabel={props.label ?? 'Search'} />
			{props.resultCount != null ? <label className="vx-power-search-count" accessibilityLiveRegion={'polite' as any} text={String(props.resultCount)} /> : null}
			{props.endContent}
			{props.hasClear !== false && props.filters.length > 0 ? <Button label="Clear" variant="ghost" onPress={()=>props.onChange([], 'remove', -1)} isDisabled={props.isDisabled} /> : null}
		</flexboxlayout>
		<Popover anchor={anchor} open={open && !editing && !props.isDisabled} placement="bottom" onDismiss={()=>setOpen(false)} className="vx-power-search-results" style={props.menuWidth ? {width:props.menuWidth} : undefined}>
			<flexboxlayout className="vx-power-search-result-list">
				{results.map((item:any)=><Suggestion key={item.id} className="vx-power-search-result" onPress={()=>chooseField(item)}><label text={item.label} /></Suggestion>)}
				{results.length === 0 ? <label className="vx-power-search-empty" text="No results" /> : null}
			</flexboxlayout>
		</Popover>
		<Popover anchor={anchor} open={!!editing} placement="bottom" onDismiss={()=>setEditing(null)} className="vx-power-search-edit">
			{editing ? <Editor config={props.config} filter={editing.filter} mode={editing.index<0?'create':'edit'} onSave={save} onCancel={()=>setEditing(null)} saveButtonLabel={props.popoverSaveButtonLabel} isReadOnly={props.isReadOnly} timezoneID={props.timezoneID} /> : null}
		</Popover>
		{status?.message ? <label className={cx('vx-power-search-status', `vx-power-search-status--${status.type}`, `vx-power-search-status--${props.statusVariant ?? 'attached'}`)} text={status.message} /> : null}
	</flexboxlayout>
}

export { PowerSearchToken, PowerSearchFilterEditor }
export { resolveOperatorLabel, createPowerSearchConfig, usePowerSearchConfig } from './power-search-config'
export type { FieldDefinition, InferData } from './props'
