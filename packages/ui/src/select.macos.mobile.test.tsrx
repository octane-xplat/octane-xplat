/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Select } from './Select.macos.tsrx'
import { SelectView } from './SelectView.macos.tsrx'
import { SelectMenu } from './aliases.macos.tsrx'

// Render the child surface inline to inspect state/host contracts only.
// This intentionally does not exercise NSPopover roots or OS focus/input.
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => props.open ? <masonview>{props.children}</masonview> : null }))
const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', isDisabled: true }, { value: 'c', label: 'Gamma' }]
function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, byID: (id: string) => all().find((node) => node.props?.id === id) }
}
function viewProps(overrides: any = {}) {
	return { id: 'choice', options, open: true, query: '', selected: ['a'], groups: [{ options }], shown: options,
		enabled: [options[0], options[2]], selectAllState: 'indeterminate', pending: false, triggerText: 'Alpha',
		emptyText: 'Empty', announcement: '', onOpenChange: vi.fn(), onQueryChange: vi.fn(), onPick: vi.fn(),
		onClear: vi.fn(), onSelectAll: vi.fn(), ...overrides }
}
function deferred() {
	let resolve!: () => void, reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}

it('passes multiple mode/preset into checkbox/select-all presentation and selects enabled values as an array', async () => {
	const changes = vi.fn()
	const env = mount(Select, { id: 'choice', options, selectionMode: 'multiple', defaultValue: ['a'], defaultOpen: true,
		hasSelectAll: true, onValueChange: changes })
	try {
		const all = env.byID('choice-select-all')
		expect(all.props.accessibilityState.checked).toBe('mixed')
		expect(env.byID('choice-option-a').props.accessibilityRole).toBe('checkbox')
		expect(env.byID('choice-option-b').props.onTap).toBeUndefined()
		all.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenCalledWith(['a', 'c'])
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.byID('choice-option-c').props.disabled).toBeFalsy() })
		expect(env.byID('choice-select-all').props.accessibilityState.checked).toBe(true)
		expect(env.byID('choice-option-c').props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
	const preset = mount(SelectMenu, { id: 'preset', options, defaultValue: ['a'], defaultOpen: true, hasSelectAll: true })
	try { expect(preset.byID('preset-select-all').props.accessibilityState.checked).toBe('mixed') }
	finally { preset.root.unmount() }
})

it('pending commits make option hosts inert and rejection restores the previous uncontrolled choice', async () => {
	const task = deferred(), error = new Error('save failed'), changes = vi.fn(), errors = vi.fn(), action = vi.fn(() => task.promise)
	const env = mount(Select, { id: 'choice', options, defaultValue: 'a', open: true,
		onValueChange: changes, changeAction: action, onChangeError: errors })
	try {
		const gamma = env.byID('choice-option-c'), pick = gamma.props.onTap
		pick(); pick(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledTimes(1)
		expect(action).toHaveBeenCalledWith('c')
		expect(gamma.props.onTap).toBeUndefined()
		expect(gamma.props.disabled).toBe(true)
		expect(gamma.props.accessibilityState.checked).toBe(true)
		task.reject(error)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(errors).toHaveBeenCalledWith(error) })
		expect(changes.mock.calls.map((call) => call[0])).toEqual(['c', 'a'])
		expect(env.byID('choice-option-a').props.accessibilityState.checked).toBe(true)
		expect(env.byID('choice-option-c')).toBe(gamma)
	} finally { env.root.unmount() }
})

it('custom row/value renderers preserve native text hosts and unknown selections use the summary fallback', () => {
	const renderOption = vi.fn((option: any) => option.value === 'a' ? 'Custom Alpha' : <label id={`custom-${option.value}`} text={option.label} />)
	const renderValue = vi.fn((option: any) => <label id="custom-value" text={`Selected ${option.label}`} />)
	const base = viewProps({ renderOption, renderValue })
	const env = mount(SelectView, base)
	try {
		expect(renderOption).toHaveBeenCalledWith(options[0])
		expect(renderValue).toHaveBeenCalledWith(options[0])
		expect(env.byID('custom-value').props.text).toBe('Selected Alpha')
		expect(env.byID('custom-c').props.text).toBe('Gamma')
		expect(env.byID('choice-option-a').props.accessibilityRole).toBe('radio')
		expect(env.byID('choice-option-a').props.accessibilityState.checked).toBe(true)
		env.render({ ...base, selected: ['missing'], triggerText: 'Unlisted value' })
		expect(env.byID('custom-value')).toBeUndefined()
		expect(env.all().some((node) => node.props?.text === 'Unlisted value')).toBe(true)
		const withIcon = [{ ...options[0], icon: <label id="default-icon" text="Icon" /> }, options[1]]
		env.render(viewProps({ options: withIcon, groups: [{ options: withIcon }], shown: withIcon }))
		expect(env.byID('default-icon')).toBeDefined()
	} finally { env.root.unmount() }
})

it('read-only/pending raw views block all selection hosts and report expanded/busy metadata', () => {
	const base = viewProps({ multiple: true, hasSelectAll: true, isReadOnly: true })
	const env = mount(SelectView, base)
	try {
		expect(env.byID('choice').props.onTap).toBeUndefined()
		expect(env.byID('choice').props.accessibilityState.expanded).toBe(true)
		expect(env.byID('choice-select-all').props.onTap).toBeUndefined()
		expect(env.byID('choice-option-a').props.onTap).toBeUndefined()
		env.render({ ...base, isReadOnly: false, pending: true })
		expect(env.byID('choice').props.accessibilityState.busy).toBe(true)
		expect(env.byID('choice-select-all').props.onTap).toBeUndefined()
		expect(env.byID('choice-option-a').props.onTap).toBeUndefined()
		expect(base.onPick).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
