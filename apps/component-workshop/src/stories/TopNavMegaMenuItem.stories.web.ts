// Uses the maintained TopNavMegaMenuItemShowcase example; do not copy its implementation here.
import { TopNavMegaMenuItemShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavmegamenuitem/TopNavMegaMenuItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavmegamenuitem/basic',
  title: 'TopNavMegaMenuItem / Basic',
  componentId: '@octane-xplat/ui#TopNavMegaMenuItem',
  targets: ['web'],
  component: Example,
  args: {},
})
