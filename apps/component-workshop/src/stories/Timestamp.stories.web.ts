// Uses the maintained TimestampShowcase example; do not copy its implementation here.
import { TimestampShowcase as Example } from '@xplat/astryx-sandbox/examples/timestamp/TimestampShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'timestamp/basic',
  title: 'Timestamp / Basic',
  componentId: '@octane-xplat/ui#Timestamp',
  targets: ['web'],
  component: Example,
  args: {},
})
