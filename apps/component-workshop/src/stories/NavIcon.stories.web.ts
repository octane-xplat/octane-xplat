// Uses the maintained NavIconShowcase example; do not copy its implementation here.
import { NavIconShowcase as Example } from '@xplat/astryx-sandbox/examples/navicon/NavIconShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'navicon/basic',
  title: 'NavIcon / Basic',
  componentId: '@octane-xplat/ui#NavIcon',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
