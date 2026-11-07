// Uses the maintained TopNavMegaMenuFeaturedCardShowcase example; do not copy its implementation here.
import { TopNavMegaMenuFeaturedCardShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavmegamenufeaturedcard/TopNavMegaMenuFeaturedCardShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavmegamenufeaturedcard/basic',
  title: 'TopNavMegaMenuFeaturedCard / Basic',
  componentId: '@octane-xplat/ui#TopNavMegaMenuFeaturedCard',
  targets: ['web'],
  component: Example,
  args: {},
})
