// Uses the maintained SideNavItemShowcase example; do not copy its implementation here.
import { SideNavItemShowcase as Example } from '@xplat/astryx-sandbox/examples/sidenavitem/SideNavItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sidenavitem/basic',
  title: 'SideNavItem / Basic',
  componentId: '@octane-xplat/ui#SideNavItem',
  targets: ['web'],
  component: Example,
  args: {},
})
