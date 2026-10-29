/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import type { PowerSearchFilterEditorProps, PowerSearchField, PowerSearchOperator, SearchableItem, SearchSource, TextInputHandle } from '../../props'
import { Tokenizer } from './Tokenizer.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { Button } from '../actions/controls.macos.tsrx'
import { hasDateComposition } from './date-composition.macos'
import { entitySelection, entityValue, resolveEntityEntries } from './power-search-entities.macos'

const emptySource: SearchSource = { search: () => [], bootstrap: () => [] }
interface Props extends PowerSearchFilterEditorProps { field: PowerSearchField; operator: PowerSearchOperator }
interface Draft { revision: number; items: SearchableItem[]; text: string; error?: string }

export function PowerSearchEntityEditor(props: Props) @{
	const live = useRef(props); live.current = props
	const config = props.operator.value.type === 'entity_list' ? props.operator.value : null
	const readOnly = !!(props.isReadOnly || props.filter.isReadOnly)
	const identity = [props.filter, props.field.key, props.operator, props.operator.key, config?.searchSource, config?.isArbitraryStringAllowed, config?.tokenization, config?.tokenization?.regex, config?.tokenization?.sort]
	const source = useRef({ identity, revision: 0 })
	const pending = useRef<AbortController | null>(null)
	const closed = useRef(false)
	if (identity.some((value, index) => value !== source.current.identity[index])) {
		source.current = { identity, revision: source.current.revision + 1 }
		pending.current?.abort(); pending.current = null; closed.current = false
	}
	if (readOnly && pending.current) { pending.current.abort(); pending.current = null }
	const revision = source.current.revision
	const seed = (): Draft => ({ revision, items: entitySelection(props.filter.value?.type === 'entity_list' ? props.filter.value.value : []), text: '' })
	const draft = useRef(seed())
	if (draft.current.revision !== revision) draft.current = seed()
	const [, rerender] = useState(0)
	const alive = useRef(true), input = useRef<{ token: object; handle: TextInputHandle } | null>(null)
	useEffect(() => {
		alive.current = true
		return () => { alive.current = false; pending.current?.abort(); pending.current = null; input.current = null }
	}, [])
	const current = () => alive.current && !closed.current && source.current.revision === revision
	const editable = () => current() && !live.current.isReadOnly && !live.current.filter.isReadOnly
	const composing = () => { try { return !!input.current && hasDateComposition(input.current.handle.native) } catch { return true } }
	const change = (patch: Partial<Draft>) => {
		if (!editable() || pending.current) return
		draft.current = { ...draft.current, ...patch, error: undefined }; rerender((n) => n + 1)
	}
	const token = {}
	const bindInput = (handle: TextInputHandle | null) => {
		if (handle) { if (current()) input.current = { token, handle } }
		else if (input.current?.token === token) input.current = null
	}
	const addEntries = async () => {
		if (!editable() || pending.current || !config || composing()) return
		const owner = new AbortController(), initial = draft.current
		pending.current = owner; rerender((n) => n + 1)
		const options = { ...config, tokenization: config.tokenization ? { ...config.tokenization } : undefined }
		const result = await resolveEntityEntries(initial.text, options, initial.items, owner.signal)
		if (!editable() || owner.signal.aborted || pending.current !== owner || draft.current !== initial) return
		pending.current = null
		draft.current = result.items ? { revision, items: result.items, text: '' } : { ...initial, error: result.error }
		rerender((n) => n + 1)
	}
	const submitted = useRef<Draft | null>(null)
	const save = () => {
		if (!editable() || pending.current || composing() || submitted.current === draft.current) return
		if (draft.current.text.trim()) {
			draft.current = { ...draft.current, error: 'Choose Add entries or clear the pasted text before applying.' }
			rerender((n) => n + 1); return
		}
		const saved = draft.current
		submitted.current = saved
		try { live.current.onSave({ field: props.field.key, operator: props.operator.key, value: { type: 'entity_list', value: entityValue(saved.items) } }) }
		catch (error) { if (submitted.current === saved) submitted.current = null; throw error }
	}
	const cancel = () => {
		if (!current()) return
		closed.current = true; pending.current?.abort(); pending.current = null
		rerender((n) => n + 1); live.current.onCancel()
	}
	const blocked = readOnly || !!pending.current || closed.current

	<masonview className="vx-power-search-entity-editor">
		<label text={`${props.field.label} · Select items`} />
		<Tokenizer label={props.field.label} searchSource={config?.searchSource ?? emptySource} value={draft.current.items}
			onChange={(items) => change({ items: entitySelection(items) })} renderItem={config?.renderItem}
			hasCreate={!!config?.isArbitraryStringAllowed} hasClear hasEntriesOnFocus isDisabled={blocked} />
		@if (!config?.searchSource && !config?.isArbitraryStringAllowed) {
			<label text="No search source is configured. You can remove existing items or clear the selection." />
		}
		@if (config?.tokenization) {
			<masonview className="vx-power-search-entity-bulk">
				<TextInput ref={bindInput} label="Paste entries, then choose Add entries" value={draft.current.text}
					onChange={(text) => change({ text })} isDisabled={blocked} />
				<Button label="Add entries" clickAction={addEntries} isDisabled={blocked} />
			</masonview>
		}
		@if (pending.current) { <label text="Looking up entries…" accessibilityLiveRegion="polite" /> }
		@if (draft.current.error) { <label text={draft.current.error} accessibilityLiveRegion="polite" /> }
		<masonview className="vx-power-search-entity-actions">
			<Button label="Cancel" variant="ghost" clickAction={cancel} />
			<Button label={props.saveButtonLabel ?? 'Apply'} variant="primary" clickAction={save} isDisabled={blocked} />
		</masonview>
	</masonview>
}
<style>
	.vx-power-search-entity-editor, .vx-power-search-entity-bulk { display: flex; flex-direction: column; gap: 8; }
	.vx-power-search-entity-actions { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8; }
</style>
