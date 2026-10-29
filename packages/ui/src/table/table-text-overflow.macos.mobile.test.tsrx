/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { useState } from 'octane'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Table } from './Table.macos.tsrx'
import { tableSlot } from './table-slot'

// Object-driver source contract only; no AppKit sizing, painting or OS input.
function mount(props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(Table, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const bodyText = () => all().filter(node => node.props?.className === 'vx-table-cell-text--appkit')
	render(props)
	return { root, render, all, bodyText }
}

it('default body labels retain full text and native hosts across wrap/truncate/removal', () => {
	const data = [{ id: '1', name: 'A complete long title '.repeat(8) }], columns = [{ key: 'name', header: 'Name' }]
	const env = mount({ data, columns, idKey: 'id' })
	try {
		const label = env.bodyText()[0]
		expect(label.props.text).toBe(data[0].name)
		expect(label.props).toMatchObject({ whiteSpace: 'normal', textOverflow: 'clip' })
		expect(label.props.maxLines).toBeUndefined()
		env.render({ data, columns, idKey: 'id', textOverflow: 'truncate' })
		expect(env.bodyText()[0]).toBe(label)
		expect(label.props).toMatchObject({ maxLines: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', text: data[0].name })
		env.render({ data, columns, idKey: 'id', textOverflow: 'wrap' })
		expect(env.bodyText()[0]).toBe(label)
		expect(label.props.maxLines).toBeUndefined()
		expect(label.props.whiteSpace).toBe('normal')
		env.render({ data, columns, idKey: 'id' })
		expect(env.bodyText()[0]).toBe(label)
		expect(label.props.textOverflow).toBe('clip')
	} finally { env.root.unmount() }
})

it('table overflow governs default body text without overriding headers or custom primitive renderers', () => {
	const data = [{ id: '1', name: 'Ada', note: 'Custom full note' }]
	const columns = [{ key: 'name', header: 'Name' }, { key: 'note', header: 'Notes', renderCell: (row: any) => row.note }]
	const env = mount({ data, columns, textOverflow: 'truncate' })
	try {
		expect(env.bodyText().map(node => node.props.text)).toEqual(['Ada'])
		for (const text of ['Name', 'Notes', data[0].note]) {
			const label = env.all().find(node => node.type === 'label' && node.props?.text === text)
			expect(label).toBeDefined()
			expect(label.props.maxLines).toBeUndefined()
			expect(label.props.whiteSpace).toBeUndefined()
			expect(label.props.textOverflow).toBeUndefined()
		}
	} finally { env.root.unmount() }
})

function StatefulCell() {
	const [count, setCount] = useState(0)
	return <button id="custom-counter" title={`Count ${count}`} onTap={() => setCount(count + 1)} />
}
it('custom slot content keeps its owner and local state while sibling default overflow changes', () => {
	const data = [{ id: '1', name: 'Ada', actions: '' }]
	const columns = [{ key: 'name' }, { key: 'actions', renderCell: () => tableSlot(StatefulCell) }]
	const env = mount({ data, columns, textOverflow: 'wrap' })
	try {
		const counter = env.all().find(node => node.props?.id === 'custom-counter')
		counter.props.onTap(); flushUniversalSync(() => {})
		expect(counter.props.title).toBe('Count 1')
		env.render({ data, columns, textOverflow: 'truncate' })
		expect(env.all().find(node => node.props?.id === 'custom-counter')).toBe(counter)
		expect(counter.props.title).toBe('Count 1')
		expect(counter.props.maxLines).toBeUndefined()
		expect(env.bodyText()[0].props.textOverflow).toBe('ellipsis')
	} finally { env.root.unmount() }
})

it('changing between default and custom text clears table-owned overflow on the retained label', () => {
	const data = [{ id: '1', name: 'Ada' }], columns: any[] = [{ key: 'name' }]
	const env = mount({ data, columns, idKey: 'id', textOverflow: 'truncate' })
	try {
		const label = env.bodyText()[0]
		env.render({ data, columns: [{ key: 'name', renderCell: () => 0 }], idKey: 'id', textOverflow: 'truncate' })
		expect(env.all().find(node => node === label)).toBe(label)
		expect(label.props.text).toBe('0')
		expect(label.props.className).toBeUndefined()
		expect(label.props.maxLines).toBeUndefined()
		expect(label.props.whiteSpace).toBeUndefined()
		expect(label.props.textOverflow).toBeUndefined()
		env.render({ data, columns, idKey: 'id', textOverflow: 'truncate' })
		expect(env.bodyText()[0]).toBe(label)
		expect(label.props).toMatchObject({ text: 'Ada', maxLines: 1, textOverflow: 'ellipsis' })
	} finally { env.root.unmount() }
})
