// Uses the maintained HeadingShowcase example; do not copy its implementation here.
import { HeadingShowcase as Example } from '@xplat/astryx-sandbox/examples/heading/HeadingShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'heading/basic',
  title: 'Heading / Basic',
  componentId: '@octane-xplat/ui#Heading',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
