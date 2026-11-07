// Uses the maintained LayoutDemo example; do not copy its implementation here.
import { LayoutDemo as Example } from '@xplat/demos/LayoutDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'absolute/basic',
  title: 'Absolute / Basic',
  componentId: '@octane-xplat/ui#Absolute',
  targets: ['web'],
  component: Example,
  args: {},
})
