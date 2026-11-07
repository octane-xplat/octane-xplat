import { MotionExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'motion-presence/basic',
  title: 'Presence (motion) / Basic',
  componentId: '@octane-xplat/motion#Presence',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
