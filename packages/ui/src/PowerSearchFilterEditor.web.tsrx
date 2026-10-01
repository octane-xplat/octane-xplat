import { useState } from 'octane'
import type { PowerSearchEditorProps, FilterValue } from './props'
import { Button } from './Button.web.tsrx'
import { TextInput } from './TextInput.web.tsrx'
import { resolveOperatorLabel } from './power-search-config'

function editorText(value:any):string {
	if (!value) return ''
	if (value.type==='date_absolute') return new Date(value.unixSeconds*1000).toISOString().slice(0,10)
	if (!('value' in value)) return ''
	return Array.isArray(value.value)?value.value.join(', '):String(value.value)
}

export function PowerSearchFilterEditor(props: PowerSearchEditorProps) @{
	const field = props.config.fields.find(x=>x.key===props.filter.field) ?? props.config.fields[0]
	const operator = field?.operators.find(x=>x.key===props.filter.operator) ?? field?.operators[0]
	const initial = editorText(props.filter.value)
	const [text,setText] = useState(initial)
	const unsupported = operator?.value.type==='date_range'||operator?.value.type==='entity_list'||operator?.value.type==='nested'
	const save = () => {
		if (!field || !operator || unsupported) return
		let value: FilterValue
		const kind = operator.value.type
		if (kind === 'empty') value={type:'empty'}
		else if (kind === 'integer') value={type:'integer',value:Number(text)}
		else if (kind === 'float') value={type:'float',value:Number(text)}
		else if (kind === 'enum') value={type:'enum',value:text}
		else if (kind === 'string_list') value={type:'string_list',value:text.split(',').map(item=>item.trim()).filter(Boolean)}
		else if (kind === 'enum_list') value={type:'enum_list',value:text.split(',').map(item=>item.trim()).filter(Boolean)}
		else if (kind === 'date_absolute') value={type:'date_absolute',unixSeconds:Math.floor(Date.parse(`${text}T00:00:00Z`)/1000)}
		else value={type:'string',value:text}

		props.onSave({field:field.key,operator:operator.key,value})
	}

	<div className="vx-power-search-editor">
		<strong>{field?.label} · {operator ? resolveOperatorLabel(operator) : ''}</strong>
		{unsupported ? <div className="vx-power-search-editor-note">Add a custom editor for this value type.</div> : operator?.value.type !== 'empty' ? <TextInput label="Value" value={text} onChange={setText} keyboardType={operator?.value.type==='integer'||operator?.value.type==='float'?'number':'default'} web={operator?.value.type==='date_absolute'?{type:'date'}:undefined} isDisabled={props.isReadOnly} /> : null}
		<div className="vx-power-search-editor-actions"><Button label="Cancel" variant="ghost" onPress={props.onCancel} /><Button label={props.saveButtonLabel ?? 'Apply'} variant="primary" onPress={save} isDisabled={props.isReadOnly||unsupported} /></div>
	</div>
}
