// Uses the maintained TimeInputShowcase example; do not copy its implementation here.
import { TimeInputShowcase as Example } from '@xplat/astryx-sandbox/examples/datetime/TimeInputShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'timeinput/basic',
  title: 'TimeInput / Basic',
  componentId: '@octane-xplat/ui#TimeInput',
  targets: ['web'],
  component: Example,
  args: {},
})
