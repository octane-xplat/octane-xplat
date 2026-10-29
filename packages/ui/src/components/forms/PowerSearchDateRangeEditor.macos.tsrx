/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import type { PowerSearchFilterEditorProps, PowerSearchField, PowerSearchOperator, TextInputHandle } from '../../props'
import { TextInput } from './text-controls.macos.tsrx'
import { Button } from '../actions/controls.macos.tsrx'
import { SegmentedControl } from './SegmentedControl.macos.tsrx'
import { hasDateComposition } from './date-composition.macos'
import { rangeDraft, rangeUnits, rangeValue } from './power-search-date-range.macos'
import type { RangeDraft, RangePartDraft } from './power-search-date-range.macos'

interface Props extends PowerSearchFilterEditorProps { field: PowerSearchField; operator: PowerSearchOperator }
export function PowerSearchDateRangeEditor(props: Props) @{
	const live = useRef(props); live.current = props
	const source = useRef({ filter: props.filter, field: props.field.key, operator: props.operator, revision: 0 })
	if (source.current.filter !== props.filter || source.current.field !== props.field.key || source.current.operator !== props.operator) {
		source.current = { filter: props.filter, field: props.field.key, operator: props.operator, revision: source.current.revision + 1 }
	}
	const revision = source.current.revision
	const seed = () => rangeDraft(props.filter.value?.type === 'date_range' ? props.filter.value.value : undefined)
	const [, rerender] = useState(0)
	const record = useRef({ revision, draft: seed() })
	if (record.current.revision !== revision) record.current = { revision, draft: seed() }
	const draft = record.current.draft
	const inputs = useRef(new Map<string, { token: object; handle: TextInputHandle }>())
	const alive = useRef(true)
	useEffect(() => { alive.current = true; return () => { alive.current = false; inputs.current.clear() } }, [])
	const editable = () => alive.current && source.current.revision === revision && !live.current.isReadOnly && !live.current.filter.isReadOnly
	const change = (next: RangeDraft) => {
		if (!editable()) return
		record.current = { revision, draft: next }; rerender((n) => n + 1)
	}
	const partChange = (edge: 'start' | 'end', patch: Partial<RangePartDraft>) => {
		const latest = record.current.draft
		change({ ...latest, [edge]: { ...latest[edge], ...patch } })
	}
	const inputRef = (key: string) => {
		const token = {}
		return (handle: TextInputHandle | null) => {
			if (handle) { if (alive.current && source.current.revision === revision) inputs.current.set(key, { token, handle }) }
			else if (inputs.current.get(key)?.token === token) inputs.current.delete(key)
		}
	}
	const composing = () => {
		try { return [...inputs.current.values()].some(({ handle }) => hasDateComposition(handle.native)) } catch { return true }
	}
	const submitted = useRef<RangeDraft | null>(null)
	const checked = rangeValue(draft)
	const save = () => {
		if (!editable() || submitted.current === record.current.draft || composing()) return
		// Revalidate NOW/relative ordering against one current instant at Apply.
		const next = rangeValue(record.current.draft)
		if (!next.value || !editable()) return
		const savedDraft = record.current.draft
		submitted.current = savedDraft
		try { live.current.onSave({ field: props.field.key, operator: props.operator.key, value: { type: 'date_range', value: next.value } }) }
		catch (error) { if (submitted.current === savedDraft) submitted.current = null; throw error }
	}
	const readOnly = props.isReadOnly || props.filter.isReadOnly
	const config = props.operator.value.type === 'date_range' ? props.operator.value : null

	<masonview className="vx-power-search-range-editor">
		<label text={`${props.field.label} · Date range`} />
		<label text="Date/time entries use UTC. Relative amounts count back from now; negative amounts mean future time." />
		@for (const edge of ['start', 'end'] as const; key edge) {
			<masonview className="vx-power-search-range-part">
				<label text={edge === 'start' ? 'Start' : 'End'} />
				<SegmentedControl value={draft[edge].kind} isDisabled={readOnly} accessibilityLabel={`${edge} endpoint type`}
					options={[{ value: 'NOW', label: 'Now' }, { value: 'ABSOLUTE', label: 'Date/time' }, { value: 'RELATIVE', label: 'Relative' }]}
					onValueChange={(kind) => {
						if (kind !== 'NOW' && kind !== 'ABSOLUTE' && kind !== 'RELATIVE') return
						partChange(edge, { kind, instant: record.current.draft[edge].instant || new Date(Math.floor(Date.now() / 1000) * 1000).toISOString() })
					}} />
				@if (draft[edge].kind === 'ABSOLUTE') {
					<TextInput ref={inputRef(`${edge}-instant`)} label={`${edge} UTC date/time`} placeholder="2026-10-29 or 2026-10-29T12:30:00Z" value={draft[edge].instant}
						onChange={(instant) => partChange(edge, { instant })} isDisabled={readOnly} />
				} @else if (draft[edge].kind === 'RELATIVE') {
					<masonview className="vx-power-search-range-part">
					<TextInput ref={inputRef(`${edge}-amount`)} label={`${edge} amount back`} value={draft[edge].amount} onChange={(amount) => partChange(edge, { amount })} isDisabled={readOnly} />
					<SegmentedControl value={draft[edge].unit} isDisabled={readOnly} accessibilityLabel={`${edge} relative unit`}
						options={rangeUnits.map((unit) => ({ value: unit, label: unit }))}
						onValueChange={(unit) => partChange(edge, { unit })} />
					<TextInput ref={inputRef(`${edge}-anchor`)} label={`${edge} anchor key (optional, app-owned)`} value={draft[edge].anchorKey}
						onChange={(anchorKey) => partChange(edge, { anchorKey })} isDisabled={readOnly} />
					</masonview>
				}
			</masonview>
		}
		@if (config?.intervalDatePresets?.length) {
			<masonview className="vx-power-search-range-presets">
				@for (const preset of config.intervalDatePresets; index i; key i) {
					<Button label={preset.label} variant="ghost" isDisabled={readOnly} clickAction={() => change(rangeDraft(preset.value))} />
				}
			</masonview>
		}
		@if (config?.relativeDatePresets?.length) { <label text="Expression-string presets require a custom editor; use the relative endpoint controls here." /> }
		@if (checked.error) { <label text={checked.error} accessibilityLiveRegion="polite" /> }
		<masonview className="vx-power-search-range-actions">
			<Button label="Cancel" variant="ghost" clickAction={() => { if (alive.current && source.current.revision === revision) live.current.onCancel() }} />
			<Button label={props.saveButtonLabel ?? 'Apply'} variant="primary" clickAction={save} isDisabled={readOnly} />
		</masonview>
	</masonview>
}
<style>
	.vx-power-search-range-editor, .vx-power-search-range-part { display: flex; flex-direction: column; gap: 8; }
	.vx-power-search-range-presets, .vx-power-search-range-actions { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8; }
</style>
