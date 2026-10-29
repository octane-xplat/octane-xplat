/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.macos.tsrx'
import type { PowerSearchConfig } from './props'

// Exercise exact scalar editor closures; native child control events remain untested.
vi.mock('./text-controls.macos.tsrx', () => ({ TextInput: (props: any) => <textfield ref={(view: any) => props.ref?.(view ? { native: view, focus() {}, blur() {} } : null)} text={props.value} onTextChange={props.onChange} isEnabled={!props.isDisabled} /> }))
vi.mock('./controls.macos.tsrx', () => ({ Button: (props: any) => <button text={props.label} onPress={props.clickAction} isEnabled={!props.isDisabled} /> }))
vi.mock('./Tokenizer.macos.tsrx', () => ({ Tokenizer: () => <masonview /> }))
vi.mock('./SegmentedControl.macos.tsrx', () => ({ SegmentedControl: () => <masonview /> }))
const config: PowerSearchConfig = { name: 'scalar', fields: [
	{ key: 'title', label: 'Title', operators: [{ key: 'contains', label: 'Contains', value: { type: 'string' } }] },
	{ key: 'year', label: 'Year', defaultOperator: 'bounded', operators: [
		{ key: 'plain', label: 'Is', value: { type: 'integer' } },
		{ key: 'bounded', label: 'At least', value: { type: 'integer', minValue: 0, maxValue: 20, units: 'years' } },
	] },
] }
function mount() {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const filter = () => ({ field: 'year', value: { type: 'integer', value: 10 } })
	const base = { config, filter: filter(), mode: 'edit', onSave: vi.fn(), onCancel: vi.fn() }
	const all = (): any[] => { const visit = (node: any): any[] => [node, ...(node.children?.flatMap(visit) ?? [])]; return container.children.flatMap(visit) }
	const button = (label: string) => all().find((node) => node.type === 'button' && node.props?.text === label)?.props.onPress
	const input = () => all().find((node) => node.type === 'textfield')
	const render = (props: any) => flushUniversalSync(() => root.render(PowerSearchFilterEditor, props))
	const flush = () => flushUniversalSync(() => {})
	render(base)
	return { root, base, filter, all, input, button, render, flush }
}
it('keeps rapid edits, rejects invalid/bounded numbers and claims one valid submission before reentry', () => {
	const f = mount()
	try {
		const change = f.input().props.onTextChange, apply = f.button('Apply')
		for (const text of ['', 'NaN', '1.2', '21']) { change(text); apply() }
		expect(f.base.onSave).not.toHaveBeenCalled()
		change('1'); change('20')
		f.base.onSave.mockImplementationOnce(() => apply()); apply(); apply()
		expect(f.base.onSave).toHaveBeenCalledTimes(1)
		expect(f.base.onSave.mock.calls[0][0]).toEqual({ field: 'year', operator: 'bounded', value: { type: 'integer', value: 20 } })
	} finally { f.root.unmount() }
})
it('filter replacement resets same-type drafts and retires old change/save/cancel callbacks', () => {
	const f = mount()
	try {
		const change = f.input().props.onTextChange, apply = f.button('Apply'), cancel = f.button('Cancel')
		change('19'); f.render({ ...f.base, filter: { field: 'year', value: { type: 'integer', value: 7 } } })
		change('20'); apply(); cancel(); expect(f.input().props.text).toBe('7')
		expect(f.base.onSave).not.toHaveBeenCalled(); expect(f.base.onCancel).not.toHaveBeenCalled()
		f.button('Apply')(); expect(f.base.onSave.mock.calls[0][0].value.value).toBe(7)
		f.render({ ...f.base, filter: { field: 'title', operator: 'contains', value: { type: 'string', value: 'Earthsea' } } })
		f.input().props.onTextChange('Earth'); f.button('Apply')(); expect(f.base.onSave.mock.calls[1][0].value).toEqual({ type: 'string', value: 'Earth' })
	} finally { f.root.unmount() }
})
it('readonly, marked text and unmount prevent direct held scalar saves; consumer errors allow retry', () => {
	const f = mount()
	try {
		const change = f.input().props.onTextChange, apply = f.button('Apply')
		f.render({ ...f.base, isReadOnly: true }); change('12'); apply(); expect(f.base.onSave).not.toHaveBeenCalled()
		f.render({ ...f.base, filter: { ...f.base.filter, isReadOnly: true } }); f.button('Apply')(); expect(f.base.onSave).not.toHaveBeenCalled()
		f.render(f.base)
		const field = f.input(), save = f.button('Apply'); field.currentEditor = () => ({ hasMarkedText: true })
		save(); expect(f.base.onSave).not.toHaveBeenCalled()
		field.currentEditor = () => ({ hasMarkedText: false }); f.base.onSave.mockImplementationOnce(() => { throw Error('consumer') })
		expect(() => save()).toThrow('consumer'); save(); expect(f.base.onSave).toHaveBeenCalledTimes(2)
		f.root.unmount(); change('14'); save(); expect(f.base.onSave).toHaveBeenCalledTimes(2)
	} finally { f.root.unmount() }
})
it('unknown explicit field/operator keys never fall back to a different filter', () => {
	const f = mount()
	try {
		for (const filter of [{ field: 'missing' }, { field: 'year', operator: 'missing' }]) {
			f.render({ ...f.base, filter }); f.button('Apply')()
			expect(f.all().find((node) => node.type === 'button' && node.props.text === 'Apply').props.isEnabled).toBe(false)
		}
		expect(f.base.onSave).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('Cancel closes the scalar session without saving and a replacement can open a fresh draft', () => {
	const f = mount()
	try {
		const apply = f.button('Apply'); f.button('Cancel')(); apply()
		expect(f.base.onCancel).toHaveBeenCalledTimes(1); expect(f.base.onSave).not.toHaveBeenCalled()
		f.render({ ...f.base, filter: f.filter() }); f.button('Apply')(); expect(f.base.onSave).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('absolute date dispatch preserves unchanged instants and rejects invalid calendar drafts', () => {
	const f = mount()
	try {
		const operator = { key: 'before', label: 'Before', value: { type: 'date_absolute' } }
		const dateConfig = { name: 'dates', fields: [{ key: 'created', label: 'Created', operators: [operator] }] }
		const unixSeconds = 1234567890.12345
		f.render({ ...f.base, config: dateConfig, filter: { field: 'created', value: { type: 'date_absolute', unixSeconds } } })
		expect(f.input().props.text).toBe('2009-02-13T23:31:30.123Z')
		f.button('Apply')(); expect(f.base.onSave.mock.calls[0][0].value.unixSeconds).toBe(unixSeconds)
		const change = f.input().props.onTextChange
		change('2023-02-29'); f.button('Apply')(); expect(f.base.onSave).toHaveBeenCalledTimes(1)
		change('2024-02-29T12:30:01.12Z'); f.button('Apply')()
		expect(f.base.onSave.mock.calls[1][0].value.unixSeconds).toBe(Date.parse('2024-02-29T12:30:01.120Z') / 1000)
	} finally { f.root.unmount() }
})
it('absolute date-only reconfiguration retires old callbacks and normalizes the current UTC day', () => {
	const f = mount()
	try {
		const dateConfig = (dateOnly: boolean) => ({ name: 'dates', fields: [{ key: 'created', label: 'Created', operators: [{ key: 'before', label: 'Before', value: { type: 'date_absolute', isDateOnly: dateOnly } }] }] })
		const filter = { field: 'created', value: { type: 'date_absolute', unixSeconds: Date.parse('2026-10-29T12:30:00Z') / 1000 } }
		f.render({ ...f.base, config: dateConfig(false), filter }); const apply = f.button('Apply'), change = f.input().props.onTextChange
		f.render({ ...f.base, config: dateConfig(true), filter }); change('invalid'); apply()
		expect(f.base.onSave).not.toHaveBeenCalled(); expect(f.input().props.text).toBe('2026-10-29')
		f.button('Apply')(); expect(f.base.onSave.mock.calls[0][0].value.unixSeconds).toBe(Date.parse('2026-10-29T00:00:00Z') / 1000)
	} finally { f.root.unmount() }
})
