import { MotionExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'motion-motionconfig/basic',
  title: 'MotionConfig (motion) / Basic',
  componentId: '@octane-xplat/motion#MotionConfig',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
