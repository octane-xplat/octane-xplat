/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.macos.tsrx'
import type { PowerSearchConfig, SearchableItem } from '../../props'

// Preserve exact editor closures with mock children. These cases do not exercise
// native Tokenizer search/input, Button, TextInput, OS focus, IME or accessibility.
const tokenizer = vi.hoisted(() => ({ props: null as any }))
vi.mock('./Tokenizer.macos.tsrx', () => ({ Tokenizer: (props: any) => { tokenizer.props = props; return <masonview /> } }))
vi.mock('./text-controls.macos.tsrx', () => ({ TextInput: (props: any) => <textfield ref={(view: any) => props.ref?.(view ? { native: view, focus() {}, blur() {} } : null)} text={props.value} onTextChange={props.onChange} /> }))
vi.mock('../actions/controls.macos.tsrx', () => ({ Button: (props: any) => <button text={props.label} onTap={props.clickAction} isEnabled={!props.isDisabled} /> }))
vi.mock('./SegmentedControl.macos.tsrx', () => ({ SegmentedControl: () => <masonview /> }))
function mount(search = vi.fn((q: string) => Promise.resolve([{ id: q, label: q }]))) {
	const config: PowerSearchConfig = { name: 'entities', fields: [{ key: 'owner', label: 'Owner', operators: [{ key: 'is', label: 'Is', value: {
		type: 'entity_list', searchSource: { search, bootstrap: () => [] }, tokenization: {}, renderItem: (item) => item.label,
	} }] }] }
	const filter = () => ({ field: 'owner', operator: 'is', value: { type: 'entity_list', value: [{ id: 'kept', label: 'Kept' }] } })
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const base = { config, filter: filter(), mode: 'edit', onSave: vi.fn(), onCancel: vi.fn() }
	const all = (): any[] => { const visit = (node: any): any[] => [node, ...(node.children?.flatMap(visit) ?? [])]; return container.children.flatMap(visit) }
	const button = (label: string) => all().find((node) => node.type === 'button' && node.props?.text === label)?.props.onTap
	const input = () => all().find((node) => node.type === 'textfield')
	const render = (props: any) => flushUniversalSync(() => root.render(PowerSearchFilterEditor, props))
	const flush = () => flushUniversalSync(() => {})
	render(base)
	return { root, base, filter, config, render, flush, button, input }
}
it('routes searched selection/custom rows, keeps rapid changes and submits only public data once per draft', () => {
	const f = mount()
	try {
		const value = f.config.fields[0].operators[0].value
		if (value.type !== 'entity_list') throw Error('Expected entity operator')
		expect(tokenizer.props.searchSource).toBe(value.searchSource)
		expect(tokenizer.props.renderItem).toBe(value.renderItem)
		tokenizer.props.onChange([{ id: 'a', label: 'A', photo: 'local', auxiliaryData: { private: true } }])
		f.button('Apply')(); f.button('Apply')()
		expect(f.base.onSave).toHaveBeenCalledTimes(1)
		expect(f.base.onSave.mock.calls[0][0].value).toEqual({ type: 'entity_list', value: [{ id: 'a', label: 'A', photo: 'local' }] })
		tokenizer.props.onChange([]); f.button('Apply')(); expect(f.base.onSave.mock.calls[1][0].value.value).toEqual([])
	} finally { f.root.unmount() }
})
it('bulk input waits for marked text and explicit Add; Apply never drops unprocessed input', async () => {
	const f = mount()
	try {
		const input = f.input(), add = f.button('Add entries'), apply = f.button('Apply')
		input.props.onTextChange('A,B'); apply(); expect(f.base.onSave).not.toHaveBeenCalled()
		input.currentEditor = () => ({ hasMarkedText: true }); await add(); expect(tokenizer.props.searchSource.search).not.toHaveBeenCalled()
		input.currentEditor = () => ({ hasMarkedText: false }); await add(); f.flush(); apply()
		expect(f.base.onSave.mock.calls[0][0].value.value.map((item: SearchableItem) => item.id)).toEqual(['kept', 'A', 'B'])
		expect(f.input().props.text).toBe('')
	} finally { f.root.unmount() }
})
it('keeps the draft atomic, blocks repeats/edits during pending work and aborts on Cancel', async () => {
	let finish!: (items: SearchableItem[]) => void
	const search = vi.fn((_q: string) => new Promise<SearchableItem[]>((resolve) => { finish = resolve })), f = mount(search)
	try {
		f.input().props.onTextChange('A,B'); const add = f.button('Add entries'), job = add()
		await add(); f.button('Apply')(); tokenizer.props.onChange([])
		expect(search).toHaveBeenCalledTimes(1); expect(f.base.onSave).not.toHaveBeenCalled()
		const request = (search.mock.calls[0] as any[])[1]
		f.button('Cancel')(); expect(request.signal.aborted).toBe(true)
		finish([{ id: 'A', label: 'A' }]); await job; f.flush()
		expect(search).toHaveBeenCalledTimes(1); expect(f.base.onCancel).toHaveBeenCalledTimes(1); expect(tokenizer.props.value).toEqual([{ id: 'kept', label: 'Kept' }])
	} finally { f.root.unmount() }
})
it('readonly, filter/source replacement and unmount retire outstanding work and held callbacks', async () => {
	for (const reason of ['readonly', 'filter', 'source', 'unmount']) {
		let finish!: (items: SearchableItem[]) => void
		const search = vi.fn((_q: string) => new Promise<SearchableItem[]>((resolve) => { finish = resolve })), f = mount(search)
		try {
			const change = tokenizer.props.onChange, apply = f.button('Apply')
			f.input().props.onTextChange('A'); const job = f.button('Add entries')()
			if (reason === 'readonly') f.render({ ...f.base, isReadOnly: true })
			if (reason === 'filter') f.render({ ...f.base, filter: f.filter() })
			if (reason === 'source') {
				const field = f.config.fields[0], operator = field.operators[0]
				f.render({ ...f.base, config: { ...f.config, fields: [{ ...field, operators: [{ ...operator, value: { ...operator.value, searchSource: { search: () => [], bootstrap: () => [] } } }] }] } })
			}
			if (reason === 'unmount') f.root.unmount()
			expect(((search.mock.calls[0] as any[])[1]).signal.aborted).toBe(true)
			finish([{ id: 'A', label: 'A' }]); await job; f.flush(); change([]); apply()
			expect(f.base.onSave).not.toHaveBeenCalled()
		} finally { f.root.unmount() }
	}
})
it('consumer save failures release the submit claim for retry', () => {
	const f = mount()
	try {
		const save = f.button('Apply'); f.base.onSave.mockImplementationOnce(() => { throw Error('consumer') })
		expect(() => save()).toThrow('consumer'); save(); expect(f.base.onSave).toHaveBeenCalledTimes(2)
	} finally { f.root.unmount() }
})
