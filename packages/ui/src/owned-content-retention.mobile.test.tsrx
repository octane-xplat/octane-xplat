/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createContext, useContext, useState } from 'octane'
import {
	createObjectContainer,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { createPortalObjectDriver } from '../tests/portal-object-driver'
import { useOwnedContent } from './use-owned-content.tsrx'
import type { ContentOwner } from './owned-content'

const Person = createContext('missing')
const PersonProvider: any = Person
let owner: ContentOwner
let increment = () => {}
let updatePerson = (_value: string) => {}
let visible = { count: 0, person: '' }
function Counter() {
	const [count, setCount] = useState(0)
	const person = useContext(Person)
	increment = () => setCount((value) => value + 1)
	visible = { count, person }
	return <label text={count + ':' + person} />
}

function App() {
	const content = useOwnedContent()
	const [person, setPerson] = useState('Avery')
	owner = content.owner
	updatePerson = setPerson
	return <PersonProvider value={person}>{content.element}</PersonProvider>
}

async function tick() {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

it('retains a later portal and its context when an earlier owned root is removed', async () => {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createPortalObjectDriver(),
	)

	root.render(App, {})
	await tick()
	const first = owner.createRoot({})
	const second = owner.createRoot({})
	try {
		first.render(Counter)
		second.render(Counter)
		await tick()
		increment()
		await tick()
		expect(visible).toEqual({ count: 1, person: 'Avery' })
		first.unmount()
		await tick()
		expect(visible).toEqual({ count: 1, person: 'Avery' })
		updatePerson('Jordan')
		await tick()
		expect(visible).toEqual({ count: 1, person: 'Jordan' })
	} finally {
		root.unmount()
	}
})
