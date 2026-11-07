// Uses the maintained GridShowcase example; do not copy its implementation here.
import { GridShowcase as Example } from '@xplat/astryx-sandbox/examples/grid/GridShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'grid/basic',
  title: 'Grid / Basic',
  componentId: '@octane-xplat/ui#Grid',
  targets: ['web'],
  component: Example,
  args: {},
})
