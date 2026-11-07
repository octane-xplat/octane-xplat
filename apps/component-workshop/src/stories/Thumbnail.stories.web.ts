// Uses the maintained ThumbnailShowcase example; do not copy its implementation here.
import { ThumbnailShowcase as Example } from '@xplat/astryx-sandbox/examples/media/ThumbnailShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'thumbnail/basic',
  title: 'Thumbnail / Basic',
  componentId: '@octane-xplat/ui#Thumbnail',
  targets: ['web'],
  component: Example,
  args: {},
})
