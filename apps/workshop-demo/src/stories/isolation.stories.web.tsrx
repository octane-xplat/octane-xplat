/** @jsxImportSource @octane-xplat/jsx/dom */
import { createContext, createElement, createRoot, useContext, useState } from 'octane'
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

  return (
    <div role="dialog" aria-label="Story account overlay">
      <p>{account.name}</p>
    </div>
  )
}

function Isolated(props: IsolationProps & { fixture: IsolationFixture }) {
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

export const Isolation = defineStory<IsolationProps, void, IsolationFixture>({
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
