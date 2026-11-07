// Uses the maintained TimerShowcase example; do not copy its implementation here.
import { TimerShowcase as Example } from '@xplat/astryx-sandbox/examples/timer/TimerShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'timer/basic',
  title: 'Timer / Basic',
  componentId: '@octane-xplat/ui#Timer',
  targets: ['web'],
  component: Example,
  args: {},
})
