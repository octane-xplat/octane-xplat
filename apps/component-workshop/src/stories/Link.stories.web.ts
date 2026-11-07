// Uses the maintained LinkShowcase example; do not copy its implementation here.
import { LinkShowcase as Example } from '@xplat/astryx-sandbox/examples/link/LinkShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'link/basic',
  title: 'Link / Basic',
  componentId: '@octane-xplat/ui#Link',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
