import { PinInputExample as Example } from '../examples.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'pininput/basic',
  title: 'PinInput / Basic',
  componentId: '@octane-xplat/ui#PinInput',
  targets: ['web'],
  component: Example,
  args: {},
})
