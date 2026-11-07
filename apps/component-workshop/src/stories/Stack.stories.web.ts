// Uses the maintained DividerShowcase example; do not copy its implementation here.
import { DividerShowcase as Example } from '@xplat/astryx-sandbox/examples/divider/DividerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'stack/basic',
  title: 'Stack / Basic',
  componentId: '@octane-xplat/ui#Stack',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
