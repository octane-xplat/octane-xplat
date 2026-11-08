import { useState } from 'octane'
import { Pressable, Text } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

function Welcome() {
  const [count, setCount] = useState(0)

  return (
    <Pressable onPress={() => setCount(count + 1)}>
      <Text>Hello from Workshop: {count}</Text>
    </Pressable>
  )
}

export const Basic = defineStory({
  id: 'welcome/basic',
  title: 'Welcome / Basic',
  componentId: 'app/Welcome',
  targets: 'all',
  component: Welcome,
  args: {},
})
