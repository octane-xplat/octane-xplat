// Uses the maintained ButtonShowcase example; do not copy its implementation here.
import { ButtonShowcase as Example } from '@xplat/astryx-sandbox/examples/button/ButtonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'button/basic',
  title: 'Button / Basic',
  componentId: '@octane-xplat/ui#Button',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
