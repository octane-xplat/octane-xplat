// Uses the maintained TopNavMegaMenuShowcase example; do not copy its implementation here.
import { TopNavMegaMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavmegamenu/TopNavMegaMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavmegamenu/basic',
  title: 'TopNavMegaMenu / Basic',
  componentId: '@octane-xplat/ui#TopNavMegaMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
