// Uses the maintained SegmentedControlItemShowcase example; do not copy its implementation here.
import { SegmentedControlItemShowcase as Example } from '@xplat/astryx-sandbox/examples/segmented/SegmentedControlItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'segmentedcontrolitem/basic',
  title: 'SegmentedControlItem / Basic',
  componentId: '@octane-xplat/ui#SegmentedControlItem',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
