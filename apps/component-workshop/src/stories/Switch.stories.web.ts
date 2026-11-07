// Uses the maintained SwitchWithDescription example; do not copy its implementation here.
import { SwitchWithDescription as Example } from '@xplat/astryx-sandbox/examples/switch/SwitchWithDescription.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'switch/basic',
  title: 'Switch / Basic',
  componentId: '@octane-xplat/ui#Switch',
  targets: ['web'],
  component: Example,
  args: {},
})
