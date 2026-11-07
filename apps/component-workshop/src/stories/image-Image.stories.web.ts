import { ImageExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'image-image/basic',
  title: 'Image (image) / Basic',
  componentId: '@octane-xplat/image#Image',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
