// Uses the maintained GoalCounter example; do not copy its implementation here.
import { GoalCounter as Example } from '@xplat/demos/GoalCounter.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'pressable/basic',
  title: 'Pressable / Basic',
  componentId: '@octane-xplat/ui#Pressable',
  targets: ['web'],
  component: Example,
  args: {},
})
