import { AnimatedImageExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'gif-animatedimage/basic',
  title: 'AnimatedImage (gif) / Basic',
  componentId: '@octane-xplat/gif#AnimatedImage',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
