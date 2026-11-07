// Uses the maintained SideNavShowcase example; do not copy its implementation here.
import { SideNavShowcase as Example } from '@xplat/astryx-sandbox/examples/sidenav/SideNavShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sidenav/basic',
  title: 'SideNav / Basic',
  componentId: '@octane-xplat/ui#SideNav',
  targets: ['web'],
  component: Example,
  args: {},
})
