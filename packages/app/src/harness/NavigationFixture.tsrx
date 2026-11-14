/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useState } from 'octane'
import { Button, Text, TextInput, View } from '@octane-xplat/ui'
import {
  createPaneRouterHost,
  createRouter,
  defineRoute,
  defineRoutes,
  RouterPane,
  useRouter,
} from '@octane-xplat/ui/routing'

const detail = defineRoute({ path: '/detail' })
const BackAction = createContext<() => void>(() => {
  throw new Error('Fixture router owner missing.')
})

function Detail() @{
  const back = useContext(BackAction)

  <View className="hc-column">
    <Text id="hf-nav-detail">Harness detail route</Text>
    <Button id="hf-nav-back" label="Back to retained fixture" onPress={back} />
  </View>
}

function createNavigationOwner() {
  const host = createPaneRouterHost()
  const navigation = createRouter({
    catalog: defineRoutes([detail.screen(Detail)]),
    host: host.host,
    stacks: ['check'],
  })

  host.attach(navigation)
  return { host, navigation, dispose: () => navigation.dispose() }
}

type NavigationOwner = ReturnType<typeof createNavigationOwner>
function Base(props: { owner: NavigationOwner }) @{
  const navigation = useRouter(props.owner.navigation)
  const [draft, setDraft] = useState('')

  <View className="hc-column">
    <TextInput id="hf-nav-draft" label="Retained route draft" value={draft} onChange={setDraft} />
    <Button
      id="hf-nav-open"
      label="Push detail route"
      onPress={() => navigation.push({ to: '/detail' })}
    />
  </View>
}

export function NavigationFixture() @{
  const [owner] = useState(createNavigationOwner)

  useEffect(() => () => owner.dispose(), [])

  <BackAction
    value={() => {
      void owner.navigation.forStack('check').back()
    }}
  >
    <RouterPane host={owner.host} router={owner.navigation} stack="check">
      <Base owner={owner} />
    </RouterPane>
  </BackAction>
}
