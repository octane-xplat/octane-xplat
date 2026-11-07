// Uses the maintained HStackShowcase example; do not copy its implementation here.
import { HStackShowcase as Example } from '@xplat/astryx-sandbox/examples/hstack/HStackShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'hstack/basic',
  title: 'HStack / Basic',
  componentId: '@octane-xplat/ui#HStack',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
