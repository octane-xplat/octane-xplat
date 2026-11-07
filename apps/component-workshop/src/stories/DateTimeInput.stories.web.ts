// Uses the maintained DateTimeInputShowcase example; do not copy its implementation here.
import { DateTimeInputShowcase as Example } from '@xplat/astryx-sandbox/examples/datetime/DateTimeInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'datetimeinput/basic',
  title: 'DateTimeInput / Basic',
  componentId: '@octane-xplat/ui#DateTimeInput',
  targets: ['web'],
  component: Example,
  args: {},
})
