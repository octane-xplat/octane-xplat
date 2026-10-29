/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TimeInput } from './TimeInput.macos.tsrx'
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const base = { id: 'time', value: '14:30', hourFormat: '24h', hasClear: true, onChange: vi.fn(), ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const input = () => all().find((node) => node.type === 'textfield')
	const clear = () => all().find((node) => String(node.props?.className).split(' ').includes('vx-timeinput-clear'))?.props.onTap
	const flush = () => flushUniversalSync(() => {})
	const render = (props: any) => { root.render(TimeInput, props); flush() }
	const edit = (text: string) => { input().props.onTextChange(text); flush() }
	const settle = async () => { await Promise.resolve(); flush(); await Promise.resolve(); flush() }
	render(base)
	return { root, base, input, clear, flush, render, edit, settle }
}
it('the existing AppKit composition leaf retains marked drafts and submits only after composition ends', () => {
	for (const method of [false, true]) {
		const f = mount(), editor: any = { hasMarkedText: method ? () => true : true }
		try {
			f.input().currentEditor = method ? () => editor : editor
			f.edit('15:45'); f.input().props.onSubmit(); f.flush(); expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.input().props.value).toBe('15:45')
			editor.hasMarkedText = method ? () => false : false; f.input().props.onSubmit(); f.flush(); expect(f.base.onChange).toHaveBeenCalledWith('15:45')
		} finally { f.root.unmount() }
	}
})
it('current disabled/readonly/loading state prevents held text/submit/clear callbacks from changing an owned draft', () => {
	for (const blocked of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
		const f = mount()
		try {
			f.edit('unfinished'); const edit = f.input().props.onTextChange, submit = f.input().props.onSubmit, clear = f.clear()
			f.render({ ...f.base, ...blocked }); edit('16:00'); submit(); clear(); f.flush()
			expect(f.input().props.value).toBe('unfinished'); expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.input().props.editable).toBe(false)
		} finally { f.root.unmount() }
	}
})
it('an in-flight save blocks draft replacement/commit/clear before and after the busy render', async () => {
	let finish!: () => void
	const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve })), f = mount({ changeAction: action })
	try {
		const edit = f.input().props.onTextChange, submit = f.input().props.onSubmit, clear = f.clear()
		edit('15:45'); edit('16:00'); submit(); clear(); f.flush()
		expect(f.base.onChange).toHaveBeenCalledTimes(1); expect(f.base.onChange).toHaveBeenCalledWith('15:45'); expect(action).toHaveBeenCalledTimes(1); expect(f.input().props.value).toBe('15:45')
		submit(); clear(); f.flush(); expect(f.input().props.value).toBe('15:45')
		finish(); await f.settle(); expect(f.input().props.value).toBe('15:45'); expect(f.input().props.editable).toBe(true)
	} finally { f.root.unmount() }
})
it('held submit/edit callbacks parse the latest pending text, seconds and bounds rather than their old render', () => {
	const f = mount({ min: '14:00', max: '16:00' })
	try {
		const submit = f.input().props.onSubmit, edit = f.input().props.onTextChange, editor = { hasMarkedText: true }
		f.input().currentEditor = () => editor
		f.render({ ...f.base, hasSeconds: true, min: '15:00:00', max: '15:30:59' }); edit('15:15:07'); f.flush(); expect(f.base.onChange).not.toHaveBeenCalled()
		editor.hasMarkedText = false; submit(); f.flush(); expect(f.base.onChange).toHaveBeenLastCalledWith('15:15:07')
		f.base.onChange.mockClear(); edit('14:45:07'); f.flush(); submit(); f.flush(); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('application callback reentry cannot replace or clear the accepted draft', () => {
	const f = mount(); let edit: (text: string) => void, submit: () => void, clear: () => void
	try {
		edit = f.input().props.onTextChange; submit = f.input().props.onSubmit; clear = f.clear()
		const change = vi.fn(() => { edit('16:00'); submit(); clear() }); f.render({ ...f.base, onChange: change })
		f.edit('15:45'); expect(change).toHaveBeenCalledTimes(1); expect(change).toHaveBeenCalledWith('15:45'); expect(f.input().props.value).toBe('15:45')
	} finally { f.root.unmount() }
})
it('submit callback teardown leaves held draft handlers inert and parent correction stays authoritative', () => {
	const f = mount(), editor = { hasMarkedText: true }
	f.input().currentEditor = () => editor; f.edit('15:45'); const submit = f.input().props.onSubmit, edit = f.input().props.onTextChange
	const change = vi.fn(() => f.root.unmount()); f.render({ ...f.base, onChange: change }); editor.hasMarkedText = false; submit(); f.flush(); expect(change).toHaveBeenCalledTimes(1)
	edit('16:00'); submit(); f.flush(); expect(change).toHaveBeenCalledTimes(1)
	const g = mount(), correction = vi.fn(() => g.render({ ...g.base, value: '10:00', onChange: correction }))
	try { g.render({ ...g.base, onChange: correction }); g.edit('15:45'); expect(g.input().props.value).toBe('10:00'); expect(correction).toHaveBeenCalledTimes(1) }
	finally { g.root.unmount() }
})
