// Uses the maintained VStackShowcase example; do not copy its implementation here.
import { VStackShowcase as Example } from '@xplat/astryx-sandbox/examples/vstack/VStackShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'vstack/basic',
  title: 'VStack / Basic',
  componentId: '@octane-xplat/ui#VStack',
  targets: ['web'],
  component: Example,
  args: {},
})
