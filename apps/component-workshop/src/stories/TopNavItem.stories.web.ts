// Uses the maintained TopNavItemShowcase example; do not copy its implementation here.
import { TopNavItemShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavitem/TopNavItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavitem/basic',
  title: 'TopNavItem / Basic',
  componentId: '@octane-xplat/ui#TopNavItem',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
