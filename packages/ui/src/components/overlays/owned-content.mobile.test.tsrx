/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import { createContext, useContext, useState } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { createContentOwner } from './owned-content'
import { useOwnedContent } from './use-owned-content'

vi.mock('../../internal/platform/native-portal', () => ({ createPortal: (children: any) => children }))
const Name = createContext('missing')
const Provider: any = Name
let content: ReturnType<typeof useOwnedContent>
let setName: (name: string) => void
const observed: string[] = []
function Child() {
	const name = useContext(Name)
	observed.push(name)
	return <label text={name} />
}

function Case() {
	const [name, update] = useState('Avery')
	setName = update
	content = useOwnedContent()
	return <Provider value={name}>{content.element}</Provider>
}

const settle = async () => {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

describe('owned content outlets', () => {
	it('renders under the outlet provider, updates live, and releases only its own entry', async () => {
		const root = createUniversalRoot(
			createObjectContainer('nativescript'),
			createObjectDriver('nativescript'),
		)

		root.render(Case, {})
		await settle()
		const onDispose = vi.fn()
		const first = content.owner.createRoot({}, onDispose)
		const second = content.owner.createRoot({})
		const committed = vi.fn()
		first.render(Child)
		first.whenCommitted(committed)
		second.render(Child)
		await settle()
		expect(observed.at(-1)).toBe('Avery')
		expect(committed).toHaveBeenCalledTimes(1)
		setName('Jordan')
		await settle()
		expect(observed.at(-1)).toBe('Jordan')
		first.unmount()
		await settle()
		expect(content.owner.entries.getSnapshot()).toHaveLength(1)
		expect(onDispose).not.toHaveBeenCalled()
		root.unmount()
		await settle()
		expect(content.owner.entries.getSnapshot()).toHaveLength(0)
	})

	it('cancels a pending commit and settles all live owner cleanup once', () => {
		const owner = createContentOwner()
		const close = vi.fn()
		const root = owner.createRoot({}, close)
		const committed = vi.fn()
		root.render(Child)
		root.whenCommitted(committed)
		const entry = owner.entries.getSnapshot()[0]
		owner.dispose()
		owner.dispose()
		entry.committed()
		expect(committed).not.toHaveBeenCalled()
		expect(close).toHaveBeenCalledTimes(1)
		expect(() => owner.createRoot({})).toThrow(/removed/)
	})
})
