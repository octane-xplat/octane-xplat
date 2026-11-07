// Uses the maintained AspectRatioSquareImage example; do not copy its implementation here.
import { AspectRatioSquareImage as Example } from '@xplat/astryx-sandbox/examples/media/AspectRatioSquareImage.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'image/basic',
  title: 'Image / Basic',
  componentId: '@octane-xplat/ui#Image',
  targets: ['web'],
  component: Example,
  args: {},
})
