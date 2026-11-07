// Uses the maintained GridSpanShowcase example; do not copy its implementation here.
import { GridSpanShowcase as Example } from '@xplat/astryx-sandbox/examples/gridspan/GridSpanShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'gridspan/basic',
  title: 'GridSpan / Basic',
  componentId: '@octane-xplat/ui#GridSpan',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
