// Uses the maintained SideNavHeadingShowcase example; do not copy its implementation here.
import { SideNavHeadingShowcase as Example } from '@xplat/astryx-sandbox/examples/sidenavheading/SideNavHeadingShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sidenavheading/basic',
  title: 'SideNavHeading / Basic',
  componentId: '@octane-xplat/ui#SideNavHeading',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
