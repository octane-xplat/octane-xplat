// Uses the maintained DateInputShowcase example; do not copy its implementation here.
import { DateInputShowcase as Example } from '@xplat/astryx-sandbox/examples/datetime/DateInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dateinput/basic',
  title: 'DateInput / Basic',
  componentId: '@octane-xplat/ui#DateInput',
  targets: ['web'],
  component: Example,
  args: {},
})
