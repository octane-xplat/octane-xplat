// Uses the maintained SideNavCollapseButtonShowcase example; do not copy its implementation here.
import { SideNavCollapseButtonShowcase as Example } from '@xplat/astryx-sandbox/examples/sidenavcollapsebutton/SideNavCollapseButtonShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sidenavcollapsebutton/basic',
  title: 'SideNavCollapseButton / Basic',
  componentId: '@octane-xplat/ui#SideNavCollapseButton',
  targets: ['web'],
  component: Example,
  args: {},
})
