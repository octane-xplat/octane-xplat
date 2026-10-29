/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import type { PowerSearchFilterEditorProps, FilterValue, TextInputHandle } from '../../props'
import { TextInput } from './text-controls.macos.tsrx'
import { Button } from '../actions/controls.macos.tsrx'
import { resolveOperatorLabel } from './power-search-config'
import { powerSearchTranslate } from './power-search-strings'
import { PowerSearchDateRangeEditor } from './PowerSearchDateRangeEditor.macos.tsrx'
import { PowerSearchEntityEditor } from './PowerSearchEntityEditor.macos.tsrx'
import { powerSearchNumber } from './power-search-number.macos'
import { hasDateComposition } from './date-composition.macos'
import { absoluteFilterText, absoluteFilterValue } from './power-search-absolute-date.macos'

function initialValue(type: FilterValue['type']): FilterValue {
	switch (type) {
		case 'empty':
			return { type: 'empty' }
		case 'integer':
			return { type: 'integer', value: 0 }
		case 'float':
			return { type: 'float', value: 0 }
		case 'time':
			return { type: 'time', value: '' }
		case 'date_absolute':
			return { type: 'date_absolute', unixSeconds: Math.floor(Date.now() / 1000) }
		case 'date_relative':
			return { type: 'date_relative', value: 'today' }
		case 'date_range':
			return { type: 'date_range', value: { start: { type: 'NOW' }, end: { type: 'NOW' } } }
		case 'enum':
			return { type: 'enum', value: '' }
		case 'enum_list':
		case 'string_list':
			return { type: type, value: [] }
		case 'entity_list':
			return { type: 'entity_list', value: [] }
		case 'custom':
			return { type: 'custom', value: '' }
		case 'nested':
			return { type: 'nested', value: [] }
		default:
			return { type: 'string', value: '' }
	}
}

function editorText(value?: FilterValue, dateOnly = false): string {
	if (!value || !('value' in value)) {
		if (value?.type !== 'date_absolute') return ''
		return absoluteFilterText(value.unixSeconds, dateOnly)
	}

	return Array.isArray(value.value) ? value.value.join(', ') : String(value.value)
}

