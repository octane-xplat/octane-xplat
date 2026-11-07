// Uses the maintained ScrollableAreaShowcase example; do not copy its implementation here.
import { ScrollableAreaShowcase as Example } from '@xplat/astryx-sandbox/examples/scrollablearea/ScrollableAreaShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'scrollablearea/basic',
  title: 'ScrollableArea / Basic',
  componentId: '@octane-xplat/ui#ScrollableArea',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
