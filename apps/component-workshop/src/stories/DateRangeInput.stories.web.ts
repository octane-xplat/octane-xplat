// Uses the maintained DateRangeInputShowcase example; do not copy its implementation here.
import { DateRangeInputShowcase as Example } from '@xplat/astryx-sandbox/examples/datetime/DateRangeInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'daterangeinput/basic',
  title: 'DateRangeInput / Basic',
  componentId: '@octane-xplat/ui#DateRangeInput',
  targets: ['web'],
  component: Example,
  args: {},
})