export function PowerSearchFilterEditor(props: PowerSearchFilterEditorProps) @{
	const field = props.config.fields.find((x) => x.key === props.filter.field)
	const operatorKey = props.filter.operator ?? field?.defaultOperator
	const operator = props.filter.operator !== undefined
		? field?.operators.find((x) => x.key === operatorKey)
		: field?.operators.find((x) => x.key === operatorKey) ?? field?.operators[0]
	const dateOnly = operator?.value.type === 'date_absolute' && !!operator.value.isDateOnly
	const live = useRef(props); live.current = props
	const source = useRef({ filter: props.filter, field: field?.key, operator, dateOnly, revision: 0 })
	const closed = useRef(false)
	if (source.current.filter !== props.filter || source.current.field !== field?.key || source.current.operator !== operator || source.current.dateOnly !== dateOnly) {
		source.current = { filter: props.filter, field: field?.key, operator, dateOnly, revision: source.current.revision + 1 }; closed.current = false
	}
	const revision = source.current.revision
	const seed = () => ({ revision, text: props.filter.value?.type === operator?.value.type ? editorText(props.filter.value, dateOnly) : '', error: '' })
	const draft = useRef(seed())
	if (draft.current.revision !== revision) draft.current = seed()
	const [, rerender] = useState(0)
	const alive = useRef(true), input = useRef<{ token: object; handle: TextInputHandle } | null>(null)
	useEffect(() => { alive.current = true; return () => { alive.current = false; input.current = null } }, [])
	const current = () => alive.current && !closed.current && source.current.revision === revision
	const editable = () => current() && !live.current.isReadOnly && !live.current.filter.isReadOnly
	const composing = () => { try { return !!input.current && hasDateComposition(input.current.handle.native) } catch { return true } }
	const token = {}
	const bindInput = (handle: TextInputHandle | null) => {
		if (handle) { if (current()) input.current = { token, handle } }
		else if (input.current?.token === token) input.current = null
	}
	const setValueText = (text: string) => {
		if (!editable()) return
		draft.current = { revision, text, error: '' }; rerender((n) => n + 1)
	}
	const cancel = () => { if (current()) { closed.current = true; rerender((n) => n + 1); live.current.onCancel() } }
	const value = operator
		? (props.filter.value?.type === operator.value.type ? props.filter.value : initialValue(operator.value.type))
		: ({ type: 'empty' } as FilterValue)

	const unsupported = operator?.value.type === 'nested'

	const submitted = useRef<typeof draft.current | null>(null)
	const save = () => {
		if (!editable() || composing() || submitted.current === draft.current || !field || !operator || unsupported || operator.value.type === 'date_range' || operator.value.type === 'entity_list') {
			return
		}
		const valueText = draft.current.text

		let next: FilterValue = value
		if (
			value.type === 'string' ||
			value.type === 'custom' ||
			value.type === 'time' ||
			value.type === 'date_relative'
		) {
			next = { ...value, value: valueText } as FilterValue
		} else if (value.type === 'integer' || value.type === 'float') {
			if (operator.value.type !== 'integer' && operator.value.type !== 'float') return
			const checked = powerSearchNumber(valueText, operator.value)
			if (!checked.value) {
				draft.current = { ...draft.current, error: checked.error ?? 'Enter a valid number.' }; rerender((n) => n + 1); return
			}
			next = checked.value
		} else if (value.type === 'enum') {
			next = { ...value, value: valueText } as FilterValue
		} else if (value.type === 'string_list' || value.type === 'enum_list') {
			next = {
				...value,
				value: valueText
					.split(',')
					.map((item) => item.trim())
					.filter(Boolean),
			} as FilterValue
		} else if (value.type === 'date_absolute') {
			if (operator.value.type !== 'date_absolute') return
			const checked = absoluteFilterValue(valueText, operator.value, value)
			if (!checked.value) {
				draft.current = { ...draft.current, error: checked.error ?? 'Enter a valid UTC date.' }; rerender((n) => n + 1); return
			}
			next = checked.value
		}

		const saved = draft.current
		submitted.current = saved
		try { live.current.onSave({ field: field.key, operator: operator.key, value: next }) }
		catch (error) { if (submitted.current === saved) submitted.current = null; throw error }
	}
	const readOnly = props.isReadOnly || props.filter.isReadOnly || closed.current
	const number = operator?.value.type === 'integer' || operator?.value.type === 'float' ? operator.value : null

	@if (field && operator?.value.type === 'date_range') {
		<PowerSearchDateRangeEditor {...props} field={field} operator={operator} />
	} @else if (field && operator?.value.type === 'entity_list') {
		<PowerSearchEntityEditor {...props} field={field} operator={operator} />
	} @else {
	<masonview className="vx-power-search-editor" style={{ display: 'flex' }}>
		<label
			className="vx-power-search-editor-heading"
			text={
				field
					? `${field.label} · ${operator ? resolveOperatorLabel(operator) : ''}`
					: powerSearchTranslate('@astryx.powersearch.editor.field')
			}
		/>
		@if (!field || !operator) { <label text="This filter field or operator is no longer available." /> }
		{unsupported ? (
			<label
				className="vx-power-search-editor-note"
				text="Add a custom editor for this value type."
			/>
		) : operator && operator.value.type !== 'empty' ? (
			<TextInput
				ref={bindInput}
				className="vx-power-search-editor-value"
				label={operator.value.type === 'date_absolute' ? (dateOnly ? 'UTC date' : 'UTC date/time') : 'Value'}
				placeholder={operator.value.type === 'date_absolute' ? (dateOnly ? '2026-10-29' : '2026-10-29T12:30:00Z') : undefined}
				value={draft.current.text}
				onChange={setValueText}
				keyboardType={
					operator.value.type === 'integer' || operator.value.type === 'float'
						? 'number'
						: 'default'
				}
				isDisabled={readOnly}
			/>
		) : null}
		@if (operator?.value.type === 'date_absolute') { <label text={dateOnly ? 'Date-only values use midnight UTC.' : 'Dates use UTC. A plain date means midnight; include a time to keep hours and minutes.'} /> }
		@if (number) { <label text={[number.units, number.minValue !== undefined ? `Minimum: ${number.minValue}` : '', number.maxValue !== undefined ? `Maximum: ${number.maxValue}` : ''].filter(Boolean).join(' · ')} /> }
		@if (draft.current.error) { <label text={draft.current.error} accessibilityLiveRegion="polite" /> }
		<masonview className="vx-power-search-editor-actions" style={{ display: 'flex' }}>
			<Button label="Cancel" variant="ghost" clickAction={cancel} />
			<Button
				label={props.saveButtonLabel ?? 'Apply'}
				variant="primary"
				clickAction={save}
				isDisabled={readOnly || unsupported || !field || !operator}
			/>
		</masonview>
	</masonview>
	}
}
