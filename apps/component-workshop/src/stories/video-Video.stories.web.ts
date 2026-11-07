import { VideoExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'video-video/basic',
  title: 'Video (video) / Basic',
  componentId: '@octane-xplat/video#Video',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
