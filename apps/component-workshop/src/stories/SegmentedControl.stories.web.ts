// Uses the maintained SegmentedControlShowcase example; do not copy its implementation here.
import { SegmentedControlShowcase as Example } from '@xplat/astryx-sandbox/examples/segmented/SegmentedControlShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'segmentedcontrol/basic',
  title: 'SegmentedControl / Basic',
  componentId: '@octane-xplat/ui#SegmentedControl',
  targets: ['web'],
  component: Example,
  args: {},
})
