/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { CheckboxGroup } from './CheckboxGroup.macos.tsrx'
import { CheckboxListItem } from './CheckboxListItem.macos.tsrx'
import { CheckboxListContext } from './option-list-contexts'
import { FormField } from './FormField.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, rows: () => all().filter((node) => node.props?.accessibilityRole === 'checkbox') }
}

it('options/children share one set and retain metadata/hosts across validation changes', () => {
	const changes: string[][] = []
	function Fixture(props: any) {
		return <CheckboxGroup {...props} options={[{ value: 'a', label: 'Alpha', description: 'First', endContent: <label text="Free" /> }]}>
			<CheckboxListItem value="b" label="Beta" description="Second" />
		</CheckboxGroup>
	}
	const onValueChange = (value: string[]) => changes.push(value)
	const env = mount(Fixture, { label: 'Features', onValueChange })
	try {
		const [alpha, beta] = env.rows()
		alpha.props.onTap(); beta.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([['a'], ['a', 'b']])
		expect(env.rows().every((row) => row.props.accessibilityState.checked === true)).toBe(true)
		expect(env.all().map((node) => node.props?.text)).toEqual(expect.arrayContaining(['Features', 'First', 'Free', 'Second']))
		env.render({ label: 'Updated features', status: { type: 'error', message: 'Choose one' }, hasDividers: true, onValueChange })
		expect(env.rows()).toEqual([alpha, beta])
		expect(alpha.props.accessibilityState.checked).toBe(true)
		expect(beta.props.accessibilityHint).toBe('Second')
		expect(env.all().some((node) => String(node.props?.className).includes('vx-checkbox-group--divided'))).toBe(true)
	} finally { env.root.unmount() }
})

it('does not duplicate values from repeated membership requests in one handler', () => {
	function AddTwice() @{
		const group = useContext(CheckboxListContext)
		<masonview id="add" onTap={() => { group?.select?.('a', true); group?.select?.('a', true) }} />
	}
	function Fixture(props: any) {
		return <CheckboxGroup {...props}><AddTwice /><CheckboxListItem value="a" label="Alpha" /></CheckboxGroup>
	}
	const changes: string[][] = []
	const env = mount(Fixture, { onValueChange: (value: string[]) => changes.push(value) })
	try {
		env.all().find((node) => node.props?.id === 'add').props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([['a']])
		expect(env.rows()[0].props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
})

it('controlled values wait for feedback and Field state blocks members and standalone rows', () => {
	const changes = vi.fn()
	function Fixture(props: any) {
		return <FormField label="Features" isDisabled={props.disabled} isReadOnly={props.readonly}>
			<CheckboxGroup value={props.value} defaultValue={['a']} onValueChange={changes} options={[{ value: 'a', label: 'Alpha' }]}>
				<CheckboxListItem label="All" isChecked="indeterminate" onCheck={changes} />
			</CheckboxGroup>
		</FormField>
	}
	const env = mount(Fixture, { value: [] })
	try {
		env.rows()[0].props.onTap(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenCalledWith(['a'])
		expect(env.rows()[0].props.accessibilityState.checked).toBe(false)
		for (const state of [{ disabled: true }, { readonly: true }]) {
			env.render({ ...state, value: [] })
			expect(env.rows().every((row) => row.props.onTap === undefined)).toBe(true)
		}
		expect(env.all().map((node) => node.props?.text).filter((text) => text === 'Features')).toHaveLength(1)
	} finally { env.root.unmount() }
})

it('standalone mixed rows request true then follow explicit checked feedback', () => {
	const changes: boolean[] = [], onCheck = (checked: boolean) => changes.push(checked)
	const env = mount(CheckboxListItem, { label: 'All', isChecked: 'indeterminate', onCheck, className: ['one', { two: true }] })
	try {
		const row = env.rows()[0]
		expect(row.props.accessibilityState.checked).toBe('mixed')
		expect(row.props.className).toContain('one two')
		row.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true])
		expect(row.props.accessibilityState.checked).toBe('mixed')
		env.render({ label: 'All', isChecked: true, onCheck })
		row.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual([true, false])
	} finally { env.root.unmount() }
})
