import { ImageCropExample as Example } from '../leaves.web.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'image-crop-imagecrop/basic',
  title: 'ImageCrop (image-crop) / Basic',
  componentId: '@octane-xplat/image-crop#ImageCrop',
  targets: ['web'],
  capabilities: [],
  component: Example,
  args: {},
})
