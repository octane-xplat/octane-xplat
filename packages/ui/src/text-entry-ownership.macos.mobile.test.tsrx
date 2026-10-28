/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TextInput, TextArea } from './text-controls.macos.tsrx'
import { SearchInput } from './controls.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
const controls = [TextInput, TextArea]
function mount(Control: any = TextInput, extra: any = {}, inherited = false) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const window: any = { firstResponder: null, makeFirstResponder: vi.fn((view: any) => { window.firstResponder = view; return true }) }
	const ref = { current: null as any }, base = { defaultValue: 'initial', label: 'Name', ref, onChange: vi.fn(), onSubmit: vi.fn(), onClear: vi.fn(), returnKeyType: 'send', hasClear: true, ...extra }
	function Fixture(props: any) { return inherited ? <FormField label="Name" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}><Control {...props} isDisabled={undefined} isReadOnly={undefined} /></FormField> : <Control {...props} /> }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const field = () => all().find((node) => node.type === (Control === TextArea ? 'textview' : 'textfield'))
	const clear = () => all().find((node) => String(node.props?.className).split(' ').includes('vx-input-clear'))
	const flush = () => { flushUniversalSync(() => {}); if (field()) { field().window = window; field().currentEditor ??= () => null } }
	const render = (props: any) => { flushUniversalSync(() => root.render(Fixture, props)); flush() }
	render(base)
	return { root, base, render, flush, field, clear, window, ref }
}
it('retained edits honor current inherited blocking and callback/value replacement, then become inert after teardown', () => {
	for (const Control of controls) {
		const f = mount(Control, {}, true), edit = f.field().props.onTextChange, notify = vi.fn()
		try {
			for (const state of [{ isDisabled: true }, { isReadOnly: true }]) { f.render({ ...f.base, ...state, onChange: notify }); edit('blocked'); f.flush(); expect(f.field().props.value).toBe('initial') }
			expect(notify).not.toHaveBeenCalled(); expect(f.base.onChange).not.toHaveBeenCalled()
			f.render({ ...f.base, value: 'server', onChange: notify }); edit('request'); f.flush(); expect(notify).toHaveBeenCalledWith('request'); expect(f.field().props.value).toBe('server')
			f.root.unmount(); edit('retired'); expect(notify).toHaveBeenCalledTimes(1)
		} finally { f.root.unmount() }
	}
})
it('rapid uncontrolled edits use current local text and reject change/submit callback reentry', () => {
	for (const Control of controls) {
		const f = mount(Control), edit = f.field().props.onTextChange, submit = f.field().props.onSubmit
		const change = vi.fn(() => { edit('nested'); submit() }), accepted = vi.fn(() => { edit('nested'); submit() })
		try {
			f.render({ ...f.base, onChange: change, onSubmit: accepted }); edit('first'); edit('second'); f.flush()
			expect(change).toHaveBeenCalledTimes(2); expect(f.field().props.value).toBe('second'); expect(accepted).not.toHaveBeenCalled()
			submit(); expect(accepted).toHaveBeenCalledTimes(1); expect(change).toHaveBeenCalledTimes(2)
		} finally { f.root.unmount() }
	}
})
it('marked direct text views and field editors report draft edits but suppress submit until composition ends', () => {
	for (const Control of controls) {
		const f = mount(Control), submit = f.field().props.onSubmit, marked: any = { hasMarkedText: true }
		try {
			if (Control === TextArea) f.field().hasMarkedText = () => marked.hasMarkedText
			else f.field().currentEditor = () => marked
			f.field().props.onTextChange('marked draft'); f.flush(); submit(); expect(f.base.onChange).toHaveBeenCalledWith('marked draft'); expect(f.base.onSubmit).not.toHaveBeenCalled()
			marked.hasMarkedText = false; submit(); expect(f.base.onSubmit).toHaveBeenCalledTimes(1)
		} finally { f.root.unmount() }
	}
})
it('retained multiline submit obeys current return-key policy and latest callback', () => {
	const f = mount(TextArea), submit = f.field().props.onSubmit, latest = vi.fn()
	try {
		f.render({ ...f.base, returnKeyType: 'next', onSubmit: latest }); submit(); expect(latest).not.toHaveBeenCalled(); expect(f.field().props.onSubmit).toBeUndefined()
		f.render({ ...f.base, returnKeyType: 'done', onSubmit: latest }); submit(); expect(latest).toHaveBeenCalledTimes(1); expect(f.base.onSubmit).not.toHaveBeenCalled()
		f.render({ ...f.base, isReadOnly: true, onSubmit: latest }); submit(); expect(latest).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('live public handles follow ref replacement, current disabled state and native focus ownership', () => {
	for (const Control of controls) {
		const f = mount(Control), held = f.ref.current, replacement = { current: null as any }
		try {
			f.render({ ...f.base, ref: replacement }); expect(f.ref.current).toBe(null); expect(replacement.current).toBe(held); expect(held.native).toBe(f.field())
			held.focus(); expect(f.window.firstResponder).toBe(f.field()); const other = {}; f.window.firstResponder = other; held.blur(); expect(f.window.firstResponder).toBe(other)
			f.render({ ...f.base, ref: replacement, isDisabled: true }); held.focus(); expect(f.window.firstResponder).toBe(other)
			f.render({ ...f.base, ref: replacement, isReadOnly: true }); f.field().hidden = true; held.focus(); expect(f.window.firstResponder).toBe(other)
			f.field().hidden = false; f.field().isEnabled = () => false; held.focus(); expect(f.window.firstResponder).toBe(other)
			delete f.field().isEnabled; held.focus(); expect(f.window.firstResponder).toBe(f.field())
			const editor = {}; f.field().currentEditor = () => editor; f.window.firstResponder = editor; held.blur(); expect(f.window.firstResponder).toBe(null)
			f.root.unmount(); const count = f.window.makeFirstResponder.mock.calls.length; held.focus(); held.blur(); expect(held.native).toBe(null); expect(f.window.makeFirstResponder).toHaveBeenCalledTimes(count)
		} finally { f.root.unmount() }
	}
})
it('held clear rejects current blocking, removed affordances, marked editors and already empty local text', () => {
	const f = mount(), clear = f.clear().props.onTap
	try {
		for (const state of [{ isDisabled: true }, { isReadOnly: true }, { hasClear: false }]) { f.render({ ...f.base, ...state }); clear() }
		expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.base.onClear).not.toHaveBeenCalled()
		f.render(f.base); const editor: any = { hasMarkedText: () => true }; f.field().currentEditor = editor; clear(); expect(f.base.onChange).not.toHaveBeenCalled()
		editor.hasMarkedText = false; clear(); clear(); f.flush(); expect(f.base.onChange).toHaveBeenCalledTimes(1); expect(f.base.onClear).toHaveBeenCalledTimes(1); expect(f.field().props.value).toBe('')
	} finally { f.root.unmount() }
})
it('an accepted clear captures its callback pair and rejects nested actions across parent replacement or teardown', () => {
	for (const unmount of [false, true]) {
		const f = mount(), clear = f.clear().props.onTap, edit = f.field().props.onTextChange, trace: string[] = [], replacement = vi.fn()
		const original = vi.fn(() => { trace.push('clear'); clear(); edit('nested') })
		try {
			f.render({ ...f.base, onChange: () => { trace.push('change'); clear(); edit('nested'); if (unmount) f.root.unmount(); else f.render({ ...f.base, value: 'corrected', onClear: replacement }) }, onClear: original })
			clear(); f.flush(); expect(trace).toEqual(['change', 'clear']); expect(original).toHaveBeenCalledTimes(1); expect(replacement).not.toHaveBeenCalled()
			if (unmount) { clear(); expect(f.window.makeFirstResponder).not.toHaveBeenCalled() }
			else expect(f.field().props.value).toBe('corrected')
		} finally { f.root.unmount() }
	}
})
it('clear preserves newer callback-driven focus and avoids resetting an already owned editor', () => {
	for (const reason of ['focus', 'editor', 'blocked']) {
		const f = mount(), clear = f.clear().props.onTap, other = {}, editor = {}
		try {
			if (reason === 'editor') { f.field().currentEditor = () => editor; f.window.firstResponder = editor }
			f.render({ ...f.base, onClear: () => { if (reason === 'focus') f.window.firstResponder = other; if (reason === 'blocked') f.render({ ...f.base, isDisabled: true }) } })
			clear(); expect(f.window.makeFirstResponder).not.toHaveBeenCalled(); if (reason === 'focus') expect(f.window.firstResponder).toBe(other)
		} finally { f.root.unmount() }
	}
})
it('SearchInput uses the same live clear/edit ownership across inherited state changes', () => {
	const f = mount(SearchInput, {}, true), edit = f.field().props.onTextChange, clear = f.clear().props.onTap
	try {
		f.render({ ...f.base, isReadOnly: true }); edit('blocked'); clear(); expect(f.base.onChange).not.toHaveBeenCalled()
		f.render(f.base); edit('search'); f.flush(); expect(f.field().props.value).toBe('search'); clear(); f.flush(); expect(f.field().props.value).toBe(''); expect(f.base.onClear).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
it('callback failure releases the edit claim and current focus/blur handlers retire on teardown', () => {
	const f = mount(), edit = f.field().props.onTextChange, focus = f.field().props.onFocus, blur = f.field().props.onBlur, latest = vi.fn(), onFocus = vi.fn(), onBlur = vi.fn()
	try {
		f.render({ ...f.base, onChange: () => { throw Error('consumer failure') } }); expect(() => edit('first')).toThrow('consumer failure')
		f.render({ ...f.base, onChange: latest, onFocus, onBlur }); edit('second'); focus(); blur(); expect(latest).toHaveBeenCalledWith('second'); expect(onFocus).toHaveBeenCalledTimes(1); expect(onBlur).toHaveBeenCalledTimes(1)
		f.root.unmount(); focus(); blur(); expect(onFocus).toHaveBeenCalledTimes(1); expect(onBlur).toHaveBeenCalledTimes(1)
	} finally { f.root.unmount() }
})
