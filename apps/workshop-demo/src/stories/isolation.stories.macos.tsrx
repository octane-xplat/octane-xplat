/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { createContext, useContext, useState } from 'octane'
import { Pressable, Text, openWindow } from '@octane-xplat/ui'
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
	return <Text accessibilityLabel="Story account overlay">{account.name}</Text>
}

function Isolated(props: { label?: string; fixture: Fixture }) {
	const fixture = useContext(Account)!
	const account = useStore(fixture.account)
	const [local, setLocal] = useState(0)
	return (
		<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
			<Text testID="isolation-value">
				{props.label ?? 'unset'} / {fixture.nested.label} / {account.name} / {local}
			</Text>
			<Pressable
				accessibilityLabel="Mutate data"
				onPress={() => {
					fixture.account.set({ name: 'changed' })
					fixture.nested.label = 'changed'
					setLocal(local + 1)
				}}
			>
				<Text>Mutate data</Text>
			</Pressable>
			<Pressable
				accessibilityLabel="Open owned overlay"
				onPress={() => {
					openWindow({ component: Overlay, title: 'Story account overlay' } as any)
				}}
			>
				<Text>Open owned overlay</Text>
			</Pressable>
		</masonview>
	)
}

export const Isolation = defineStory<{ label?: string }, void, Fixture>({
	id: 'isolation/resources',
	title: 'Examples / Isolation and overlay',
	targets: ['macos'],
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
