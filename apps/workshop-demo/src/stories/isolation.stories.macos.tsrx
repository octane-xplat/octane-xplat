/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { createContext, useContext, useState } from 'octane'
import { Pressable, Text, openWindow } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'
import { defineStory } from '@octane-xplat/workshop'
import type { IsolationFixture, IsolationProps } from './isolation-fixture'

const Account = createContext<IsolationFixture | null>(null)
function AccountProvider(props: { fixture: IsolationFixture; children?: unknown }) {
  return <Account value={props.fixture}>{props.children}</Account>
}

function Overlay() {
  const fixture = useContext(Account)!
  const account = useStore(fixture.account)

  return <Text accessibilityLabel="Story account overlay">{account.name}</Text>
}

function Isolated(props: IsolationProps & { fixture: IsolationFixture }) {
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

export const Isolation = defineStory<IsolationProps, void, IsolationFixture>({
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
