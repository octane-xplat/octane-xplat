/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { act, createContext, createRoot, useContext, useState } from 'octane'
import { useOwnedContent } from './use-owned-content.web.tsrx'
import type { ContentOwner } from './owned-content'

const Person = createContext('missing')
const PersonProvider: any = Person
let owner: ContentOwner
let increment = () => {}
let updatePerson = (_value: string) => {}
function Counter() {
	const [count, setCount] = useState(0)
	const person = useContext(Person)
	increment = () => setCount((value) => value + 1)
	return <button>{count + ':' + person}</button>
}

function App() {
	const content = useOwnedContent()
	const [person, setPerson] = useState('Avery')
	owner = content.owner
	updatePerson = setPerson
	return <PersonProvider value={person}>{content.element}</PersonProvider>
}

it('retains a later DOM portal and live providers when an earlier root is removed', () => {
	const container = document.createElement('div')
	const firstTarget = document.createElement('div')
	const secondTarget = document.createElement('div')
	const root = createRoot(container)
	act(() => root.render(App, {}))
	const first = owner.createRoot(firstTarget)
	const second = owner.createRoot(secondTarget)
	try {
		act(() => {
			first.render(Counter)
			second.render(Counter)
		})

		const button = secondTarget.querySelector('button')
		act(() => increment())
		expect(button?.textContent).toBe('1:Avery')
		act(() => first.unmount())
		expect(secondTarget.querySelector('button')).toBe(button)
		act(() => updatePerson('Jordan'))
		expect(button?.textContent).toBe('1:Jordan')
	} finally {
		act(() => root.unmount())
	}
})
