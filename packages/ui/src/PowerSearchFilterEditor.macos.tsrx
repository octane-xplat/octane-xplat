/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
import type { PowerSearchConfig, PartialFilter, PowerSearchFilter, FilterValue } from './props'
import { TextInput } from './text-controls.macos.tsrx'
import { Button } from './controls.macos.tsrx'
import { resolveOperatorLabel } from './power-search-config'
import { powerSearchTranslate } from './power-search-strings'

export interface PowerSearchFilterEditorProps {
	config: PowerSearchConfig
	filter: PartialFilter
	mode: 'create' | 'edit'
	onSave: (filter: PowerSearchFilter | null) => void
	onCancel: () => void
	saveButtonLabel?: string
	isReadOnly?: boolean
	timezoneID?: string
}

function initialValue(type: FilterValue['type']): FilterValue {
	switch (type) {
		case 'empty': return {type:'empty'}
		case 'integer': return {type:'integer', value:0}
		case 'float': return {type:'float', value:0}
		case 'time': return {type:'time', value:''}
		case 'date_absolute': return {type:'date_absolute', unixSeconds:Math.floor(Date.now()/1000)}
		case 'date_relative': return {type:'date_relative', value:'today'}
		case 'date_range': return {type:'date_range', value:{start:{type:'NOW'},end:{type:'NOW'}}}
		case 'enum': return {type:'enum', value:''}
		case 'enum_list': case 'string_list': return {type:type, value:[]}
		case 'entity_list': return {type:'entity_list', value:[]}
		case 'custom': return {type:'custom', value:''}
		case 'nested': return {type:'nested', value:[]}
		default: return {type:'string', value:''}
	}
}

function editorText(value?: FilterValue): string {
	if (!value || !('value' in value)) return value?.type === 'date_absolute' ? new Date(value.unixSeconds * 1000).toISOString().slice(0, 10) : ''
	return Array.isArray(value.value) ? value.value.join(', ') : String(value.value)
}

export function PowerSearchFilterEditor(props: PowerSearchFilterEditorProps) @{
	const field = props.config.fields.find(x => x.key === props.filter.field) ?? props.config.fields[0]
	const operator = field?.operators.find(x => x.key === props.filter.operator) ?? field?.operators[0]
	const [valueText, setValueText] = useState(editorText(props.filter.value))
	const value = operator ? props.filter.value ?? initialValue(operator.value.type) : {type:'empty'} as FilterValue
	const unsupported = operator?.value.type === 'date_range' || operator?.value.type === 'entity_list' || operator?.value.type === 'nested'
	const save = () => {
		if (!field || !operator || unsupported) return
		let next: FilterValue = value
		if (value.type === 'string' || value.type === 'custom' || value.type === 'time' || value.type === 'date_relative') next = {...value, value:valueText} as FilterValue
		else if (value.type === 'integer' || value.type === 'float') next = {...value, value:Number(valueText)} as FilterValue
		else if (value.type === 'enum') next = {...value, value:valueText} as FilterValue
		else if (value.type === 'string_list' || value.type === 'enum_list') next = {...value, value:valueText.split(',').map(item=>item.trim()).filter(Boolean)} as FilterValue
		else if (value.type === 'date_absolute') next = {...value, unixSeconds:Math.floor(Date.parse(`${valueText}T00:00:00Z`)/1000)}

		props.onSave({field:field.key, operator:operator.key, value:next})
	}

	<flexboxlayout className="vx-power-search-editor">
		<label className="vx-power-search-editor-heading" text={field ? `${field.label} · ${operator ? resolveOperatorLabel(operator) : ''}` : powerSearchTranslate('@astryx.powersearch.editor.field')} />
		{unsupported ? <label className="vx-power-search-editor-note" text="Add a custom editor for this value type." /> : operator && operator.value.type !== 'empty' ? <TextInput className="vx-power-search-editor-value" label="Value" value={valueText} onChange={setValueText} keyboardType={operator.value.type==='integer'||operator.value.type==='float'?'number':'default'} isDisabled={props.isReadOnly} /> : null}
		<flexboxlayout className="vx-power-search-editor-actions"><Button label="Cancel" variant="ghost" onPress={props.onCancel} /><Button label={props.saveButtonLabel ?? 'Apply'} variant="primary" onPress={save} isDisabled={props.isReadOnly||unsupported} /></flexboxlayout>
	</flexboxlayout>
}
