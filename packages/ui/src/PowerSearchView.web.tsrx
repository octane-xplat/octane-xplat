import { useEffect, useRef } from 'octane'
import type { PowerSearchHandle } from './props'
import { useSize } from './size-context';
import type { PowerSearchViewProps } from './power-search-view'
import { SearchInput } from './SearchInput.web.tsrx'
import { Icon } from './Icon.web.tsrx'
import { Button } from './Button.web.tsrx'
import { Pressable } from './Pressable.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { PowerSearchToken } from './PowerSearchToken.web.tsrx'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.web.tsrx'
import { powerSearchTranslate } from './power-search-strings'
import { cx } from '@octane-xplat/lib'

export function PowerSearchView(props: PowerSearchViewProps) @{
	const size = useSize(props.size, 'md')
	const anchor = useRef<any>(null)
	const inputHandle = useRef<any>(null)
	const { query, editing, results, internal } = props
	const Suggestion:any=Pressable
	useEffect(()=>{props.handleRef?.({focusTypeahead:()=>inputHandle.current?.focus?.(),blurTypeahead:()=>inputHandle.current?.blur?.()} as PowerSearchHandle)},[props.handleRef])
	useEffect(()=>{if(props.hasAutoFocus)inputHandle.current?.focus?.()},[props.hasAutoFocus])
	const Token:any=PowerSearchToken
	const Editor:any=PowerSearchFilterEditor

	<div id={props.id} ref={(node:any)=>anchor.current=node} className={cx('vx-power-search',`vx-power-search--size-${size}`,props.isDisabled&&'vx-power-search--disabled',props.className)} style={props.style}>
		<div className="vx-power-search-row">
			{props.startIcon ? typeof props.startIcon==='string' ? <Icon className="vx-power-search-start-icon" name={props.startIcon}/> : props.startIcon : null}
			{props.filters.map((filter,index)=>{const field=internal.getField(filter.field),operator=internal.getOperator(filter.field,filter.operator);if(!field||!operator)return null;return <Token key={`${filter.field}-${index}`} config={props.config} filter={filter} field={field} operator={operator} maxLength={props.maxTokenLength??40} timezoneID={props.timezoneID} onPress={()=>!props.isReadOnly&&props.onEdit(filter,index)} onRemove={props.isReadOnly?undefined:()=>props.onRemove(index)} isDisabled={props.isDisabled||props.isReadOnly}/>})}
			<SearchInput ref={(h:any)=>inputHandle.current=h} className="vx-power-search-input" value={query} placeholder={props.placeholder??powerSearchTranslate('@astryx.powersearch.placeholder')} onChange={props.onQueryChange} onFocus={props.onInputFocus} onBlur={props.onBlur} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading} description={props.disabledMessage} hasClear={false} accessibilityLabel={props.label??'Search'} />
			{props.resultCount!=null?<span className="vx-power-search-count" aria-live="polite">{String(props.resultCount)}</span>:null}{props.endContent}
			{props.hasClear!==false&&props.filters.length>0?<Button label="Clear" variant="ghost" clickAction={props.onClear} isDisabled={props.isDisabled}/>:null}
		</div>
		<Popover anchor={anchor} open={props.suggestionsOpen} placement="bottom" onDismiss={()=>props.onDismiss()} className="vx-power-search-results" style={props.menuWidth?{width:props.menuWidth}:undefined}><div className="vx-power-search-result-list">{results.map((item:any)=><Suggestion key={item.id} className="vx-power-search-result" onPress={()=>props.onChoose(item)}>{item.label}</Suggestion>)}{results.length===0?<div className="vx-power-search-empty">No results</div>:null}</div></Popover>
		<Popover anchor={anchor} open={!!editing} placement="bottom" onDismiss={()=>props.onCancel()} className="vx-power-search-edit">{editing?<Editor config={props.config} filter={editing.filter} mode={editing.index<0?'create':'edit'} onSave={props.onSave} onCancel={()=>props.onCancel()} saveButtonLabel={props.popoverSaveButtonLabel} isReadOnly={props.isReadOnly} timezoneID={props.timezoneID}/>:null}</Popover>
		{props.status?.message?<div role={props.status.type==='error'?'alert':'status'} className={cx('vx-power-search-status',`vx-power-search-status--${props.status.type}`,`vx-power-search-status--${props.statusVariant??'attached'}`)}>{props.status.message}</div>:null}
	</div>
}
