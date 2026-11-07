import { MotionExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'motion-layoutgroup/basic',
  title: 'LayoutGroup (motion) / Basic',
  componentId: '@octane-xplat/motion#LayoutGroup',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
