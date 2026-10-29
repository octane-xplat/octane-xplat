/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { PowerSearchFilterEditor } from './PowerSearchFilterEditor.macos.tsrx'
import type { PowerSearchConfig } from './props'
// Mock child controls to retain the editor's exact callbacks. This covers
// editor ownership, not TextInput/Button native event translation or input.
vi.mock('./text-controls.macos.tsrx', () => ({ TextInput: (props: any) => <textfield ref={(view: any) => props.ref?.(view ? { native: view, focus() {}, blur() {} } : null)} text={props.value} onTextChange={props.onChange} /> }))
vi.mock('./controls.macos.tsrx', () => ({ Button: (props: any) => <button text={props.label} onPress={props.clickAction} isEnabled={!props.isDisabled} /> }))
vi.mock('./SegmentedControl.macos.tsrx', () => ({ SegmentedControl: () => <masonview /> }))
vi.mock('./Tokenizer.macos.tsrx', () => ({ Tokenizer: () => <masonview /> }))
const config: PowerSearchConfig = { name: 'range', fields: [{ key: 'created', label: 'Created', operators: [
	{ key: 'between', label: 'Between', value: { type: 'date_range', intervalDatePresets: [{ label: 'Last week', value: { start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' } } }] } },
] }] }
const filter = () => ({ field: 'created', operator: 'between', value: { type: 'date_range', value: { start: { type: 'ABSOLUTE', unixSeconds: 0 }, end: { type: 'ABSOLUTE', unixSeconds: 86400 } } } })
function mount() {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const base = { config, filter: filter(), mode: 'edit', onSave: vi.fn(), onCancel: vi.fn() }
	const all = (): any[] => { const visit = (node: any): any[] => [node, ...(node.children?.flatMap(visit) ?? [])]; return container.children.flatMap(visit) }
	const button = (label: string) => all().find((node) => node.type === 'button' && node.props?.text === label)?.props.onPress
	const fields = () => all().filter((node) => node.type === 'textfield')
	const render = (props: any) => flushUniversalSync(() => root.render(PowerSearchFilterEditor, props))
	const flush = () => flushUniversalSync(() => {})
	render(base)
	return { root, base, render, flush, fields, button, all }
}
it('routes the default editor into a range form, retains rapid endpoint edits and saves once per draft', () => {
	const f = mount()
	try {
		const fields = f.fields(), apply = f.button('Apply')
		expect(fields).toHaveLength(2)
		fields[0].props.onTextChange('2026-01-02'); fields[1].props.onTextChange('2026-01-04')
		fields[0].currentEditor = () => ({ hasMarkedText: true }); apply(); expect(f.base.onSave).not.toHaveBeenCalled()
		fields[0].currentEditor = () => ({ hasMarkedText: false }); apply(); apply(); f.flush()
		expect(f.base.onSave).toHaveBeenCalledTimes(1)
		expect(f.base.onSave.mock.calls[0][0].value).toEqual({ type: 'date_range', value: { start: { type: 'ABSOLUTE', unixSeconds: Date.parse('2026-01-02T00:00:00Z') / 1000 }, end: { type: 'ABSOLUTE', unixSeconds: Date.parse('2026-01-04T00:00:00Z') / 1000 } } })
		f.fields()[0].props.onTextChange('invalid'); f.flush(); apply(); expect(f.base.onSave).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('current readonly/filter replacement/unmount retire held callbacks without resurrecting old drafts', () => {
	const f = mount(), old = f.base.filter
	try {
		const held = f.fields()[0].props.onTextChange, apply = f.button('Apply')
		f.render({ ...f.base, isReadOnly: true }); held('2026-01-02'); apply(); expect(f.base.onSave).not.toHaveBeenCalled()
		f.render({ ...f.base, filter: filter() }); held('2026-01-03'); apply(); expect(f.base.onSave).not.toHaveBeenCalled()
		f.render({ ...f.base, filter: old }); expect(f.fields()[0].props.text).toBe('1970-01-01T00:00:00.000Z')
		const save = f.button('Apply'); f.root.unmount(); save(); expect(f.base.onSave).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('interval presets retain semantic relative parts, Cancel does not save, and consumer errors allow retry', () => {
	const f = mount()
	try {
		f.button('Last week')(); f.flush(); const apply = f.button('Apply')
		f.base.onSave.mockImplementationOnce(() => { throw Error('consumer failed') })
		expect(() => apply()).toThrow('consumer failed'); apply()
		expect(f.base.onSave).toHaveBeenCalledTimes(2)
		expect(f.base.onSave.mock.calls[1][0].value.value).toEqual({ start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' } })
		f.button('Cancel')(); expect(f.base.onCancel).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
