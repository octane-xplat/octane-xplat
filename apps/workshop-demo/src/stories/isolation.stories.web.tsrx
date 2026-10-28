import { createContext, createElement, createRoot, useContext, useState } from 'octane'
import { createStore, useStore, type Store } from '@octane-xplat/ui/data'
import { defineStory } from '@octane-xplat/workshop'

type Fixture = {
	account: Store<{ name: string }>
	nested: { label: string }
	own: (cleanup: () => void) => void
}

const Account = createContext<Fixture | null>(null)
function AccountProvider(props: { fixture: Fixture; children?: unknown }) {
	return <Account value={props.fixture}>{props.children}</Account>
}

function Overlay() {
	const fixture = useContext(Account)!
	const account = useStore(fixture.account)
	return (
		<div role="dialog" aria-label="Story account overlay">
			<p>{account.name}</p>
		</div>
	)
}

function Isolated(props: { label?: string; fixture: Fixture }) {
	const fixture = useContext(Account)!
	const account = useStore(fixture.account)
	const [local, setLocal] = useState(0)
	return (
		<section>
			<p data-isolation-value>
				{props.label ?? 'unset'} / {fixture.nested.label} / {account.name} / {local}
			</p>
			<button
				onClick={() => {
					fixture.account.set({ name: 'changed' })
					fixture.nested.label = 'changed'
					setLocal(local + 1)
				}}
			>
				Mutate data
			</button>
			<button
				onClick={() => {
					const element = document.createElement('div')
					document.body.append(element)
					const root = createRoot(element)
					fixture.own(() => {
						root.unmount()
						element.remove()
					})

					root.render(createElement(AccountProvider, { fixture }, createElement(Overlay, {})))
				}}
			>
				Open owned overlay
			</button>
		</section>
	)
}

export const Isolation = defineStory<{ label?: string }, void, Fixture>({
	id: 'isolation/resources',
	title: 'Examples / Isolation and overlay',
	targets: ['web'],
	component: Isolated,
	args: { label: 'default' },
	controls: { label: { type: 'string', allowUnset: true } },
	fixture: ({ onCleanup }) => ({
		account: createStore({ name: 'account' }),
		nested: { label: 'fixture' },
		own: onCleanup,
	}),
	providers: [AccountProvider],
})
