/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { useState, useEffect } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { SheetContent } from './sheet-content'
let edit = (_value: number) => {},
	retired = 0

function Editing(props: { id: string }) @{
	const [value, setValue] = useState(0)
	edit = setValue
	useEffect(
		() => () => {
			retired++
		},
		[],
	)

	<label text={`${props.id}:${value}`} />
}

function Host(props: { id: string }) @{
	<SheetContent key={props.id}>
		<Editing id={props.id} />
	</SheetContent>
}

it('separates panel editing state while retaining the surrounding presentation', async () => {
	retired = 0
	const container = createObjectContainer('nativescript'),
		root = createUniversalRoot(container, createObjectDriver('nativescript'))

	try {
		root.render(Host, { id: 'first' })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(container.children[0].props.text).toBe('first:0'))
		flushUniversalSync(() => edit(7))
		expect(container.children[0].props.text).toBe('first:7')
		const original = container.children[0]
		root.render(Host, { id: 'second' })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(container.children[0].props.text).toBe('second:0'))
		await vi.waitFor(() => expect(retired).toBe(1))
		expect(container.children[0]).not.toBe(original)
	} finally {
		root.unmount()
		flushUniversalSync(() => {})
	}
})
