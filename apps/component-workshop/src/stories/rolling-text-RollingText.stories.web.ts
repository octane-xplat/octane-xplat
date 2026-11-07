import { RollingTextExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'rolling-text-rollingtext/basic',
  title: 'RollingText (rolling-text) / Basic',
  componentId: '@octane-xplat/rolling-text#RollingText',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
