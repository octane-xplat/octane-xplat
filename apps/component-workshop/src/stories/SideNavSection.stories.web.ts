// Uses the maintained SideNavSectionShowcase example; do not copy its implementation here.
import { SideNavSectionShowcase as Example } from '@xplat/astryx-sandbox/examples/sidenavsection/SideNavSectionShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'sidenavsection/basic',
  title: 'SideNavSection / Basic',
  componentId: '@octane-xplat/ui#SideNavSection',
  targets: ['web'],
  component: Example,
  args: {},
})
