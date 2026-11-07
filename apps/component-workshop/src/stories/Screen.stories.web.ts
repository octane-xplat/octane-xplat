// Uses the maintained GlassDemo example; do not copy its implementation here.
import { GlassDemo as Example } from '@xplat/demos/GlassDemo.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'screen/basic',
  title: 'Screen / Basic',
  componentId: '@octane-xplat/ui#Screen',
  targets: ['web'],
  component: Example,
  args: {},
})
